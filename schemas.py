"""
schemas.py
Pydantic data models for MP Bhumi Vikas Sahayak.
"""

from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

RULES_VERSION_CURRENT = "consolidated up to 2025-03-06"
LEGAL_DISCLAIMER = "The tool points to the rule; the clerk decides. It is not legal advice."


class Citation(BaseModel):
    rule: str = Field(description="The rule number, e.g. '56', '21', '17', '12-A'")
    page: int = Field(description="The PDF page number where the quote appears")
    quote: str = Field(description="Exact substring from the English rule text")


class ParsedQuery(BaseModel):
    language: Literal["en", "hi"] = Field(
        default="en",
        description="Detected language of the user query ('en' or 'hi')"
    )
    query_en: str = Field(
        description="The query rewritten in clear English for retrieval over English rules"
    )
    is_out_of_scope: bool = Field(
        default=False,
        description="True if the query is outside MP Bhumi Vikas Rules (e.g. property tax payment, market land rates)"
    )
    needs_info: bool = Field(
        default=False,
        description="True if essential details are missing and a clarifying question is required"
    )
    clarifying_question: Optional[str] = Field(
        default=None,
        description="Clarifying question in the user's language if needs_info is true"
    )
    plot_area: Optional[float] = Field(
        default=None,
        description="Plot area in square metres extracted from query"
    )
    road_width: Optional[float] = Field(
        default=None,
        description="Facing road/street width in metres extracted from query"
    )
    building_height: Optional[float] = Field(
        default=None,
        description="Building height in metres extracted from query"
    )
    built_up_area: Optional[float] = Field(
        default=None,
        description="Proposed or constructed built-up area in square metres"
    )
    use: Optional[str] = Field(
        default="residential",
        description="Intended land use: residential, commercial, farmhouse, industrial, etc."
    )
    floors: Optional[int] = Field(
        default=None,
        description="Number of floors mentioned in query"
    )


class LLMAnswerOutput(BaseModel):
    status: Literal["answered", "not_found", "needs_info"] = Field(
        description="Response status: answered | not_found | needs_info"
    )
    answer: str = Field(
        description="Short direct answer in the user's language (English or Hindi). If status is not_found, say 'not found' / 'यह जानकारी म.प्र. भूमि विकास नियमों में नहीं मिली।'"
    )
    clarifying_question: Optional[str] = Field(
        default=None,
        description="Question asking for missing information when status is needs_info"
    )
    rule_no: Optional[str] = Field(
        default=None,
        description="Primary rule number(s) answering the question"
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Authoritative citations. Quotes MUST be exact substrings from the English rule text"
    )


class QueryRequest(BaseModel):
    query: str = Field(description="The question asked by the clerk in English or Hindi")


class BhumiVikasResponse(BaseModel):
    status: Literal["answered", "not_found", "needs_info"]
    answer: str
    clarifying_question: Optional[str] = None
    rule_no: Optional[str] = None
    citations: List[Citation] = Field(default_factory=list)
    rules_version: str = RULES_VERSION_CURRENT
    warnings: List[str] = Field(default_factory=list)
    calculation: Optional[Dict[str, Any]] = None
    disclaimer: str = LEGAL_DISCLAIMER
