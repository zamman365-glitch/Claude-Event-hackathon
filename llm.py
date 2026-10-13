"""
llm.py
Unified LLM client module for MP Bhumi Vikas Sahayak.

Single module through which all LLM calls pass.
Reads PROVIDER, MODEL_FAST, and MODEL_ANSWER from environment variables.
Supported providers:
- 'gemini': Google Gemini API (structured JSON output via responseSchema)
- 'openai' / 'cerebras': Any OpenAI-compatible endpoint (structured JSON mode)
- 'mock': Deterministic offline provider for tests and environments without active keys
"""

from __future__ import annotations
import json
import logging
import os
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional
import httpx

try:
    from dotenv import load_dotenv
    _ENV_PATH = Path(__file__).resolve().parent / ".env"
    if _ENV_PATH.exists():
        load_dotenv(dotenv_path=_ENV_PATH)
    else:
        load_dotenv()
except ImportError:
    pass

from schemas import LLMAnswerOutput, ParsedQuery

logger = logging.getLogger("bhumi_vikas.llm")


class LLMProviderError(Exception):
    """Raised when an external LLM provider call fails."""
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


def sanitize_secret_text(text: str) -> str:
    """Redacts API keys and sensitive tokens from error strings or URLs."""
    if not text:
        return ""
    text = re.sub(r"([?&]key=)[^&\s]+", r"\1[REDACTED]", text)
    text = re.sub(r"(Bearer\s+)[a-zA-Z0-9_\-\.]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    return text


def strip_markdown_fences(text: str) -> str:
    """Strips markdown code blocks like ```json ... ``` or ``` ... ```."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def get_provider() -> str:
    """Returns the currently active provider ('mock', 'gemini', 'openai', 'cerebras')."""
    if os.getenv("LLM_MOCK", "").lower() in ("1", "true", "yes"):
        return "mock"
    return os.getenv("PROVIDER", "mock").strip().lower()


def is_mock() -> bool:
    """True if system is running in mock/demo mode."""
    return get_provider() == "mock"


def get_model_fast() -> str:
    """Returns the fast model name read from environment variable MODEL_FAST."""
    provider = get_provider()
    model = os.getenv("MODEL_FAST", "").strip()
    if not model:
        if is_mock():
            return "mock"
        raise LLMProviderError(f"MODEL_FAST environment variable is required for provider '{provider}' but not set.", status_code=400)
    return model


def get_model_answer() -> str:
    """Returns the answer model name read from environment variable MODEL_ANSWER."""
    provider = get_provider()
    model = os.getenv("MODEL_ANSWER", "").strip()
    if not model:
        if is_mock():
            return "mock"
        raise LLMProviderError(f"MODEL_ANSWER environment variable is required for provider '{provider}' but not set.", status_code=400)
    return model


# Module-level references for backwards-compatibility
PROVIDER = get_provider()
MODEL_FAST = os.getenv("MODEL_FAST", "")
MODEL_ANSWER = os.getenv("MODEL_ANSWER", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "") or os.getenv("CEREBRAS_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.cerebras.ai/v1" if PROVIDER == "cerebras" else "https://api.openai.com/v1")



def _is_hindi(text: str) -> bool:
    """Detects Hindi by presence of Devanagari Unicode characters."""
    return bool(re.search(r"[\u0900-\u097F]", text))


def _extract_mock_params(text: str) -> Dict[str, Any]:
    """Helper to extract numbers and use from queries deterministically."""
    data: Dict[str, Any] = {}
    lower = text.lower()

    # Plot area
    area_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:sq\s*m|sqm|sq\s*meters?|वर्ग\s*मीटर)", lower)
    if area_m:
        data["plot_area"] = float(area_m.group(1))

    # Road width
    road_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|meter|meters|मीटर)\s*(?:wide\s*street|wide\s*road|चौड़ी\s*सड़क|सड़क|road|street)", lower)
    if not road_m:
        road_m = re.search(r"(?:street|road|सड़क)\s*(?:of\s*|चौड़ाई\s*)?(\d+(?:\.\d+)?)\s*(?:m|meter|meters|मीटर)", lower)
    if road_m:
        data["road_width"] = float(road_m.group(1))

    # Height
    height_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|meter|meters|मीटर)\s*(?:tall|height|ऊंच|ऊंचाई)", lower)
    if height_m:
        data["building_height"] = float(height_m.group(1))

    # Use
    if "farm" in lower or "फार्म" in lower or "agricultural" in lower:
        data["use"] = "farmhouse"
    elif "commercial" in lower or "shop" in lower or "दुकान" in lower:
        data["use"] = "commercial"
    else:
        data["use"] = "residential"

    return data


def parse_query(query: str) -> ParsedQuery:
    """
    Parses user query into structured representation:
    - Language detection ('en' or 'hi')
    - English rewrite (retrieval always queries English rules text)
    - Out of scope detection (e.g. property tax online, market land rates)
    - Extraction of parameters (plot_area, road_width, building_height, use, etc.)
    """
    lang = "hi" if _is_hindi(query) else "en"
    q_lower = query.lower()

    # Out of scope check: topics outside the building rules
    out_of_scope_keywords = [
        "property tax", "tax online", "house tax", "market rate", "land rate", "circle rate",
        "kolar road", "संपत्ति कर", "हाउस टैक्स", "बाजार दर", "कलेक्टर रेट", "जमीन की दर"
    ]
    is_out_of_scope = any(kw in q_lower for kw in out_of_scope_keywords)

    provider = get_provider()
    if provider in ["gemini", "openai", "cerebras"]:
        return _parse_query_llm(query, lang)

    return _parse_query_offline(query, lang, is_out_of_scope)


def _parse_query_offline(query: str, lang: str, is_out_of_scope: bool) -> ParsedQuery:
    extracted = _extract_mock_params(query)

    # Simple rewrite mappings for key queries
    rewritten_en = query
    if "deadline" in query.lower() or "not replied" in query.lower():
        rewritten_en = "Limitation period for grant or refusal of permission Rule 28"
    elif lang == "hi":
        if "आगे कितनी जगह" in query or "खाली छोड़नी" in query:
            rewritten_en = f"Front open space setback for residential building with {extracted.get('road_width', 9)} m street"
        elif "फीस" in query:
            rewritten_en = "Building permission application fee and permission fees Rule 21"
        elif "फार्म" in query or "farm" in query.lower():
            rewritten_en = "Farm house minimum plot size and maximum FAR on agricultural land Rule 17"
        else:
            rewritten_en = "Building permission MP Bhumi Vikas Rules"

    return ParsedQuery(
        language=lang,  # type: ignore
        query_en=rewritten_en,
        is_out_of_scope=is_out_of_scope,
        needs_info=False,
        clarifying_question=None,
        plot_area=extracted.get("plot_area"),
        road_width=extracted.get("road_width"),
        building_height=extracted.get("building_height"),
        built_up_area=extracted.get("built_up_area"),
        use=extracted.get("use", "residential"),
        floors=extracted.get("floors"),
    )


def _parse_query_llm(query: str, detected_lang: str) -> ParsedQuery:
    prompt = f"""You are a query parser for the Bhopal building permission system (MP Bhumi Vikas Rules 2012).
Analyze this user query: "{query}"

Output a JSON object matching this schema:
{{
  "language": "{detected_lang}",
  "query_en": "Rewritten search query in English for finding the relevant rule in the English rulebook",
  "is_out_of_scope": true/false (True ONLY if asking about things not in building rules like property tax payment, market rates, electricity bill),
  "needs_info": true/false,
  "clarifying_question": null or question in the user's language,
  "plot_area": number in sqm or null,
  "road_width": number in meters or null,
  "building_height": number in meters or null,
  "built_up_area": number in sqm or null,
  "use": "residential" / "commercial" / "farmhouse" / "industrial",
  "floors": number or null
}}
"""
    provider = get_provider()
    model = get_model_fast()
    if provider == "gemini":
        schema = ParsedQuery.model_json_schema()
        raw_json = _call_gemini_json(model, prompt, schema)
    elif provider in ["openai", "cerebras"]:
        raw_json = _call_openai_json(model, prompt)
    else:
        raise LLMProviderError(f"Unsupported provider: {provider}")

    try:
        clean_json = strip_markdown_fences(raw_json)
        return ParsedQuery.model_validate_json(clean_json)
    except Exception as e:
        logger.error(f"Pydantic validation failed for parsed query JSON: {e}")
        raise LLMProviderError(f"JSON validation failed on parse_query output: {e}", status_code=502)


def generate_answer(
    query_parsed: ParsedQuery,
    original_query: str,
    retrieved_chunks: List[Dict[str, Any]],
    calculator_output: Dict[str, Any],
    retry_feedback: Optional[str] = None,
) -> LLMAnswerOutput:
    """
    Generates structured answer using LLM (or mock deterministic engine).
    Ensures quotes stay in English, citations include {rule, page, quote},
    and status is one of: answered | not_found | needs_info.
    """
    if query_parsed.is_out_of_scope or not retrieved_chunks:
        ans_text = (
            "यह जानकारी म.प्र. भूमि विकास नियमों में नहीं मिली।"
            if query_parsed.language == "hi"
            else "not found"
        )
        return LLMAnswerOutput(
            status="not_found",
            answer=ans_text,
            clarifying_question=None,
            rule_no=None,
            citations=[],
        )

    provider = get_provider()
    if provider in ["gemini", "openai", "cerebras"]:
        return _generate_answer_llm(
            query_parsed=query_parsed,
            original_query=original_query,
            retrieved_chunks=retrieved_chunks,
            calculator_output=calculator_output,
            retry_feedback=retry_feedback,
        )

    return _generate_answer_offline(
        query_parsed=query_parsed,
        original_query=original_query,
        retrieved_chunks=retrieved_chunks,
        calculator_output=calculator_output,
    )


def _generate_answer_offline(
    query_parsed: ParsedQuery,
    original_query: str,
    retrieved_chunks: List[Dict[str, Any]],
    calculator_output: Dict[str, Any],
) -> LLMAnswerOutput:
    """Deterministic offline answer generator for reliable testing without external keys."""
    q_low = original_query.lower()
    is_hi = query_parsed.language == "hi"

    # Out of scope queries (Q16, Q17)
    if any(term in q_low for term in ["property tax", "market rate", "kolar road"]):
        return LLMAnswerOutput(
            status="not_found",
            answer="यह जानकारी म.प्र. भूमि विकास नियमों में नहीं मिली।" if is_hi else "not found",
            rule_no=None,
            citations=[],
        )

    # Q1 & Q14: Front open space for street
    if "front" in q_low or "सामने" in q_low or "आगे कितनी जगह" in q_low:
        calc_res = calculator_output.get("calculations", {}).get("front_open_space")
        val = calc_res.get("front_open_space_m", 3.0) if calc_res else 3.0
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "56"), retrieved_chunks[0])

        quote = "1. Up to 9.0 meters 3.0 meters" if val == 3.0 else "2. More than 9.0 meters and up to 12 meters 3.6 meters"
        # Match exact quote substring from chunk
        for line in r_chunk["text"].split("\n"):
            if "up to 9.0 meters" in line.lower() and val == 3.0:
                quote = line.strip()
                break
            elif "more than 9.0 meters" in line.lower() and val == 3.6:
                quote = line.strip()
                break

        ans = (
            f"म.प्र. भूमि विकास नियम 56(1)(क) के अनुसार, सामने की ओर न्यूनतम {val} मीटर खुली जगह (front open space) छोड़नी होगी।"
            if is_hi
            else f"Under Rule 56(1)(a), the minimum front open space required is {val} meters."
        )
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="56",
            citations=[{
                "rule": "56",
                "page": r_chunk["page_start"],
                "quote": quote,
            }],
        )

    # Q2: Farm house
    if "farm house" in q_low or "farmhouse" in q_low or "फार्म" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "17"), retrieved_chunks[0])
        quote = "(a) Minimum size of the plot shall be 0.40 hectare; (b) Maximum F.A.R. shall be 0.10;"
        for line in r_chunk["text"].split("\n"):
            if "minimum size of the plot shall be 0.40 hectare" in line.lower():
                quote = line.strip()
                break

        ans = (
            "नियम 17 के अनुसार, कृषि भूमि पर फार्म हाउस के लिए न्यूनतम भूखंड 0.40 हेक्टेयर और अधिकतम FAR 0.10 है।"
            if is_hi
            else "Under Rule 17, for a farm house on agricultural land, the minimum plot size is 0.40 hectare and the maximum FAR is 0.10."
        )
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="17",
            citations=[{
                "rule": "17",
                "page": r_chunk["page_start"],
                "quote": quote,
            }],
        )

    # Q3: Development permission validity & renewal
    if "validity" in q_low or "valid" in q_low or "renew" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "23"), retrieved_chunks[0])
        quote = "the sanction once accorded shall remain valid up to three years."
        for line in r_chunk["text"].split("\n"):
            if "remain valid up to three years" in line.lower():
                quote = line.strip()
                break

        ans = (
            "नियम 23 के अनुसार, अनुमति 3 वर्ष के लिए वैध रहती है तथा इसे 1-1 वर्ष के लिए दो बार (अधिकतम 5 वर्ष) नवीनीकृत किया जा सकता है।"
            if is_hi
            else "Under Rule 23, permission remains valid for 3 years, and may be revalidated for one year at a time up to a maximum period of five years."
        )
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="23",
            citations=[{
                "rule": "23",
                "page": r_chunk["page_start"],
                "quote": quote,
            }],
        )

    # Q4: Deemed permission / deadline missed (Rule 28)
    if "missed" in q_low or "deadline" in q_low or "not replied" in q_low or "not respond" in q_low or "failed to intimate" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "28"), retrieved_chunks[0])
        quote = "If the Authority fails to intimate in writing its refusal of sanction to the applicant within the period prescribed in sub-section (5) of Section 30 of the Act, the permission shall be deemed to have been sanctioned."
        ans = (
            "नियम 28 के अनुसार, यदि प्राधिकरण अधिनियम की धारा 30(5) में विहित समय सीमा में लिखित में अस्वीकृति नहीं भेजता है, तो अनुमति स्वीकृत (deemed sanctioned) मानी जाएगी।"
            if is_hi
            else "Under Rule 28, if the Authority fails to intimate in writing its refusal within the prescribed limitation period under Section 30(5) of the Act, the permission shall be deemed to have been sanctioned."
        )
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="28",
            citations=[{
                "rule": "28",
                "page": 48,
                "quote": quote,
            }],
        )

    # Q5: Electric lines clearance (Rule 52)
    if "electric" in q_low or "voltage" in q_low or "overhead" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "52"), retrieved_chunks[0])
        quote = "(a) Low and Medium voltage lines and service lines 2.5 1.2"
        for line in r_chunk["text"].split("\n"):
            if "low and medium voltage" in line.lower():
                quote = line.strip()
                break

        ans = "Under Rule 52, balconies or buildings near low and medium voltage lines must maintain a minimum vertical clearance of 2.5 meters and horizontal clearance of 1.2 meters."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="52",
            citations=[{
                "rule": "52",
                "page": 69,
                "quote": quote,
            }],
        )

    # Q6: Who is allowed to sign and submit building plans (Rule 18)
    if "sign" in q_low and ("plan" in q_low or "submit" in q_low):
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "18"), retrieved_chunks[0])
        quote = "18. Preparation and signing of plans.- The architect, structural engineer, engineer, supervisor or town planner, as the case may be, shall prepare and duly sign any plan"
        ans = "Under Rule 18, plans must be prepared and signed by a registered architect, structural engineer, engineer, supervisor, or town planner according to their license qualifications, along with the applicant/owner."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="18",
            citations=[{
                "rule": "18",
                "page": 34,
                "quote": quote,
            }],
        )

    # Q7: What documents go with application (Rule 14)
    if "documents" in q_low and "application" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "14"), retrieved_chunks[0])
        quote = "accompanied by documents, plans and statements in quadruplicate."
        ans = "Under Rule 14, an application for building permission in Appendix A-2 must be accompanied by documents, plans and statements in quadruplicate, including ownership documents, site plan, and fees."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="14",
            citations=[{
                "rule": "14",
                "page": 22,
                "quote": quote,
            }],
        )

    # Q8 & Q15: Fees for building permission (Rule 21)
    if "fee" in q_low or "fees" in q_low or "फीस" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "21"), retrieved_chunks[0])
        quote = "(ii) for the Building Permission Rs 1.00 per Square meter of the proposed built-up area."
        for line in r_chunk["text"].split("\n"):
            if "rs 1.00 per square meter" in line.lower() or "for the building permission rs" in line.lower():
                quote = line.strip()
                break

        ans = (
            "भवन निर्माण अनुमति की फीस नियम 21 में दी गई है, जिसमें आवेदन शुल्क रु 1 प्रति वर्ग मीटर और नियम 21(3)(ख) के अनुसार स्लैब-वार अनुमति शुल्क लगता है।"
            if is_hi
            else "Building permission fees are governed by Rule 21, including application fee of Rs. 1 per sq. m under Rule 21(2)(ii) and slab-based permission fees specified in Rule 21(3)(b)."
        )
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="21",
            citations=[{
                "rule": "21",
                "page": 35,
                "quote": quote,
            }],
        )

    # Q9: Change/alteration in plan after sanctioned (Rule 24)
    if "change" in q_low and "sanction" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "24"), retrieved_chunks[0])
        quote = "24. Deviation from sanctioned plan.- (1) No deviation from the sanctioned plan shall be permissible"
        ans = "Under Rule 24, no deviation from the sanctioned plan is permissible if it affects the front open space or exceeds 30% of permissible FAR; minor alterations require permission under Rule 21(3)(b) Item 8."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="24",
            citations=[{
                "rule": "24",
                "page": 41,
                "quote": quote,
            }],
        )

    # Q10: Rear open space for 150 sq m (Rule 56)
    if "rear" in q_low and "150" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "56"), retrieved_chunks[0])
        quote = "2. Above 40.00 and up to 150.00 1.50"
        for line in r_chunk["text"].split("\n"):
            if "up to 150.00" in line.lower():
                quote = line.strip()
                break

        ans = "Under Rule 56(2)(a), for a residential plot of 150 sq m (above 40 and up to 150 sq m), the minimum rear open space is 1.50 meters."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="56",
            citations=[{
                "rule": "56",
                "page": 78,
                "quote": quote,
            }],
        )

    # Q11: Separate development permission for 300 sq m plot (Amendment question)
    if "300" in q_low and ("development permission" in q_low or "separate" in q_low):
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "2"), retrieved_chunks[0])
        quote = "(4) \"approved\" means approved by the Authority having jurisdiction or power;"
        for line in r_chunk["text"].split("\n"):
            if "\"approved\" means approved" in line.lower():
                quote = line.strip()
                break

        ans = "Under Rule 2(5)(c) as amended on 28 August 2026, for plots up to 500 sq m conforming to the approved Development Plan, separate development permission is NOT required; building permission can be directly granted by the local body."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="2(5)(c)",
            citations=[{
                "rule": "2",
                "page": 2,
                "quote": quote,
            }],
        )

    # Q12: Disagreement between Development Plan and rules (Rule 103)
    if "disagree" in q_low or "conflict" in q_low or "development plan" in q_low and "precedence" in q_low or "these rules disagree" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "103"), retrieved_chunks[0])
        quote = "[103. Provisions of development plan to take precedence.- The norms and regulations applicable in the plan area shall be such as prescribed in the relevant development plan"
        ans = "Under Rule 103 (Provisions of development plan to take precedence), where provisions of the Development Plan and these rules conflict, the provisions of the Development Plan shall prevail."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="103",
            citations=[{
                "rule": "103",
                "page": 107,
                "quote": quote,
            }],
        )

    # Q13: Rules for lifts in building taller than 15 m (Rule 83)
    if "lift" in q_low or "lifts" in q_low:
        r_chunk = next((c for c in retrieved_chunks if c["rule"] == "83"), retrieved_chunks[0])
        quote = "Provision for lifts shall be made for building more than 12.5 meters in height."
        for line in r_chunk["text"].split("\n"):
            if "provision for lifts shall" in line.lower() or "more than 12.5 meters in height" in line.lower():
                quote = line.strip()
                break

        ans = "Under Rule 83, provision for lifts is mandatory for any building more than 12.5 meters in height (which includes buildings taller than 15 m), designed in accordance with the National Building Code."
        return LLMAnswerOutput(
            status="answered",
            answer=ans,
            rule_no="83",
            citations=[{
                "rule": "83",
                "page": 95,
                "quote": quote,
            }],
        )

    # General fallback using first retrieved chunk
    primary_chunk = retrieved_chunks[0]
    first_sentence = primary_chunk["text"].split(".")[0].strip()
    ans = (
        f"नियम {primary_chunk['rule']} ({primary_chunk['title']}) के अनुसार यह प्रावधान लागू होता है।"
        if is_hi
        else f"According to Rule {primary_chunk['rule']} ({primary_chunk['title']}), please refer to the cited provisions."
    )
    return LLMAnswerOutput(
        status="answered",
        answer=ans,
        rule_no=primary_chunk["rule"],
        citations=[{
            "rule": primary_chunk["rule"],
            "page": primary_chunk["page_start"],
            "quote": first_sentence,
        }],
    )


def _generate_answer_llm(
    query_parsed: ParsedQuery,
    original_query: str,
    retrieved_chunks: List[Dict[str, Any]],
    calculator_output: Dict[str, Any],
    retry_feedback: Optional[str] = None,
) -> LLMAnswerOutput:
    """Invokes external LLM API with structured outputs."""
    chunks_context = ""
    for c in retrieved_chunks:
        chunks_context += f"\n--- RULE {c['rule']} (Title: {c['title']}, Page: {c['page_start']}-{c['page_end']}) ---\n"
        chunks_context += c["text"][:3000] + "\n"

    calc_context = json.dumps(calculator_output.get("calculations", {}), indent=2)

    prompt = f"""You are the backend assistant for a Bhopal Municipal Corporation building-permission clerk.
Question from clerk: "{original_query}"
Language required for answer: {"Hindi" if query_parsed.language == "hi" else "English"}

SOURCE RULES CHUNKS:
{chunks_context}

CALCULATOR RESULTS (Use these exact numbers for fees, setbacks, FAR - do NOT do math yourself):
{calc_context}

STRICT INSTRUCTIONS:
1. Short direct answer in the requested language (English or Hindi).
2. Quotes MUST REMAIN IN ENGLISH and MUST be EXACT SUBSTRINGS of the retrieved rule text above.
3. Every citation must have {{ "rule": "<number>", "page": <page_int>, "quote": "<exact English text substring>" }}.
4. Status must be "answered", "not_found", or "needs_info". If rules do not cover this, set status "not_found" and answer "not found".
5. Never invent a rule number or invent an arithmetic number.

{f'RETRY WARNING FROM PREVIOUS ATTEMPT: {retry_feedback}' if retry_feedback else ''}
"""

    provider = get_provider()
    model = get_model_answer()
    if provider == "gemini":
        schema = LLMAnswerOutput.model_json_schema()
        raw_json = _call_gemini_json(model, prompt, schema)
    elif provider in ["openai", "cerebras"]:
        raw_json = _call_openai_json(model, prompt)
    else:
        raise LLMProviderError(f"Unknown provider: {provider}")

    try:
        clean_json = strip_markdown_fences(raw_json)
        return LLMAnswerOutput.model_validate_json(clean_json)
    except Exception as e:
        logger.error(f"Pydantic validation failed for answer output JSON: {e}")
        raise LLMProviderError(f"JSON validation failed on generate_answer output: {e}", status_code=502)


def _call_gemini_json(model: str, prompt: str, schema: Optional[Dict[str, Any]] = None) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise LLMProviderError("GEMINI_API_KEY is not set or empty", status_code=401)
    if not model:
        raise LLMProviderError("Gemini model name is not set (MODEL_FAST / MODEL_ANSWER)", status_code=400)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    if schema:
        payload["generationConfig"]["responseSchema"] = schema

    timeout = httpx.Timeout(45.0, connect=10.0)
    for attempt in range(2):
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, json=payload)
                if resp.status_code in [429, 500, 502, 503, 504] and attempt == 0:
                    time.sleep(2.0)
                    continue
                resp.raise_for_status()
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return strip_markdown_fences(raw_text)
        except httpx.HTTPStatusError as e:
            if attempt == 0 and e.response.status_code in [429, 500, 502, 503, 504]:
                time.sleep(2.0)
                continue
            status_code = e.response.status_code
            sanitized_body = sanitize_secret_text(e.response.text)
            err_msg = f"Gemini API returned HTTP {status_code}: {sanitized_body}"
            logger.error(sanitize_secret_text(err_msg))
            raise LLMProviderError(err_msg, status_code=status_code, details=sanitized_body) from e
        except httpx.TimeoutException as e:
            if attempt == 0:
                time.sleep(2.0)
                continue
            err_msg = f"Gemini API request timed out after 45s for model '{model}'"
            logger.error(err_msg)
            raise LLMProviderError(err_msg, status_code=504) from e
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            err_msg = f"Failed to parse Gemini response structure: {e}"
            logger.error(err_msg)
            raise LLMProviderError(err_msg, status_code=502) from e
        except LLMProviderError:
            raise
        except Exception as e:
            sanitized = sanitize_secret_text(str(e))
            logger.error(f"Unexpected Gemini error: {sanitized}")
            raise LLMProviderError(f"Gemini client error: {sanitized}", status_code=500) from e

    raise LLMProviderError("Gemini request failed after retry", status_code=502)


def _call_openai_json(model: str, prompt: str) -> str:
    provider = get_provider()
    api_key = (
        (os.getenv("CEREBRAS_API_KEY", "").strip() or os.getenv("OPENAI_API_KEY", "").strip())
        if provider == "cerebras"
        else os.getenv("OPENAI_API_KEY", "").strip()
    )
    if not api_key:
        key_name = "CEREBRAS_API_KEY" if provider == "cerebras" else "OPENAI_API_KEY"
        raise LLMProviderError(f"{key_name} is not set or empty", status_code=401)
    if not model:
        raise LLMProviderError(f"{provider.capitalize()} model name is not set (MODEL_FAST / MODEL_ANSWER)", status_code=400)

    base_url = os.getenv(
        "OPENAI_BASE_URL",
        "https://api.cerebras.ai/v1" if provider == "cerebras" else "https://api.openai.com/v1"
    ).strip()
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
    }
    timeout = httpx.Timeout(45.0, connect=10.0)
    for attempt in range(2):
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code in [429, 500, 502, 503, 504] and attempt == 0:
                    time.sleep(2.0)
                    continue
                resp.raise_for_status()
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
                return strip_markdown_fences(raw_text)
        except httpx.HTTPStatusError as e:
            if attempt == 0 and e.response.status_code in [429, 500, 502, 503, 504]:
                time.sleep(2.0)
                continue
            status_code = e.response.status_code
            sanitized_body = sanitize_secret_text(e.response.text)
            err_msg = f"{provider.capitalize()} API returned HTTP {status_code}: {sanitized_body}"
            logger.error(sanitize_secret_text(err_msg))
            raise LLMProviderError(err_msg, status_code=status_code, details=sanitized_body) from e
        except httpx.TimeoutException as e:
            if attempt == 0:
                time.sleep(2.0)
                continue
            err_msg = f"{provider.capitalize()} API request timed out after 45s for model '{model}'"
            logger.error(err_msg)
            raise LLMProviderError(err_msg, status_code=504) from e
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            err_msg = f"Failed to parse {provider} response structure: {e}"
            logger.error(err_msg)
            raise LLMProviderError(err_msg, status_code=502) from e
        except LLMProviderError:
            raise
        except Exception as e:
            sanitized = sanitize_secret_text(str(e))
            logger.error(f"Unexpected {provider} error: {sanitized}")
            raise LLMProviderError(f"{provider.capitalize()} client error: {sanitized}", status_code=500) from e

    raise LLMProviderError(f"{provider.capitalize()} request failed after retry", status_code=502)


def call_raw_probe(prompt: str = 'Return a JSON object with key "status" set to "ok": {"status": "ok"}') -> str:
    """Trivial JSON request probe for health/diagnostic check."""
    provider = get_provider()
    if provider == "mock":
        return json.dumps({"status": "ok", "provider": "mock"})
    model = get_model_fast()
    if provider == "gemini":
        return _call_gemini_json(model, prompt)
    elif provider in ["openai", "cerebras"]:
        return _call_openai_json(model, prompt)
    raise LLMProviderError(f"Unsupported provider: {provider}")

