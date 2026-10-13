"""
tests/test_api.py
FastAPI test suite testing REST endpoints, schema validation, and amendments.
"""

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["rules_version"] == "consolidated up to 2025-03-06"


def test_query_setback():
    resp = client.post("/api/query", json={
        "query": "My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "answered"
    assert "3.6" in data["answer"]
    assert len(data["citations"]) > 0
    assert data["citations"][0]["rule"] == "56"
    assert data["citations"][0]["page"] == 77
    assert data["rules_version"] == "consolidated up to 2025-03-06"


def test_query_amendment_warning():
    resp = client.post("/api/query", json={
        "query": "Do I need separate development permission for a 300 sq m plot that matches the Development Plan?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "answered"
    assert len(data["warnings"]) > 0
    assert any("28 Aug 2026" in w or "28 अगस्त 2026" in w for w in data["warnings"])


def test_query_out_of_scope_property_tax():
    resp = client.post("/api/query", json={
        "query": "How do I pay my property tax online?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "not_found"
    assert data["answer"] == "not found"
    assert len(data["citations"]) == 0


def test_calculate_endpoint():
    resp = client.post("/api/calculate", json={
        "plot_area": 200.0,
        "road_width": 9.0,
        "building_height": 9.0,
        "use_group": "residential"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "calculations" in data
    calcs = data["calculations"]
    assert calcs["front_open_space"]["front_open_space_m"] == 3.0
    assert calcs["rear_open_space"]["rear_open_space_m"] == 2.5
    assert calcs["fees"]["total_fee_rs"] == 2200.0


def test_rules_lookup_endpoint():
    resp = client.get("/api/rules/56")
    assert resp.status_code == 200
    data = resp.json()
    assert data["rule"] == "56"
    assert data["title"] == "Residential Buildings"
    assert data["page_start"] == 77


def test_list_all_rules():
    resp = client.get("/api/rules")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 106
    # Verify required fields
    r1 = data[0]
    assert "rule_no" in r1
    assert "sub_rule" in r1
    assert "title" in r1
    assert "part" in r1
    assert "page_start" in r1
    assert "page_end" in r1


def test_search_rules_endpoint():
    resp = client.get("/api/rules/search?q=open space")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    item = data[0]
    assert "rule_no" in item
    assert "title" in item
    assert "page_start" in item
    assert "page_end" in item
    assert "snippet" in item
    assert len(item["snippet"]) > 0


def test_health_provider_and_mock():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "provider" in data
    assert "mock" in data
    assert isinstance(data["mock"], bool)


def test_pdf_static_mount():
    resp = client.get("/pdf/MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_EN.pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"


def test_query_lang_override():
    # Force English on Hindi text
    resp_en = client.post("/api/query", json={
        "query": "बिल्डिंग परमिशन की फीस कितनी है?",
        "lang": "en"
    })
    assert resp_en.status_code == 200
    data_en = resp_en.json()
    assert "fees" in data_en["answer"].lower()

    # Force Hindi on English text
    resp_hi = client.post("/api/query", json={
        "query": "What is the fee for building permission?",
        "lang": "hi"
    })
    assert resp_hi.status_code == 200
    data_hi = resp_hi.json()
    assert "फीस" in data_hi["answer"] or "अनुमति" in data_hi["answer"]


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200


def test_health_mock_flag_reflects_provider(monkeypatch):
    # Mock mode
    monkeypatch.setenv("PROVIDER", "mock")
    monkeypatch.delenv("LLM_MOCK", raising=False)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["mock"] is True
    assert resp.json()["provider"] == "mock"

    # Real provider mode
    monkeypatch.setenv("PROVIDER", "gemini")
    resp_gem = client.get("/api/health")
    assert resp_gem.status_code == 200
    assert resp_gem.json()["mock"] is False
    assert resp_gem.json()["provider"] == "gemini"


def test_real_provider_failure_returns_http_error(monkeypatch):
    monkeypatch.setenv("PROVIDER", "gemini")
    monkeypatch.delenv("LLM_MOCK", raising=False)
    monkeypatch.setenv("MODEL_FAST", "gemini-2.0-flash")
    monkeypatch.setenv("MODEL_ANSWER", "gemini-2.0-flash")
    monkeypatch.setenv("GEMINI_API_KEY", "")  # Missing key triggers 401

    resp = client.post("/api/query", json={
        "query": "What is the front setback for a 200 sq m plot on a 9 m road?"
    })
    # Must return clear HTTP error status, never 200 with fake mock answer
    assert resp.status_code in [400, 401, 502]
    assert "LLM Provider Error" in resp.json()["detail"]


