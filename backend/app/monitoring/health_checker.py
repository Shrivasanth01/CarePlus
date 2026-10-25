import time
import httpx
from typing import Dict, Any
from app.utils.ssrf import validate_url_for_ssrf
from app.monitoring.simulation_engine import simulation_engine
from app.core.logging import logger

async def execute_health_check(
    service_id: int,
    url: str,
    monitoring_type: str = "HTTP",
    timeout_seconds: int = 5,
    expected_status_code: int = 200,
    warning_threshold_ms: int = 300,
    critical_threshold_ms: int = 800,
    current_status: str = "Operational"
) -> Dict[str, Any]:
    """
    Executes a health check either via real HTTP/HTTPS or via SimulationEngine.
    Returns dictionary with status, response_time_ms, http_status_code, error_message.
    """
    if monitoring_type == "Simulated" or url.startswith("sim://") or url.startswith("mock://"):
        return simulation_engine.simulate_check(
            service_id=service_id,
            warning_threshold_ms=warning_threshold_ms,
            critical_threshold_ms=critical_threshold_ms,
            current_status=current_status
        )

    # Real HTTP / HTTPS Monitoring with SSRF protection
    is_valid_url, error_msg = validate_url_for_ssrf(url)
    if not is_valid_url:
        return {
            "status": "Down",
            "response_time_ms": 0.0,
            "http_status_code": None,
            "error_message": f"Security validation failed: {error_msg}"
        }

    start_time = time.perf_counter()
    try:
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=True, limits=limits) as client:
            response = await client.get(url)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            http_status = response.status_code
            if http_status != expected_status_code:
                return {
                    "status": "Down",
                    "response_time_ms": elapsed_ms,
                    "http_status_code": http_status,
                    "error_message": f"Expected HTTP {expected_status_code}, received {http_status}"
                }
            
            # Response was expected code; check latency thresholds
            if elapsed_ms >= warning_threshold_ms:
                return {
                    "status": "Degraded",
                    "response_time_ms": elapsed_ms,
                    "http_status_code": http_status,
                    "error_message": f"Response time ({elapsed_ms}ms) exceeded warning threshold ({warning_threshold_ms}ms)"
                }
            
            return {
                "status": "Operational",
                "response_time_ms": elapsed_ms,
                "http_status_code": http_status,
                "error_message": None
            }

    except httpx.TimeoutException:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "Down",
            "response_time_ms": elapsed_ms,
            "http_status_code": 408,
            "error_message": f"Request timed out after {timeout_seconds}s"
        }
    except httpx.ConnectError as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "Down",
            "response_time_ms": elapsed_ms,
            "http_status_code": None,
            "error_message": f"Connection refused or unreachable: {str(e)}"
        }
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "Down",
            "response_time_ms": elapsed_ms,
            "http_status_code": None,
            "error_message": f"Health check failed: {str(e)}"
        }
