import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_dashboard_overview():
    response = client.get("/api/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["total_services"] >= 10
    assert "active_incidents" in data
    assert "latency_trend" in data

def test_services_list():
    response = client.get("/api/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) >= 10
    assert any(s["name"] == "Main Website" for s in services)

def test_service_groups():
    response = client.get("/api/service-groups")
    assert response.status_code == 200
    groups = response.json()
    assert len(groups) >= 4

def test_incidents_list():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 1

def test_uptime_summary():
    response = client.get("/api/uptime/summary")
    assert response.status_code == 200
    data = response.json()
    assert "periods" in data
    assert "24h" in data["periods"]

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@careplus.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["user"]["role"] == "Admin"

def test_demo_scenarios():
    response = client.get("/api/demo/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 5
