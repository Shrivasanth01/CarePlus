from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Service, HealthCheck, Incident
from app.monitoring.uptime_calculator import calculate_service_uptime

router = APIRouter(prefix="/uptime", tags=["Uptime"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/summary")
def get_uptime_summary(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    now = utc_now()
    periods = {
        "1h": now - timedelta(hours=1),
        "24h": now - timedelta(hours=24),
        "7d": now - timedelta(days=7),
        "30d": now - timedelta(days=30),
        "90d": now - timedelta(days=90),
    }

    results = {}
    for label, start_time in periods.items():
        if not services:
            results[label] = 100.0
            continue
        service_uptimes = []
        for s in services:
            data = calculate_service_uptime(db, s.id, start_time, now, method="check")
            service_uptimes.append(data["uptime_percentage"])
        results[label] = round(sum(service_uptimes) / len(service_uptimes), 2) if service_uptimes else 100.0

    return {
        "periods": results,
        "total_monitored_services": len(services),
        "calculation_basis": "interval_and_check"
    }

@router.get("/services")
def get_services_uptime(
    period: str = "24h",
    method: str = "interval",
    db: Session = Depends(get_db)
):
    services = db.query(Service).all()
    now = utc_now()
    if period == "1h":
        start_time = now - timedelta(hours=1)
    elif period == "7d":
        start_time = now - timedelta(days=7)
    elif period == "30d":
        start_time = now - timedelta(days=30)
    elif period == "90d":
        start_time = now - timedelta(days=90)
    else:
        start_time = now - timedelta(hours=24)

    results = []
    for s in services:
        uptime_info = calculate_service_uptime(db, s.id, start_time, now, method=method)
        
        # Calculate daily or hourly blocks for visual green/red bar
        blocks = []
        num_blocks = 24 if period in ["1h", "24h"] else 30
        block_delta = (now - start_time) / num_blocks

        for i in range(num_blocks):
            b_start = start_time + (block_delta * i)
            b_end = b_start + block_delta
            b_data = calculate_service_uptime(db, s.id, b_start, b_end, method="check")
            status = "operational"
            if b_data["uptime_percentage"] < 80.0:
                status = "down"
            elif b_data["uptime_percentage"] < 99.0:
                status = "degraded"
            
            blocks.append({
                "time": b_start.strftime("%Y-%m-%d %H:%M"),
                "status": status,
                "uptime": b_data["uptime_percentage"]
            })

        results.append({
            "service_id": s.id,
            "service_name": s.name,
            "category": s.category,
            "environment": s.environment,
            "uptime_percentage": uptime_info["uptime_percentage"],
            "total_downtime_minutes": uptime_info["total_downtime_minutes"],
            "successful_checks": uptime_info["successful_checks"],
            "failed_checks": uptime_info["failed_checks"],
            "timeline_blocks": blocks
        })

    return results

@router.get("/{service_id}")
def get_service_uptime_detail(
    service_id: int,
    period: str = "24h",
    method: str = "interval",
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    now = utc_now()
    if period == "1h":
        start_time = now - timedelta(hours=1)
    elif period == "7d":
        start_time = now - timedelta(days=7)
    elif period == "30d":
        start_time = now - timedelta(days=30)
    elif period == "90d":
        start_time = now - timedelta(days=90)
    else:
        start_time = now - timedelta(hours=24)

    uptime_data = calculate_service_uptime(db, service_id, start_time, now, method=method)
    
    # Check incidents
    incidents = db.query(Incident).filter(
        Incident.service_id == service_id,
        Incident.detected_at >= start_time
    ).all()

    avg_incident_duration = 0.0
    longest_outage = 0.0
    if incidents:
        durations = [inc.duration_seconds or 0 for inc in incidents]
        avg_incident_duration = round(sum(durations) / len(durations), 1)
        longest_outage = max(durations)

    return {
        "service_id": service.id,
        "service_name": service.name,
        "period": period,
        "method": method,
        "uptime_percentage": uptime_data["uptime_percentage"],
        "total_downtime_minutes": uptime_data["total_downtime_minutes"],
        "eligible_monitoring_hours": uptime_data["eligible_monitoring_hours"],
        "maintenance_hours": uptime_data["maintenance_hours"],
        "incident_count": len(incidents),
        "avg_incident_duration_seconds": avg_incident_duration,
        "longest_outage_seconds": longest_outage
    }
