"""
app.py
FastAPI application for Bhumi Vikas Sahayak.
Dedicated backend for Bhopal Municipal Corporation building-permission counter.
"""

from __future__ import annotations
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from amendments import AMENDMENTS, RULES_VERSION
from calculators import run_all_applicable_calculators
from db import get_all_rules, get_rule_by_number, init_database, search_rules_with_snippets
from llm import PROVIDER
from schemas import (
    BhumiVikasResponse,
    QueryRequest,
    RuleSearchResultItem,
    RuleSummaryItem,
)
from service import process_query


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
    return process_query(req.query, lang=req.lang)


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
    return {
        "status": "healthy",
        "service": "Bhumi Vikas Sahayak",
        "rules_version": RULES_VERSION,
        "clerk_target": "Bhopal Municipal Corporation Building-Permission Counter",
        "provider": PROVIDER,
        "mock": PROVIDER == "mock",
    }


# Mount frontend/dist if built, otherwise serve friendly JSON pointing to /docs
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "service": "Bhumi Vikas Sahayak API",
            "message": "API is running. Visit /docs for OpenAPI documentation.",
            "health": "/api/health",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
