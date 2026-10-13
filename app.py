"""
app.py
FastAPI application for Bhumi Vikas Sahayak.
Dedicated backend for Bhopal Municipal Corporation building-permission counter.
"""

from __future__ import annotations
from contextlib import asynccontextmanager
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException


BASE_DIR = Path(__file__).resolve().parent
_ENV_PATH = BASE_DIR / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()

from amendments import AMENDMENTS, RULES_VERSION
from calculators import run_all_applicable_calculators
from db import get_all_rules, get_rule_by_number, init_database, search_rules_with_snippets
from llm import LLMProviderError, PROVIDER, get_provider, is_mock, sanitize_secret_text
from schemas import (
    BhumiVikasResponse,
    QueryRequest,
    RuleSearchResultItem,
    RuleSummaryItem,
)
from service import process_query

logger = logging.getLogger("bhumi_vikas.api")



@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="Bhumi Vikas Sahayak API",
    description="Backend assistant for Bhopal Municipal Corporation building-permission clerk (MP Bhumi Vikas Rules 2012)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# Mount resources directory as static files at /pdf
RESOURCES_DIR = BASE_DIR / "resources"
if RESOURCES_DIR.exists():
    app.mount("/pdf", StaticFiles(directory=str(RESOURCES_DIR)), name="pdf")


class CalculateRequest(BaseModel):
    plot_area: Optional[float] = Field(None, description="Plot area in square metres")
    road_width: Optional[float] = Field(None, description="Street / road width in metres")
    building_height: Optional[float] = Field(9.0, description="Building height in metres (default 9.0m)")
    built_up_area: Optional[float] = Field(None, description="Built-up area in square metres")
    use_group: str = Field("residential", description="residential | commercial | farmhouse")


@app.post("/api/query", response_model=BhumiVikasResponse)
def handle_query(req: QueryRequest) -> BhumiVikasResponse:
    """Answers a clerk query in English or Hindi with exact rule citations and calculations."""
    try:
        return process_query(req.query, lang=req.lang)
    except LLMProviderError as e:
        logger.error("LLM Provider error in /api/query: %s", sanitize_secret_text(str(e)))
        status_code = e.status_code if e.status_code in [400, 401, 403, 404, 429, 502, 503, 504] else 502
        raise HTTPException(
            status_code=status_code,
            detail=f"LLM Provider Error: {sanitize_secret_text(str(e))}"
        )
    except Exception as e:
        logger.error("Unexpected error in /api/query: %s", sanitize_secret_text(str(e)))
        raise HTTPException(status_code=500, detail="Internal server error processing query.")


@app.post("/api/calculate")
def handle_calculate(req: CalculateRequest) -> Dict[str, Any]:
    """Direct calculation engine for setbacks, FAR, and fees."""
    return run_all_applicable_calculators(
        plot_area=req.plot_area,
        road_width=req.road_width,
        building_height=req.building_height,
        built_up_area=req.built_up_area,
        use_group=req.use_group,
    )


@app.get("/api/rules", response_model=List[RuleSummaryItem])
def list_rules() -> List[Dict[str, Any]]:
    """Returns a summary of every rule chunk: rule_no, sub_rule, title, part, page_start, page_end."""
    return get_all_rules()


@app.get("/api/rules/search", response_model=List[RuleSearchResultItem])
def search_rules_endpoint(
    q: str = Query(..., description="Search query or keyword across MP Bhumi Vikas Rules"),
) -> List[Dict[str, Any]]:
    """Searches rules using the FTS5 index and returns matching rules with snippets."""
    return search_rules_with_snippets(q, top_k=10)


@app.get("/api/rules/{rule_no}")
def get_rule_details(rule_no: str) -> Dict[str, Any]:
    """Retrieves authoritative rule text by number."""
    rule = get_rule_by_number(rule_no)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_no} not found.")
    return rule


@app.get("/api/amendments")
def list_amendments() -> List[Dict[str, Any]]:
    """Lists amendments beyond the 6 March 2025 consolidated copy."""
    return AMENDMENTS


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Health status including provider and mock indicator."""
    active_provider = get_provider()
    return {
        "status": "healthy",
        "service": "Bhumi Vikas Sahayak",
        "rules_version": RULES_VERSION,
        "clerk_target": "Bhopal Municipal Corporation Building-Permission Counter",
        "provider": active_provider,
        "mock": active_provider == "mock",
    }


class SPAStaticFiles(StaticFiles):
    """
    StaticFiles with Single Page Application (SPA) fallback to index.html.
    Ensures client-side routes like /qa, /history, /explore work on browser refresh,
    while non-existent /api/* or /pdf/* or docs routes still return 404.
    """
    async def get_response(self, path: str, scope):
        clean_path = path.replace("\\", "/").strip("/")
        # Do not intercept API, PDF, or documentation endpoints
        is_reserved = (
            clean_path.startswith("api")
            or clean_path.startswith("pdf")
            or clean_path.startswith("docs")
            or clean_path.startswith("redoc")
            or clean_path == "openapi.json"
        )
        try:
            response = await super().get_response(path, scope)
            if response.status_code == 404 and not is_reserved:
                index_path = Path(self.directory) / "index.html"
                if index_path.is_file():
                    return FileResponse(str(index_path))
            return response
        except (StarletteHTTPException, Exception) as ex:
            if (getattr(ex, "status_code", None) == 404 or isinstance(ex, StarletteHTTPException)) and not is_reserved:
                index_path = Path(self.directory) / "index.html"
                if index_path.is_file():
                    return FileResponse(str(index_path))
            raise


# Mount frontend/dist if built, otherwise serve friendly JSON pointing to /docs
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", SPAStaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "service": "Bhumi Vikas Sahayak API",
            "message": "API is running. Visit /docs for OpenAPI documentation.",
            "health": "/api/health",
        }


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)

