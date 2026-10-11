"""
tests/test_verifier.py
Tests for citation substring verification and number grounding.
"""

from verifier import extract_numbers, normalize_whitespace, verify_answer, verify_citation_quote


def test_normalize_whitespace():
    raw = "Rule  56 \n\n  Residential\t Buildings"
    assert normalize_whitespace(raw) == "Rule 56 Residential Buildings"


def test_verify_citation_quote():
    source = "Every Residential Building having height up to 12.5 meters, facing street shall have a front open space"
    # Exact substring
    assert verify_citation_quote("having height up to 12.5 meters", source) is True
    # Substring with different spacing and newline
    assert verify_citation_quote("having   height\n up to 12.5 meters", source) is True
    # Non-existent quote
    assert verify_citation_quote("having height up to 15.0 meters", source) is False


def test_number_grounding_rejects_hallucinations():
    source_chunk = [{"rule": "56", "text": "Up to 9.0 meters street requires 3.0 meters front open space."}]
    citations = [{"rule": "56", "page": 77, "quote": "Up to 9.0 meters street requires 3.0 meters front open space."}]

    # Answer contains ungrounded number 99.9
    valid, reason, info = verify_answer(
        answer="You must leave 3.0 meters open space and pay 99.9 rupees fee.",
        citations=citations,
        retrieved_chunks=source_chunk,
        calculator_numbers=[3.0, 9.0],
        user_query="My street is 9.0 meters.",
    )
    assert valid is False
    assert "ungrounded" in reason
    assert 99.9 in info.get("ungrounded_numbers", [])


def test_number_grounding_accepts_verified_numbers():
    source_chunk = [{"rule": "56", "text": "Up to 9.0 meters street requires 3.0 meters front open space."}]
    citations = [{"rule": "56", "page": 77, "quote": "Up to 9.0 meters street requires 3.0 meters front open space."}]

    valid, reason, info = verify_answer(
        answer="Under Rule 56, for a 9.0 meters road, front open space is 3.0 meters.",
        citations=citations,
        retrieved_chunks=source_chunk,
        calculator_numbers=[3.0, 9.0, 56.0],
        user_query="My street is 9.0 meters.",
    )
    assert valid is True
    assert "Verification passed" in reason
