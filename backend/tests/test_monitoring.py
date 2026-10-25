import pytest
import os
from datetime import datetime, timedelta, timezone
from app.utils.ssrf import validate_url_for_ssrf, is_ip_private
from app.monitoring.simulation_engine import simulation_engine
from app.monitoring.uptime_calculator import calculate_latency_percentiles

def test_ssrf_blocks_private_ips():
    assert is_ip_private("127.0.0.1") is True
    assert is_ip_private("10.0.0.1") is True
    assert is_ip_private("192.168.1.1") is True
    assert is_ip_private("172.16.0.1") is True
    assert is_ip_private("169.254.169.254") is True
    assert is_ip_private("8.8.8.8") is False

def test_ssrf_url_validation():
    # Loopback & localhost blocked
    valid, _ = validate_url_for_ssrf("http://localhost:8000/api", allow_private=False)
    assert valid is False

    valid, _ = validate_url_for_ssrf("http://127.0.0.1:5000/test", allow_private=False)
    assert valid is False

    # Unsupported protocol
    valid, msg = validate_url_for_ssrf("file:///etc/passwd")
    assert valid is False
    assert "Unsupported protocol" in msg

def test_simulation_engine_scenarios():
    simulation_engine.clear_all_scenarios()
    
    # Normal operation
    check = simulation_engine.simulate_check(service_id=1, warning_threshold_ms=300, critical_threshold_ms=800)
    assert "status" in check
    assert "response_time_ms" in check

    # Force Outage scenario
    simulation_engine.set_service_scenario(service_id=99, scenario="Complete Outage")
    check_outage = simulation_engine.simulate_check(service_id=99)
    assert check_outage["status"] == "Down"
    assert check_outage["http_status_code"] in [503, 502, 500, None]

    # Force Slow Response scenario
    simulation_engine.set_service_scenario(service_id=99, scenario="Slow Response")
    check_slow = simulation_engine.simulate_check(service_id=99, warning_threshold_ms=200, critical_threshold_ms=600)
    assert check_slow["status"] == "Degraded"
    assert check_slow["response_time_ms"] > 200

    # Swift Recovery scenario
    simulation_engine.set_service_scenario(service_id=99, scenario="Recovery")
    check_rec = simulation_engine.simulate_check(service_id=99)
    assert check_rec["status"] == "Operational"
    assert check_rec["http_status_code"] == 200

def test_latency_percentiles():
    latencies = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0]
    res = calculate_latency_percentiles(latencies)
    assert res["min"] == 10.0
    assert res["max"] == 100.0
    assert res["avg"] == 55.0
    assert res["median"] == 50.0
    assert res["p95"] == 100.0
