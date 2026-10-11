"""
app.py
FastAPI application for Bhumi Vikas Sahayak.
Dedicated backend and clerk UI for Bhopal Municipal Corporation building-permission counter.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from amendments import AMENDMENTS, RULES_VERSION
from calculators import run_all_applicable_calculators
from db import get_rule_by_number, init_database
from schemas import BhumiVikasResponse, QueryRequest
from service import process_query

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield

app = FastAPI(
    title="Bhumi Vikas Sahayak API",
    description="Backend assistant for Bhopal Municipal Corporation building-permission clerk (MP Bhumi Vikas Rules 2012)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CalculateRequest(BaseModel):
    plot_area: Optional[float] = Field(None, description="Plot area in square metres")
    road_width: Optional[float] = Field(None, description="Street / road width in metres")
    building_height: Optional[float] = Field(9.0, description="Building height in metres (default 9.0m)")
    built_up_area: Optional[float] = Field(None, description="Built-up area in square metres")
    use_group: str = Field("residential", description="residential | commercial | farmhouse")


@app.post("/api/query", response_model=BhumiVikasResponse)
def handle_query(req: QueryRequest) -> BhumiVikasResponse:
    """Answers a clerk query in English or Hindi with exact rule citations and calculations."""
    return process_query(req.query)


@app.post("/api/calculate")
def handle_calculate(req: CalculateRequest) -> Dict[str, Any]:
    """Direct calculation engine for setbacks, FAR, and fees."""
    return run_all_applicable_calculators(
        plot_area=req.plot_area,
        road_width=req.road_width,
        building_height=req.building_height,
        built_up_area=req.built_up_area,
        use_group=req.use_group,
    )


@app.get("/api/rules/{rule_no}")
def get_rule_details(rule_no: str) -> Dict[str, Any]:
    """Retrieves authoritative rule text by number."""
    rule = get_rule_by_number(rule_no)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_no} not found.")
    return rule


@app.get("/api/amendments")
def list_amendments() -> List[Dict[str, Any]]:
    """Lists amendments beyond the 6 March 2025 consolidated copy."""
    return AMENDMENTS


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "Bhumi Vikas Sahayak",
        "rules_version": RULES_VERSION,
        "clerk_target": "Bhopal Municipal Corporation Building-Permission Counter",
    }


CLERK_UI_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bhumi Vikas Sahayak · Bhopal Municipal Corporation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b1120;
      --card-bg: #1e293b;
      --card-border: rgba(148, 163, 184, 0.15);
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --accent: #f59e0b;
      --success: #10b981;
      --danger: #ef4444;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 800;
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .brand-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .badge {
      background: rgba(56, 189, 248, 0.1);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    main {
      flex: 1;
      max-width: 1000px;
      width: 100%;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .query-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
      margin-bottom: 2rem;
    }
    .sample-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-muted);
    }
    .pill:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
      color: var(--text);
    }
    .input-row {
      display: flex;
      gap: 0.75rem;
    }
    textarea {
      flex: 1;
      background: #0f172a;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 0.85rem 1rem;
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      resize: vertical;
      min-height: 70px;
      outline: none;
    }
    textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    button.ask-btn {
      background: var(--primary);
      color: #0b1120;
      border: none;
      border-radius: 12px;
      padding: 0 1.5rem;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    button.ask-btn:hover {
      background: var(--primary-hover);
    }
    .results-area {
      display: none;
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .status-banner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    .status-answered { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-not_found { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-needs_info { background: rgba(245, 158, 11, 0.15); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.3); }
    .warning-box {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .answer-text {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .citation-card {
      background: #0f172a;
      border: 1px solid var(--card-border);
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-bottom: 0.75rem;
    }
    .cit-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.35rem;
    }
    .cit-quote {
      font-family: monospace;
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.4;
    }
    .calc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
      margin: 1rem 0;
    }
    .calc-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0.75rem 1rem;
    }
    .calc-label { font-size: 0.75rem; color: var(--text-muted); }
    .calc-val { font-size: 1.25rem; font-weight: 700; color: #38bdf8; margin-top: 0.25rem; }
    .disclaimer {
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--card-border);
      padding-top: 1rem;
      margin-top: 1.5rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">BV</div>
      <div>
        <div class="brand-title">Bhumi Vikas Sahayak</div>
        <div class="brand-sub">Bhopal Municipal Corporation · Building Permission Counter</div>
      </div>
    </div>
    <div class="badge">Rules consolidated up to 2025-03-06</div>
  </header>

  <main>
    <div class="query-card">
      <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Sample counter questions (click to test):</div>
      <div class="sample-pills">
        <div class="pill" onclick="setQuery('My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?')">Q1: 10m road setback</div>
        <div class="pill" onclick="setQuery('I want a farm house on agricultural land. What is the minimum plot size and the maximum FAR?')">Q2: Farmhouse norms</div>
        <div class="pill" onclick="setQuery('My development permission was granted in 2023. How long does it stay valid, and how many times can I renew it?')">Q3: Validity of permission</div>
        <div class="pill" onclick="setQuery('I applied for building permission and the authority has not replied. What happens if they miss the deadline?')">Q4: Missed deadline</div>
        <div class="pill" onclick="setQuery('Do I need separate development permission for a 300 sq m plot that matches the Development Plan?')">Q11: 300 sqm & Aug 2026 amendment</div>
        <div class="pill" onclick="setQuery('मेरा प्लॉट 200 वर्ग मीटर का है और सामने 9 मीटर चौड़ी सड़क है। आगे कितनी जगह खाली छोड़नी होगी?')">Q14 (Hindi): 200 sqm 9m road</div>
        <div class="pill" onclick="setQuery('How do I pay my property tax online?')">Q16: Property tax (out of scope)</div>
      </div>

      <div class="input-row">
        <textarea id="queryInput" placeholder="Ask in plain English or Hindi (e.g. My plot is 200 sq m on a 9 m road. How much front open space?)..."></textarea>
        <button class="ask-btn" id="askBtn" onclick="runQuery()">Ask Assistant</button>
      </div>
    </div>

    <div class="query-card results-area" id="resultsArea">
      <div id="statusBadge"></div>
      <div id="warningContainer"></div>
      <div class="answer-text" id="answerText"></div>
      
      <div id="calculationsContainer"></div>
      
      <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;" id="citationsHeader">AUTHORITATIVE CITATIONS:</div>
      <div id="citationsContainer"></div>

      <div class="disclaimer">The tool points to the rule; the clerk decides. It is not legal advice.</div>
    </div>
  </main>

  <script>
    function setQuery(text) {
      document.getElementById('queryInput').value = text;
      runQuery();
    }

    async function runQuery() {
      const q = document.getElementById('queryInput').value.trim();
      if (!q) return;

      const btn = document.getElementById('askBtn');
      btn.innerText = 'Checking...';
      btn.disabled = true;

      try {
        const resp = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q })
        });
        const data = await resp.json();
        renderResults(data);
      } catch (err) {
        alert('Error contacting backend: ' + err);
      } finally {
        btn.innerText = 'Ask Assistant';
        btn.disabled = false;
      }
    }

    function renderResults(data) {
      const area = document.getElementById('resultsArea');
      area.style.display = 'block';

      // Status Badge
      const badge = document.getElementById('statusBadge');
      badge.className = 'status-banner status-' + data.status;
      badge.innerText = 'STATUS: ' + data.status.replace('_', ' ').toUpperCase();

      // Warnings
      const warnBox = document.getElementById('warningContainer');
      warnBox.innerHTML = '';
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach(w => {
          const div = document.createElement('div');
          div.className = 'warning-box';
          div.innerText = w;
          warnBox.appendChild(div);
        });
      }

      // Answer
      document.getElementById('answerText').innerText = data.answer;

      // Calculations
      const calcBox = document.getElementById('calculationsContainer');
      calcBox.innerHTML = '';
      if (data.calculation && Object.keys(data.calculation).length > 0) {
        const title = document.createElement('div');
        title.style.fontSize = '0.85rem';
        title.style.fontWeight = '600';
        title.style.color = 'var(--text-muted)';
        title.innerText = 'VERIFIED ARITHMETIC CALCULATIONS:';
        calcBox.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'calc-grid';

        if (data.calculation.front_open_space) {
          const item = document.createElement('div');
          item.className = 'calc-item';
          item.innerHTML = '<div class="calc-label">Front Setback (Rule 56)</div><div class="calc-val">' + data.calculation.front_open_space.front_open_space_m + ' m</div>';
          grid.appendChild(item);
        }
        if (data.calculation.rear_open_space) {
          const item = document.createElement('div');
          item.className = 'calc-item';
          item.innerHTML = '<div class="calc-label">Rear Setback (Rule 56)</div><div class="calc-val">' + data.calculation.rear_open_space.rear_open_space_m + ' m</div>';
          grid.appendChild(item);
        }
        if (data.calculation.far) {
          const item = document.createElement('div');
          item.className = 'calc-item';
          item.innerHTML = '<div class="calc-label">FAR (Rule 61 Table 8)</div><div class="calc-val">' + data.calculation.far.far + '</div>';
          grid.appendChild(item);
        }
        if (data.calculation.fees) {
          const item = document.createElement('div');
          item.className = 'calc-item';
          item.innerHTML = '<div class="calc-label">Total Fee (Rule 21)</div><div class="calc-val">Rs. ' + data.calculation.fees.total_fee_rs + '</div>';
          grid.appendChild(item);
        }
        calcBox.appendChild(grid);
      }

      // Citations
      const citBox = document.getElementById('citationsContainer');
      citBox.innerHTML = '';
      if (data.citations && data.citations.length > 0) {
        document.getElementById('citationsHeader').style.display = 'block';
        data.citations.forEach(c => {
          const card = document.createElement('div');
          card.className = 'citation-card';
          card.innerHTML = '<div class="cit-header"><span>Rule ' + c.rule + '</span><span>PDF Page ' + c.page + '</span></div><div class="cit-quote">"' + c.quote + '"</div>';
          citBox.appendChild(card);
        });
      } else {
        document.getElementById('citationsHeader').style.display = 'none';
      }
    }
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def serve_clerk_ui() -> HTMLResponse:
    """Serves the interactive counter clerk interface."""
    return HTMLResponse(content=CLERK_UI_HTML)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
