from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Service, HealthCheck, Incident, IncidentEvent, Notification, ServiceStatusEvent
from app.monitoring.simulation_engine import simulation_engine
from app.monitoring.health_checker import execute_health_check
from app.monitoring.incident_detector import process_check_result
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/demo", tags=["Demo Mode Controls"])

class ScenarioTriggerRequest(BaseModel):
    service_id: Optional[int] = None
    scenario: str  # "Complete Outage", "Slow Response", "High Latency", "Intermittent Failure", "Recovery", "Normal Operation", "Flapping Service"

@router.get("/scenarios")
def get_scenarios():
    return [
        {
            "id": "Complete Outage",
            "name": "Simulate Complete Outage",
            "description": "Causes 503/connection errors, triggers automatic incident creation after failure threshold",
            "badge": "bg-red-100 text-red-800"
        },
        {
            "id": "High Latency",
            "name": "Simulate High Latency Spike",
            "description": "Spikes response time to 900ms - 1800ms exceeding critical threshold (Degraded state)",
            "badge": "bg-amber-100 text-amber-800"
        },
        {
            "id": "Slow Response",
            "name": "Simulate Slow Response",
            "description": "Increases latency to 350ms - 750ms exceeding warning threshold (Warning state)",
            "badge": "bg-yellow-100 text-yellow-800"
        },
        {
            "id": "Intermittent Failure",
            "name": "Simulate Intermittent Blips",
            "description": "Alternates random failures with healthy checks",
            "badge": "bg-purple-100 text-purple-800"
        },
        {
            "id": "Recovery",
            "name": "Simulate Swift Recovery",
            "description": "Restores pristine 25ms health checks, automatically closes open incidents",
            "badge": "bg-green-100 text-green-800"
        },
        {
            "id": "Normal Operation",
            "name": "Normal Operation",
            "description": "Standard 98% healthy baseline with realistic minor fluctuations",
            "badge": "bg-brand-100 text-brand-800"
        }
    ]

@router.post("/trigger")
async def trigger_demo_scenario(req: ScenarioTriggerRequest, db: Session = Depends(get_db)):
    if req.service_id:
        services = db.query(Service).filter(Service.id == req.service_id).all()
        if not services:
            raise HTTPException(status_code=404, detail="Service not found")
    else:
        # If no specific service specified, apply to Payment API or first service
        svc = db.query(Service).filter(Service.name.ilike("%Payment%")).first()
        services = [svc] if svc else db.query(Service).limit(1).all()

    target_service = services[0]
    simulation_engine.set_service_scenario(target_service.id, req.scenario)

    # Immediately execute a check so the UI reflects it instantaneously
    result = await execute_health_check(
        service_id=target_service.id,
        url=target_service.url,
        monitoring_type=target_service.monitoring_type,
        timeout_seconds=target_service.timeout_seconds,
        expected_status_code=target_service.expected_status_code,
        warning_threshold_ms=target_service.warning_threshold_ms,
        critical_threshold_ms=target_service.critical_threshold_ms,
        current_status=target_service.status
    )
    await process_check_result(db, target_service, result)

    # Broadcast notification to clients
    await manager.broadcast({
        "type": "DEMO_SCENARIO_APPLIED",
        "service_id": target_service.id,
        "service_name": target_service.name,
        "scenario": req.scenario,
        "status": target_service.status
    })

    return {
        "message": f"Applied scenario '{req.scenario}' to {target_service.name}",
        "service_id": target_service.id,
        "service_name": target_service.name,
        "status": target_service.status,
        "result": result
    }

@router.post("/reset")
async def reset_demo(db: Session = Depends(get_db)):
    simulation_engine.clear_all_scenarios()
    
    # Reset all services to Operational
    services = db.query(Service).all()
    for s in services:
        s.status = "Operational"
    
    # Auto-resolve any open incidents for clean demo state
    open_incidents = db.query(Incident).filter(Incident.status != "Resolved").all()
    for inc in open_incidents:
        inc.status = "Resolved"
        inc.resolved_at = db.query(Incident).first().created_at if db.query(Incident).first() else None
        inc.resolution_notes = "Reset to clean state via Demo Mode."

    db.commit()

    await manager.broadcast({
        "type": "DEMO_RESET",
        "message": "Demo state reset to all healthy services"
    })

    return {"message": "Demo state reset successfully. All services operational."}
