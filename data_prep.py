"""
data_prep.py
Preprocessing and cleaning for MP Bhumi Vikas Rules 2012.

Quirks handled:
1. Running headers like 'Rule 56   M.P. Bhumi Vikas Rules, 2012   78' inside text are stripped.
2. Embedded rules are split into their own distinct records:
   - 12-A: Instant/deemed approval for residential plots up to 186 sqm (from Rule 12)
   - 17-a: Agricultural tourist facility (from Rule 17)
   - 25(A): Appeal and revision (from Rule 25)
   - 26-A: Authorised Architect/Structural Engineer (from Rule 26)
   - 42-A: Norms for Information Technology (from Rule 42)
   - 93(a): Dual water piping system (from Rule 93)
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List

# Pattern matching running headers from the PDF text
HEADER_REGEX = re.compile(
    r"^\s*Rule\s+[0-9A-Za-z\-\(\)]+.*?M\.?P\.?\s*Bhumi\s*Vikas\s*Rules.*?\d*\s*$",
    re.IGNORECASE | re.MULTILINE,
)

# Definitions of embedded rules to extract from parents
EMBEDDED_RULES_CONFIG = [
    {
        "parent_rule": "12",
        "rule": "12-A",
        "title": "Instant/deemed approval for residential plots up to 186 sqm",
        "part": "Part II: Building Permission",
        "marker": "12 A. For residential plots",
        "page_start": 21,
        "page_end": 22,
    },
    {
        "parent_rule": "17",
        "rule": "17-a",
        "title": "Agricultural tourist facility in area designated for agriculture use",
        "part": "Part II: Building Permission",
        "marker": "17-a. \"Agricultural tourist facility\"",
        "page_start": 34,
        "page_end": 34,
    },
    {
        "parent_rule": "25",
        "rule": "25(A)",
        "title": "Appeal and revision",
        "part": "Part II: Building Permission",
        "marker": "25(A). Appeal and revision",
        "page_start": 43,
        "page_end": 43,
    },
    {
        "parent_rule": "26",
        "rule": "26-A",
        "title": "Authorised Architect/Structural Engineer to grant building permission",
        "part": "Part II: Building Permission",
        "marker": "26.A.",
        "page_start": 47,
        "page_end": 47,
    },
    {
        "parent_rule": "42",
        "rule": "42-A",
        "title": "Norms for Information Technology",
        "part": "Part IV: General Building Requirements",
        "marker": "42A. Norms for Information Technology",
        "page_start": 64,
        "page_end": 65,
    },
    {
        "parent_rule": "93",
        "rule": "93(a)",
        "title": "Dual water piping system",
        "part": "Part VII: Plumbing Services",
        "marker": "93(a)",
        "page_start": 102,
        "page_end": 102,
    },
]


def strip_running_headers(text: str) -> str:
    """Removes running headers from the raw PDF layout text."""
    cleaned = HEADER_REGEX.sub("", text)
    # Collapse multiple consecutive blank lines down to two
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def normalize_whitespace(text: str) -> str:
    """Normalizes whitespace (collapsing any whitespace run to a single space)."""
    return re.sub(r"\s+", " ", text).strip()


def clean_and_split_rules(jsonl_path: str | Path) -> List[Dict[str, Any]]:
    """
    Loads raw rules from bhumi_vikas_rules.jsonl,
    strips running headers, and splits embedded rules into their own chunks.
    """
    path = Path(jsonl_path)
    if not path.exists():
        raise FileNotFoundError(f"Rules file not found at: {path}")

    raw_rules: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                raw_rules.append(json.loads(line))

    rules_by_num: Dict[str, Dict[str, Any]] = {r["rule"]: dict(r) for r in raw_rules}

    # Extract embedded rules from their parents
    for cfg in EMBEDDED_RULES_CONFIG:
        parent_no = cfg["parent_rule"]
        if parent_no not in rules_by_num:
            continue

        parent = rules_by_num[parent_no]
        parent_text = parent["text"]
        marker = cfg["marker"]

        idx = parent_text.find(marker)
        if idx == -1:
            # Fallback search case-insensitively
            m = re.search(re.escape(marker), parent_text, re.IGNORECASE)
            idx = m.start() if m else -1

        if idx != -1:
            # Find any preceding footnote brackets like '1\n[' or '[' just before marker
            cut_start = idx
            prefix = parent_text[max(0, idx - 30):idx]
            bracket_match = re.search(r"(\d*\s*\[)\s*$", prefix)
            if bracket_match:
                cut_start = idx - (len(bracket_match.group(1)))

            child_raw_text = parent_text[cut_start:].strip()
            # If child text ends with closing bracket ']' from footnote insertion, clean it
            if child_raw_text.endswith("]"):
                child_raw_text = child_raw_text[:-1].rstrip()
            if child_raw_text.startswith("["):
                child_raw_text = child_raw_text[1:].lstrip()

            parent["text"] = parent_text[:cut_start].rstrip()

            child_entry: Dict[str, Any] = {
                "rule": cfg["rule"],
                "title": cfg["title"],
                "part": cfg["part"],
                "page_start": cfg["page_start"],
                "page_end": cfg["page_end"],
                "text": child_raw_text,
                "is_embedded": True,
                "parent_rule": parent_no,
            }
            rules_by_num[cfg["rule"]] = child_entry

    # Strip running headers and normalize fields
    processed_rules: List[Dict[str, Any]] = []
    for r_num, rule_data in rules_by_num.items():
        clean_text = strip_running_headers(rule_data["text"])
        entry = {
            "rule": rule_data["rule"],
            "title": rule_data["title"],
            "part": rule_data.get("part", ""),
            "page_start": int(rule_data["page_start"]),
            "page_end": int(rule_data["page_end"]),
            "text": clean_text,
            "raw_text": rule_data["text"],
            "text_norm": normalize_whitespace(clean_text),
            "is_embedded": rule_data.get("is_embedded", False),
            "parent_rule": rule_data.get("parent_rule", None),
        }
        processed_rules.append(entry)

    # Sort rules: numeric first, then suffixes like 12-A, 26-B
    def sort_key(item: Dict[str, Any]):
        r_str = item["rule"]
        num_part = re.match(r"^(\d+)", r_str)
        num = int(num_part.group(1)) if num_part else 9999
        return (num, r_str)

    processed_rules.sort(key=sort_key)
    return processed_rules


if __name__ == "__main__":
    rules = clean_and_split_rules("data/bhumi_vikas_rules.jsonl")
    print(f"Total processed rules: {len(rules)}")
    for r in rules:
        if r.get("is_embedded"):
            print(f"Extracted embedded rule: {r['rule']} ({r['title']}) [pages {r['page_start']}-{r['page_end']}]")
