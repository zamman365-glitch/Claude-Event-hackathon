"""
service.py
Core orchestration service for Bhumi Vikas Sahayak.

Executes query parsing, parallel retrieval and calculation,
LLM answer generation, quote & number verification with retry,
and amendment warning enrichment.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional

from amendments import RULES_VERSION, check_amendment_warnings
from calculators import run_all_applicable_calculators
from db import search_rules
from llm import generate_answer, parse_query
from schemas import BhumiVikasResponse, Citation, ParsedQuery
from verifier import verify_answer


def process_query(query: str) -> BhumiVikasResponse:
    """
    Main processing pipeline:
    1. parse_query (language detection, English rewrite, parameter extraction).
    2. Parallel flow:
       - Retrieval: always runs against SQLite FTS5 using English query.
       - Calculators: runs whenever plot_area, road_width, or built_up_area are present.
    3. LLM generation with structured JSON output.
    4. Substring & number verification (retries 1x on failure, falls back to not_found).
    5. Amendment warning injection for Rule 2(5)(c) / plots up to 500 sq m.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return BhumiVikasResponse(
            status="not_found",
            answer="No question was provided.",
            rules_version=RULES_VERSION,
            warnings=[],
        )

    # 1. Query Parsing
    parsed: ParsedQuery = parse_query(cleaned_query)

    # Early exit for explicit out-of-scope questions (e.g. property tax, land market rate)
    if parsed.is_out_of_scope:
        ans_msg = (
            "यह जानकारी म.प्र. भूमि विकास नियमों में नहीं मिली।"
            if parsed.language == "hi"
            else "not found"
        )
        return BhumiVikasResponse(
            status="not_found",
            answer=ans_msg,
            rules_version=RULES_VERSION,
            warnings=[],
        )

    # 2. Parallel Flow: Retrieval and Calculation
    # Retrieval always runs
    retrieved_chunks = search_rules(parsed.query_en, top_k=4)

    # Calculators run when parameters are present
    calc_results = run_all_applicable_calculators(
        plot_area=parsed.plot_area,
        road_width=parsed.road_width,
        building_height=parsed.building_height,
        built_up_area=parsed.built_up_area,
        use_group=parsed.use or "residential",
    )
    verified_numbers = calc_results.get("verified_numbers", [])
    calculations_data = calc_results.get("calculations") if calc_results.get("calculations") else None

    # 3. LLM Answer Generation
    llm_output = generate_answer(
        query_parsed=parsed,
        original_query=cleaned_query,
        retrieved_chunks=retrieved_chunks,
        calculator_output=calc_results,
    )

    # 4. Verifier: Substring check and number grounding check
    if llm_output.status == "answered":
        citations_dict = [c.model_dump() for c in llm_output.citations]
        is_valid, reason, info = verify_answer(
            answer=llm_output.answer,
            citations=citations_dict,
            retrieved_chunks=retrieved_chunks,
            calculator_numbers=verified_numbers,
            user_query=cleaned_query,
        )

        # Retry once if verification failed
        if not is_valid:
            llm_output = generate_answer(
                query_parsed=parsed,
                original_query=cleaned_query,
                retrieved_chunks=retrieved_chunks,
                calculator_output=calc_results,
                retry_feedback=f"Previous verification failed: {reason}. Ensure exact English quote substring and grounded numbers.",
            )
            # Re-verify after retry
            citations_dict = [c.model_dump() for c in llm_output.citations]
            is_valid, reason, info = verify_answer(
                answer=llm_output.answer,
                citations=citations_dict,
                retrieved_chunks=retrieved_chunks,
                calculator_numbers=verified_numbers,
                user_query=cleaned_query,
            )
            # If still invalid, safely set status to not_found
            if not is_valid:
                llm_output.status = "not_found"
                llm_output.answer = (
                    "यह जानकारी म.प्र. भूमि विकास नियमों में नहीं मिली।"
                    if parsed.language == "hi"
                    else "not found"
                )
                llm_output.citations = []

    # 5. Amendment Warning Injection
    rules_cited = [c.rule for c in llm_output.citations]
    if llm_output.rule_no:
        rules_cited.append(llm_output.rule_no)

    warnings = check_amendment_warnings(
        query=cleaned_query,
        rules_cited=rules_cited,
        plot_area_sqm=parsed.plot_area,
        language=parsed.language,
    )

    return BhumiVikasResponse(
        status=llm_output.status,
        answer=llm_output.answer,
        clarifying_question=llm_output.clarifying_question,
        rule_no=llm_output.rule_no,
        citations=llm_output.citations,
        rules_version=RULES_VERSION,
        warnings=warnings,
        calculation=calculations_data,
    )


if __name__ == "__main__":
    print("Testing process_query pipeline:")
    res1 = process_query("My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?")
    print("\nResult Q1:", res1.model_dump_json(indent=2))

    res11 = process_query("Do I need separate development permission for a 300 sq m plot that matches the Development Plan?")
    print("\nResult Q11 (Amendment):", res11.model_dump_json(indent=2))

    res16 = process_query("How do I pay my property tax online?")
    print("\nResult Q16 (Out of scope):", res16.model_dump_json(indent=2))
