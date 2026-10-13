"""
amendments.py
Registry and warning injector for amendments beyond the consolidated rules (2025-03-06).

Hard Rule 4:
Every response includes rules_version ("consolidated up to 2025-03-06") and a warnings[] list.
Anything touching Rule 2(5)(c) or plots up to 500 sq m adds the 28 Aug 2026 amendment warning
from amendments.json.
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
AMENDMENTS_PATH = BASE_DIR / "data" / "amendments.json"
RULES_VERSION = "consolidated up to 2025-03-06"


def load_amendments() -> List[Dict[str, Any]]:
    if not AMENDMENTS_PATH.exists():
        return []
    with open(AMENDMENTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


AMENDMENTS = load_amendments()


def check_amendment_warnings(
    query: str,
    rules_cited: List[str],
    plot_area_sqm: Optional[float] = None,
    language: str = "en",
) -> List[str]:
    """
    Checks if query or cited rules trigger the 28 August 2026 amendment warning:
    - Touching Rule 2(5)(c), Rule 2(5), or Rule 2
    - Involving plots up to 500 sq m and development/building permission
    - Explicit mentions of August 2026 amendment
    """
    warnings: List[str] = []
    q_lower = query.lower()

    # Rule checks
    touches_rule_2_5_c = any(
        r.upper() in ["2(5)(C)", "2(5)", "2"]
        or "2(5)(c)" in r.lower()
        or "2(5)" in r.lower()
        for r in rules_cited
    )

    # Plot size check
    is_plot_under_500 = False
    if plot_area_sqm is not None and 0 < plot_area_sqm <= 500.0:
        is_plot_under_500 = True

    # Regex search for plot <= 500 in text
    area_matches = re.findall(r"\b(\d+)\s*(?:sq\s*m|sqm|वर्ग\s*मीटर)\b", q_lower)
    for m in area_matches:
        try:
            if float(m) <= 500.0:
                is_plot_under_500 = True
        except ValueError:
            pass

    # Keyword check
    keywords_trigger = any(
        kw in q_lower
        for kw in [
            "development permission",
            "separate development permission",
            "विकास अनुमति",
            "august 2026",
            "28 august",
            "2026 amendment",
            "संशोधन",
            "500 sq m",
            "500 sqm",
            "500 वर्ग मीटर",
            "rule 2(5)(c)",
            "2(5)(c)",
        ]
    )

    if touches_rule_2_5_c or (is_plot_under_500 and keywords_trigger) or "august 2026" in q_lower or "28 aug" in q_lower or "2(5)(c)" in q_lower:
        for amd in AMENDMENTS:
            if amd.get("affected_rule") == "2(5)(c)":
                warn = amd["warning_text_hi"] if language == "hi" else amd["warning_text_en"]
                if warn not in warnings:
                    warnings.append(warn)

    return warnings


if __name__ == "__main__":
    w1 = check_amendment_warnings("Do I need separate development permission for a 300 sq m plot?", ["2"])
    print("Warning check Q11:", w1)
