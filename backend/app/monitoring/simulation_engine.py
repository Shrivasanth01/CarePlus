import random
import time
from typing import Dict, Any, Optional

class SimulationEngine:
    def __init__(self):
        # Service ID -> forced scenario
        self.active_scenarios: Dict[int, str] = {}
        # Service ID -> flapping counter
        self.flapping_state: Dict[int, bool] = {}

    def set_service_scenario(self, service_id: int, scenario: Optional[str]):
        if scenario:
            self.active_scenarios[service_id] = scenario
        else:
            self.active_scenarios.pop(service_id, None)

    def get_service_scenario(self, service_id: int) -> Optional[str]:
        return self.active_scenarios.get(service_id)

    def clear_all_scenarios(self):
        self.active_scenarios.clear()
        self.flapping_state.clear()

    def simulate_check(
        self,
        service_id: int,
        warning_threshold_ms: int = 300,
        critical_threshold_ms: int = 800,
        current_status: str = "Operational"
    ) -> Dict[str, Any]:
        """
        Generates realistic simulation data according to current active scenario or normal probability.
        """
        scenario = self.active_scenarios.get(service_id, "Normal Operation")

        if scenario == "Complete Outage":
            return {
                "status": "Down",
                "response_time_ms": round(random.uniform(1200.0, 3000.0), 2),
                "http_status_code": random.choice([503, 502, 500, None]),
                "error_message": random.choice([
                    "Connection refused: Service unavailable on target port",
                    "HTTP 503 Service Unavailable: Backend workers exhausted",
                    "Gateway Timeout: Upstream did not respond within deadline",
                    "ReadTimeout: Connection closed prematurely by server"
                ])
            }

        elif scenario == "Slow Response":
            latency = round(random.uniform(warning_threshold_ms + 40, critical_threshold_ms - 20), 2)
            return {
                "status": "Degraded",
                "response_time_ms": latency,
                "http_status_code": 200,
                "error_message": f"Latency ({latency}ms) exceeded warning threshold ({warning_threshold_ms}ms)"
            }

        elif scenario == "High Latency":
            latency = round(random.uniform(critical_threshold_ms + 100, critical_threshold_ms + 800), 2)
            return {
                "status": "Degraded",
                "response_time_ms": latency,
                "http_status_code": 200,
                "error_message": f"Severe latency spike ({latency}ms) exceeded critical threshold ({critical_threshold_ms}ms)"
            }

        elif scenario == "Intermittent Failure":
            fail = random.random() < 0.45
            if fail:
                return {
                    "status": "Down",
                    "response_time_ms": round(random.uniform(400.0, 1100.0), 2),
                    "http_status_code": 500,
                    "error_message": "Internal Server Error: Intermittent database connection pool failure"
                }
            else:
                return {
                    "status": "Operational",
                    "response_time_ms": round(random.uniform(80.0, 220.0), 2),
                    "http_status_code": 200,
                    "error_message": None
                }

        elif scenario == "Flapping Service":
            is_up = not self.flapping_state.get(service_id, False)
            self.flapping_state[service_id] = is_up
            if is_up:
                return {
                    "status": "Operational",
                    "response_time_ms": round(random.uniform(45.0, 150.0), 2),
                    "http_status_code": 200,
                    "error_message": None
                }
            else:
                return {
                    "status": "Down",
                    "response_time_ms": round(random.uniform(600.0, 1500.0), 2),
                    "http_status_code": 502,
                    "error_message": "Bad Gateway: Upstream node flapped offline"
                }

        elif scenario == "Recovery":
            # Swift recovery to pristine state
            return {
                "status": "Operational",
                "response_time_ms": round(random.uniform(30.0, 85.0), 2),
                "http_status_code": 200,
                "error_message": None
            }

        else: # "Normal Operation" default
            roll = random.random()
            if roll < 0.94:
                # Normal healthy response
                latency = round(random.uniform(25.0, 180.0), 2)
                return {
                    "status": "Operational",
                    "response_time_ms": latency,
                    "http_status_code": 200,
                    "error_message": None
                }
            elif roll < 0.98:
                # Slight transient latency spike
                latency = round(random.uniform(warning_threshold_ms + 10, warning_threshold_ms + 120), 2)
                return {
                    "status": "Degraded",
                    "response_time_ms": latency,
                    "http_status_code": 200,
                    "error_message": f"Transient latency increase ({latency}ms)"
                }
            else:
                # Rare intermittent blip
                return {
                    "status": "Down",
                    "response_time_ms": round(random.uniform(500.0, 1200.0), 2),
                    "http_status_code": 503,
                    "error_message": "Transient 503 error from upstream proxy"
                }

simulation_engine = SimulationEngine()
