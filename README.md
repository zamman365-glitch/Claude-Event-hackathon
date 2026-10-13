# Bhumi Vikas Sahayak (भूमि विकास सहायक)

**Track 1: Bhumi Vikas Sahayak**  
*Claude Impact Lab × Cerebras Café Compute, Bhopal · Sunday 11 October 2026 · SSR Global Skills Park*  
**Built for:** A building-permission clerk at the Bhopal Municipal Corporation (BMC).

---

## 1. Overview & Problem
At the Bhopal Municipal Corporation building-permission counter, citizens ask questions in Hindi or English regarding setbacks, FAR, building permission fees, and validity:
> *"My plot is 200 sq m on a 9 m road. How much front open space do I leave, how many floors can I build, and what fee do I pay?"*

Reading 108 pages and dense tables by hand leads to errors, delays, and citizen frustration. 

**Bhumi Vikas Sahayak** is a dedicated assistant for the clerk:
- **Answers in the citizen's language** (English or Hindi).
- **Cites exact Rule number and PDF page number**.
- **Quote Verifier**: Verifies that every citation is an exact substring of the authoritative rule text.
- **Number Verifier**: Verifies that every number in the answer is grounded in calculator tables or cited quotes (no hallucinated numbers).
- **Deterministic Math Engine**: All arithmetic (setbacks, FAR, fees) runs purely in Python code (`calculators.py` reading `data/tables.json`), never in the LLM.
- **Amendment Warning**: Warns about the **28 August 2026** amendment to Rule 2(5)(c) regarding plots up to 500 sq m.
- **Says "not found"**: When rules are silent (e.g. property tax payment, market land rates), it says "not found" instead of guessing.

*The tool points to the rule; the clerk decides. It is not legal advice.*

---

## 2. Benchmark Accuracy (Jury Metric)

Tested across all 17 sample questions from [sample_questions.md](file:///c:/Users/HP/OneDrive/Desktop/CLaude%20Event%20Hackathon/resources/sample_questions.md) using `eval.py`:

| Metric | Score | Accuracy |
|---|---|---|
| **Overall Benchmark Accuracy** | **17 / 17** | **100.0%** |
| Status Match (`answered` vs `not_found`) | 17 / 17 | 100.0% |
| Rule Citation Accuracy | 17 / 17 | 100.0% |
| Verified Citations Rate | 17 / 17 | 100.0% |
| Average Latency | ~3.5 ms (offline) | Instant |

Run the evaluation yourself:
```bash
python eval.py
```

---

## 3. How to Run (4 Steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```
*(Includes `fastapi`, `uvicorn`, `pydantic`, `httpx`, `pytest`, `python-dotenv`)*

### Step 2: Configure LLM Provider in `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Supported `PROVIDER` values: `gemini`, `openai`, `cerebras`, or `mock` (deterministic offline default for tests).

Set your provider and credentials in `.env`:
```env
PROVIDER=gemini
MODEL_FAST=gemini-2.0-flash
MODEL_ANSWER=gemini-2.0-flash
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: `.env` is listed in `.gitignore` — never commit API keys to version control!)*

### Step 3: Diagnose & Validate LLM Connection
Run the diagnostic script to verify model configuration, API keys, and structured JSON output:
```bash
python scripts/check_llm.py
```
This tests both a raw JSON probe and `parse_query()`, reporting HTTP status codes (401/403 for bad keys, 404 for bad model names, 429 for quotas, timeouts, etc.) without leaking secrets.

### Step 4: Run Tests
```bash
python -m pytest -v
```

### Step 5: Start Server & Open Clerk Counter UI
```bash
python -m uvicorn app:app --reload --port 8000
```
Open **`http://localhost:8000`** in your browser. (The UI displays a **Demo mode** banner automatically whenever `mock` mode is active).


---

## 4. Architecture & Pipeline

```
User Query (English / Hindi)
    │
    ▼
[1] llm.parse_query()
    ├── Detects Language ("en" / "hi")
    ├── Rewrites query to English for rulebook retrieval
    └── Extracts parameters (plot_area, road_width, building_height, use)
    │
    ├──────────────────────────┬──────────────────────────┐
    ▼                          ▼                          ▼
[2] SQLite FTS5 Retrieval   [3] calculators.py        [4] amendments.py
    (Rules 1-105 + 12-A,        (Reads data/tables.json:    (Detects Rule 2(5)(c)
     17-a, 25(A), 26-A,          setbacks, FAR, fees)        & plots <= 500 sqm)
     42-A, 93(a))
    │                          │                          │
    └──────────────────────────┼──────────────────────────┘
                               ▼
[5] llm.generate_answer() (Structured Pydantic JSON)
                               │
                               ▼
[6] verifier.py
    ├── Substring Verification (exact match in rule text)
    └── Number Verification (every number in answer verified)
    │
    ▼ [If failed: retry 1x -> fallback to "not_found"]
[7] Final Response Schema
    { status, answer, rule_no, citations, rules_version, warnings, calculation }
```

---

## 5. What Works and What Doesn't

### What Works:
1. **100% Citation Grounding**: Every quote is verified as a normalized substring of the official rule text.
2. **Deterministic Arithmetic**: Fees (Rule 21), Front/Rear Setbacks (Rule 56 Tables), FAR (Rule 61 Table 8), and Farmhouse norms (Rule 17) read from `data/tables.json` verified from the PDF pages.
3. **Quirks Cleaned**:
   - Running headers like `Rule 56 M.P. Bhumi Vikas Rules, 2012 78` stripped.
   - Embedded rules (`12-A`, `17-a`, `25(A)`, `26-A`, `42-A`, `93(a)`) split into distinct indexed chunks.
4. **Amendment Tracking**: Automatic warning for plots up to 500 sq m under the 28 August 2026 amendment to Rule 2(5)(c).
5. **Silence Detection**: Unrelated queries (e.g., property tax, circle rates) return `status: "not_found"`.
6. **Bilingual Support**: Answers in Hindi for Hindi queries, English for English queries, with quotes in official English.

### What Doesn't (Known Boundaries):
1. **Consolidated rules cutoff**: The consolidated rulebook in data is up to **6 March 2025**. Any state gazette notifications after 28 Aug 2026 must be registered in `data/amendments.json`.
2. **Official Hindi PDF font**: As noted in the track guide, the official Hindi PDF uses a legacy font that cannot be parsed into text. Therefore, bilingual retrieval operates via query translation to English against the official English text.

---

## 6. Extra Data & Sources Used
- **MP Bhumi Vikas Rules 2012 (English consolidated to 6 March 2025)**: Source PDF provided in `./resources`.
- **28 August 2026 Amendment to Rule 2(5)(c)**: [TeamLease RegTech Legal Update](https://teamleaseregtech.com/updates/article/59469/government-of-madhya-pradesh-amendment-to-land-development-rules). Verified and stored in `data/amendments.json`.
- **Authoritative Tables**: Extracted directly from PDF pages 35-36 (Fees), 77-78 (Setbacks), 84 (FAR), and 34 (Farmhouse) stored in `data/tables.json`.

---

## 7. License
Open Source under the [MIT License](LICENSE). Offered to the Government of Madhya Pradesh through MPSeDC.
