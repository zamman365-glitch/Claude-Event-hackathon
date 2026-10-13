"""
eval.py
Official evaluation runner for Bhumi Vikas Sahayak benchmark.

Tests against all 17 sample questions from resources/sample_questions.md (and eval/gold.json),
measures status accuracy, rule citation accuracy, amendment warning accuracy,
and verifier validity, and prints the overall accuracy metric required by the jury.
"""

from __future__ import annotations
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from service import process_query

GOLD_PATH = Path("eval/gold.json")


def run_evaluation() -> Dict[str, Any]:
    if not GOLD_PATH.exists():
        raise FileNotFoundError(f"Gold dataset not found at {GOLD_PATH}")

    with open(GOLD_PATH, "r", encoding="utf-8") as f:
        gold_items: List[Dict[str, Any]] = json.load(f)

    total = len(gold_items)
    passed_total = 0
    passed_status = 0
    passed_rule = 0
    passed_warning = 0
    citation_verified = 0

    print("=" * 80)
    print(" BHUMI VIKAS SAHAYAK - BENCHMARK EVALUATION (17 TEST QUESTIONS)")
    print("=" * 80)

    results = []

    for item in gold_items:
        q_id = item["id"]
        question = item["question"]
        exp_status = item["expected_status"]
        exp_rules = item.get("expected_rules", [])
        exp_warning = item.get("expected_warning", False)
        exp_num = item.get("expected_number")
        exp_kw = item.get("expected_keyword")

        start_t = time.perf_counter()
        try:
            resp = process_query(question)
        except Exception as e:
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            print(f"Q{q_id:02d} [FAIL] | Provider Error: {type(e).__name__} | {latency_ms:.1f}ms")
            print(f"    Q: {question[:75]}...")
            print(f"    Error: {str(e)[:85]}...")
            print("-" * 80)
            results.append({
                "id": q_id,
                "passed": False,
                "latency_ms": latency_ms,
                "error": str(e),
            })
            continue
        latency_ms = (time.perf_counter() - start_t) * 1000.0

        # Check status
        status_ok = resp.status == exp_status
        if status_ok:
            passed_status += 1

        # Check rule citation
        rule_ok = False
        if exp_status == "not_found":
            rule_ok = len(resp.citations) == 0
        else:
            cited_rules = [c.rule.upper() for c in resp.citations]
            if resp.rule_no:
                cited_rules.append(resp.rule_no.upper())
            for er in exp_rules:
                if any(er.upper() in cr or cr in er.upper() for cr in cited_rules):
                    rule_ok = True
                    break
        if rule_ok:
            passed_rule += 1

        # Check warning (e.g. Q11 amendment)
        warning_ok = True
        if exp_warning:
            warning_ok = len(resp.warnings) > 0 and any("amendment" in w.lower() or "संशोधन" in w for w in resp.warnings)
        if warning_ok:
            passed_warning += 1

        # Check content match (number or keyword)
        content_ok = True
        ans_lower = resp.answer.lower()
        if exp_num is not None:
            int_str = str(int(exp_num)) if float(exp_num).is_integer() else ""
            content_ok = (
                str(exp_num) in resp.answer
                or (f"{exp_num:.1f}" in resp.answer)
                or (f"{exp_num:.2f}" in resp.answer)
                or (int_str and int_str in resp.answer)
            )
        elif exp_kw is not None:
            content_ok = exp_kw.lower() in ans_lower or exp_kw in str(resp.citations)

        # Verifier check
        verified_ok = True
        if resp.status == "answered":
            verified_ok = len(resp.citations) > 0

        if verified_ok:
            citation_verified += 1

        # Overall item pass
        item_passed = status_ok and rule_ok and warning_ok and content_ok and verified_ok
        if item_passed:
            passed_total += 1

        mark = "[PASS]" if item_passed else "[FAIL]"
        print(f"Q{q_id:02d} {mark} | Status: {resp.status} (exp {exp_status}) | Rule: {resp.rule_no} | {latency_ms:.1f}ms")
        print(f"    Q: {question[:75]}...")
        print(f"    A: {resp.answer[:85]}...")
        if resp.warnings:
            print(f"    Warnings: {len(resp.warnings)} present")
        print("-" * 80)

        results.append({
            "id": q_id,
            "passed": item_passed,
            "latency_ms": latency_ms,
            "response": resp.model_dump(),
        })

    accuracy = (passed_total / total) * 100.0
    status_acc = (passed_status / total) * 100.0
    rule_acc = (passed_rule / total) * 100.0

    print("\n" + "=" * 80)
    print(f" FINAL BENCHMARK SCORE: {passed_total}/{total} ({accuracy:.1f}%)")
    print(f" - Status Match Accuracy:        {passed_status}/{total} ({status_acc:.1f}%)")
    print(f" - Rule Citation Accuracy:       {passed_rule}/{total} ({rule_acc:.1f}%)")
    print(f" - Verified Citations Rate:      {citation_verified}/{total} ({(citation_verified/total)*100:.1f}%)")
    print("=" * 80)

    summary = {
        "total_questions": total,
        "passed": passed_total,
        "accuracy_percent": round(accuracy, 2),
        "status_accuracy_percent": round(status_acc, 2),
        "rule_accuracy_percent": round(rule_acc, 2),
        "results": results,
    }

    # Save summary report
    with open("eval/eval_results.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    return summary


if __name__ == "__main__":
    run_evaluation()
