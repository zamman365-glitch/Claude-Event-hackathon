"""
verifier.py
Verification engine for MP Bhumi Vikas Sahayak.

Hard Rule 2:
Every answer needs citations {rule, page, quote}.
verifier.py must check each quote is a substring of the retrieved chunk text
(whitespace normalised). If it fails, retry once, then return status "not_found".

Extended Rule:
Check that every number in the answer appears in either:
1. The calculator output (verified numbers), or
2. The cited quotes / source chunk text, or
3. The user query, or
4. The rule numbers cited.
"""

from __future__ import annotations
import re
from typing import Any, Dict, List, Optional, Set, Tuple


def normalize_whitespace(text: str) -> str:
    """Collapses any sequence of whitespace characters into a single space."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def extract_numbers(text: str) -> Set[float]:
    """
    Extracts all numerical values (integers, decimals) from text.
    Handles formats like 10, 3.6, 1,250, 0.40, 500.
    """
    cleaned = text.replace(",", "")
    tokens = re.findall(r"\b\d+(?:\.\d+)?\b", cleaned)
    numbers = set()
    for tok in tokens:
        try:
            val = float(tok)
            numbers.add(val)
        except ValueError:
            continue
    return numbers


def verify_citation_quote(
    quote: str,
    source_chunk_text: str,
) -> bool:
    """
    Checks if the normalized quote is an exact substring of the normalized source chunk text.
    """
    norm_quote = normalize_whitespace(quote).lower()
    norm_chunk = normalize_whitespace(source_chunk_text).lower()

    if not norm_quote:
        return False

    return norm_quote in norm_chunk


def verify_answer(
    answer: str,
    citations: List[Dict[str, Any]],
    retrieved_chunks: List[Dict[str, Any]],
    calculator_numbers: Optional[List[float]] = None,
    user_query: str = "",
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Comprehensive verification:
    1. Checks each citation quote is a substring of its corresponding rule chunk.
    2. Checks every number in the answer is grounded in calculator results, quotes, rule text, or user query.
    
    Returns: (is_valid, error_reason, details_dict)
    """
    if not answer or not answer.strip():
        return False, "Empty answer", {}

    chunks_by_rule = {
        str(c.get("rule", "")).strip().upper(): c.get("text", "")
        for c in retrieved_chunks
    }
    all_chunks_text = " ".join(c.get("text", "") for c in retrieved_chunks)

    # 1. Quote Substring Verification
    if not citations:
        return False, "Answer has no citations", {"citations": 0}

    failed_quotes: List[Dict[str, Any]] = []
    quotes_combined = ""
    for cit in citations:
        quote = cit.get("quote", "")
        rule = str(cit.get("rule", "")).strip().upper()
        quotes_combined += " " + quote

        matched = False
        # First check specific rule chunk if available
        if rule in chunks_by_rule:
            matched = verify_citation_quote(quote, chunks_by_rule[rule])

        # Fallback: check across all retrieved chunks
        if not matched:
            matched = verify_citation_quote(quote, all_chunks_text)

        if not matched:
            failed_quotes.append({
                "rule": cit.get("rule"),
                "page": cit.get("page"),
                "quote": quote,
            })

    if failed_quotes:
        reason = f"Citation quotes failed substring check: {failed_quotes}"
        return False, reason, {"failed_quotes": failed_quotes}

    # 2. Number Grounding Verification
    answer_numbers = extract_numbers(answer)
    if answer_numbers:
        allowed_numbers: Set[float] = set()

        # From calculator
        if calculator_numbers:
            for n in calculator_numbers:
                allowed_numbers.add(round(float(n), 4))
                if float(n).is_integer():
                    allowed_numbers.add(float(int(n)))

        # From citations and chunks
        chunk_numbers = extract_numbers(all_chunks_text)
        allowed_numbers.update(chunk_numbers)

        quote_numbers = extract_numbers(quotes_combined)
        allowed_numbers.update(quote_numbers)

        # From user query
        query_numbers = extract_numbers(user_query)
        allowed_numbers.update(query_numbers)

        # From rule numbers
        for c in citations:
            r_str = str(c.get("rule", ""))
            allowed_numbers.update(extract_numbers(r_str))

        # From amendments (e.g. 500 sq m, 28 Aug 2026)
        try:
            from amendments import AMENDMENTS
            for amd in AMENDMENTS:
                allowed_numbers.update(extract_numbers(str(amd)))
        except Exception:
            pass

        # Check for ungrounded numbers
        ungrounded = []
        for num in answer_numbers:
            # Check with small tolerance for float representations
            is_present = False
            for allowed in allowed_numbers:
                if abs(num - allowed) < 1e-4:
                    is_present = True
                    break
            if not is_present:
                ungrounded.append(num)

        if ungrounded:
            reason = f"Answer contains ungrounded numbers not found in calculator, quotes, source text, or query: {ungrounded}"
            return False, reason, {"ungrounded_numbers": ungrounded}

    return True, "Verification passed", {
        "verified_quotes_count": len(citations),
        "numbers_checked": len(answer_numbers),
    }


if __name__ == "__main__":
    sample_chunk = "56. Residential Buildings.-Open Spaces,- Exterior open spaces for buildings having height up to 12.5 meters. (1) Front open spaces,- Up to 9.0 meters width of street: 3.0 meters."
    citations = [{"rule": "56", "page": 77, "quote": "Up to 9.0 meters width of street: 3.0 meters."}]
    retrieved = [{"rule": "56", "text": sample_chunk}]

    valid, reason, info = verify_answer(
        answer="You must leave a 3.0 meters front open space for a 9.0 m street under Rule 56.",
        citations=citations,
        retrieved_chunks=retrieved,
        calculator_numbers=[3.0, 9.0, 56.0],
        user_query="My street is 9 meters.",
    )
    print("Verification test result:", valid, reason)
