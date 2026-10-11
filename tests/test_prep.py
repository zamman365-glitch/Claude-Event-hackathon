"""
tests/test_prep.py
Tests for data cleaning, header stripping, and embedded rule extraction.
"""

from pathlib import Path
from data_prep import clean_and_split_rules, normalize_whitespace, strip_running_headers


def test_strip_running_headers():
    raw_text = """Rule 56   M.P. Bhumi Vikas Rules, 2012   78
56. Residential Buildings.-Open Spaces,- Exterior open spaces
Rule 56                             M.P. Bhumi Vikas Rules, 2012                       79
Front open space shall be provided."""
    cleaned = strip_running_headers(raw_text)
    assert "Rule 56   M.P. Bhumi Vikas Rules, 2012   78" not in cleaned
    assert "Rule 56                             M.P. Bhumi Vikas Rules, 2012                       79" not in cleaned
    assert "56. Residential Buildings.-Open Spaces" in cleaned
    assert "Front open space shall be provided" in cleaned


def test_embedded_rule_extraction():
    rules = clean_and_split_rules("data/bhumi_vikas_rules.jsonl")
    rule_map = {r["rule"]: r for r in rules}

    # Verify total count: 106 original rules + 6 split rules = 112 rules
    assert len(rules) == 112

    # Check that all 6 embedded rules exist as distinct entries
    expected_embedded = ["12-A", "17-a", "25(A)", "26-A", "42-A", "93(a)"]
    for emb_no in expected_embedded:
        assert emb_no in rule_map, f"Embedded rule {emb_no} missing from split rules"
        emb = rule_map[emb_no]
        assert emb["is_embedded"] is True
        assert emb["page_start"] > 0
        assert len(emb["text"]) > 20

    # Check parent rules had the embedded child removed
    r12 = rule_map["12"]
    assert "12 A. For residential plots" not in r12["text"]

    r17 = rule_map["17"]
    assert "17-a. \"Agricultural tourist facility\"" not in r17["text"]

    r25 = rule_map["25"]
    assert "25(A). Appeal and revision" not in r25["text"]
