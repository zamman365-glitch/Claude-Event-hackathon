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
