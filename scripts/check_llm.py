#!/usr/bin/env python3
"""
scripts/check_llm.py
Diagnostic tool for LLM configuration, connectivity, and structured output.

Verifies:
1. Environment variables and .env configuration
2. Active provider and model names
3. API key presence (prints only 'set' or 'missing', never secrets)
4. Trivial raw JSON request probe
5. Real parse_query() execution
6. Precise error diagnostic reporting on failure (401/403, 404, 429, timeout, JSON errors)
"""

from __future__ import annotations
import os
import sys
from pathlib import Path

# Add project root to sys.path so scripts can import modules seamlessly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from llm import (
    LLMProviderError,
    call_raw_probe,
    get_model_answer,
    get_model_fast,
    get_provider,
    is_mock,
    parse_query,
    sanitize_secret_text,
)


def diagnose_failure(exc: Exception) -> str:
    """Classifies exception into diagnostic category."""
    status_code = getattr(exc, "status_code", None)
    err_str = str(exc).lower()

    if status_code in (401, 403) or "unauthorized" in err_str or "api_key" in err_str or "forbidden" in err_str:
        return "401/403: Invalid or missing API key"
    if status_code == 404 or "not found" in err_str or "model" in err_str and "not found" in err_str:
        return "404: Model not found / invalid model name"
    if status_code == 429 or "rate limit" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
        return "429: Rate limit or quota exhausted"
    if status_code == 504 or "timeout" in err_str or "timed out" in err_str:
        return "Timeout: Provider timed out after 45s"
    if "json" in err_str or "validation failed" in err_str or status_code == 502:
        return "JSON parse / schema validation error"
    return f"HTTP {status_code or 'Unknown'}: General provider error"


def main() -> int:
    env_file = ROOT_DIR / ".env"
    provider = get_provider()

    print("=" * 72)
    print(" BHUMI VIKAS SAHAYAK — LLM PROVIDER DIAGNOSTIC & HEALTH CHECK")
    print("=" * 72)
    print(f".env file location:  {env_file} ({'EXISTS' if env_file.exists() else 'NOT FOUND'})")
    print(f"Active PROVIDER:     {provider}")

    try:
        model_fast = get_model_fast()
    except Exception as e:
        model_fast = f"<ERROR: {e}>"

    try:
        model_answer = get_model_answer()
    except Exception as e:
        model_answer = f"<ERROR: {e}>"

    print(f"MODEL_FAST:          {model_fast}")
    print(f"MODEL_ANSWER:        {model_answer}")
    print("\nAPI Key Status (presence only, values never displayed):")
    print(f"  - GEMINI_API_KEY:   {'set' if bool(os.getenv('GEMINI_API_KEY')) else 'missing'}")
    print(f"  - OPENAI_API_KEY:   {'set' if bool(os.getenv('OPENAI_API_KEY')) else 'missing'}")
    print(f"  - CEREBRAS_API_KEY: {'set' if bool(os.getenv('CEREBRAS_API_KEY')) else 'missing'}")
    print("-" * 72)

    has_error = False

    # 1. Trivial JSON Request Probe
    print("\n[Test 1/2] Making trivial JSON request probe...")
    try:
        raw_probe = call_raw_probe()
        print("  ✓ SUCCESS: Received structured JSON response:")
        print(f"    {raw_probe[:120]}...")
    except Exception as e:
        has_error = True
        status_code = getattr(e, "status_code", "N/A")
        category = diagnose_failure(e)
        sanitized_msg = sanitize_secret_text(str(e))
        print("  ✗ FAILED:")
        print(f"    HTTP Status:      {status_code}")
        print(f"    Failure Category: {category}")
        print(f"    Provider Error:   {sanitized_msg}")

    # 2. Real parse_query() Call
    test_query = "What is the front setback for a 200 sq m plot on a 9 m road?"
    print(f"\n[Test 2/2] Testing parse_query('{test_query}')...")
    try:
        parsed = parse_query(test_query)
        print("  ✓ SUCCESS: Query parsed successfully:")
        print(f"    Language:    {parsed.language}")
        print(f"    Rewritten:   {parsed.query_en}")
        print(f"    Parameters:  plot_area={parsed.plot_area}, road_width={parsed.road_width}, use={parsed.use}")
    except Exception as e:
        has_error = True
        status_code = getattr(e, "status_code", "N/A")
        category = diagnose_failure(e)
        sanitized_msg = sanitize_secret_text(str(e))
        print("  ✗ FAILED:")
        print(f"    HTTP Status:      {status_code}")
        print(f"    Failure Category: {category}")
        print(f"    Provider Error:   {sanitized_msg}")

    print("\n" + "=" * 72)
    if has_error:
        print(" DIAGNOSTIC RESULT: FAILURE — Real LLM provider call did not succeed.")
        if provider == "mock":
            print(" Note: Running under mock provider but an error occurred.")
        else:
            print(f" Provider '{provider}' encountered errors. Check keys and model names above.")
        print("=" * 72)
        return 1
    else:
        print(" DIAGNOSTIC RESULT: ALL TESTS PASSED.")
        if is_mock():
            print(" Note: Running in MOCK / DEMO mode. Deterministic offline engine is active.")
        else:
            print(f" Provider '{provider}' is fully operational with structured JSON outputs.")
        print("=" * 72)
        return 0


if __name__ == "__main__":
    sys.exit(main())
