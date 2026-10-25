from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.connection import get_db
from app.models.all_models import Service, HealthCheck, Incident, IncidentEvent
from app.schemas.all_schemas import (
    DashboardOverviewResponse, DashboardSummaryCards,
    HealthCheckResponse, IncidentResponse, LatencyChartPoint
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    total_services = len(services)
    
    operational_count = sum(1 for s in services if s.status == "Operational")
    degraded_count = sum(1 for s in services if s.status == "Degraded")
    down_count = sum(1 for s in services if s.status == "Down")
    unknown_count = sum(1 for s in services if s.status == "Unknown")
    maintenance_count = sum(1 for s in services if s.status == "Maintenance")

    # Active incidents
    active_incidents_query = db.query(Incident).filter(Incident.status != "Resolved").order_by(desc(Incident.detected_at)).all()
    active_incidents_count = len(active_incidents_query)

    # Average response time from recent checks across all services (last 1 hour)
    one_hour_ago = utc_now() - timedelta(hours=1)
    recent_checks_1h = db.query(HealthCheck).filter(HealthCheck.checked_at >= one_hour_ago).all()
    
    if recent_checks_1h:
        valid_latencies = [c.response_time_ms for c in recent_checks_1h if c.response_time_ms is not None and c.response_time_ms > 0]
        avg_resp_time = round(sum(valid_latencies) / len(valid_latencies), 1) if valid_latencies else 0.0
    else:
        # Fallback to last 100 checks
        recent_100 = db.query(HealthCheck).order_by(desc(HealthCheck.checked_at)).limit(100).all()
        valid_latencies = [c.response_time_ms for c in recent_100 if c.response_time_ms is not None and c.response_time_ms > 0]
        avg_resp_time = round(sum(valid_latencies) / len(valid_latencies), 1) if valid_latencies else 0.0

    # Overall uptime over the last 24h
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)
    checks_24h = db.query(HealthCheck).filter(HealthCheck.checked_at >= twenty_four_hours_ago).all()
    if checks_24h:
        up_checks = sum(1 for c in checks_24h if c.status in ("Healthy", "Operational", "Degraded"))
        overall_uptime = round((up_checks / len(checks_24h)) * 100, 2)
    else:
        overall_uptime = 100.0 if operational_count > 0 else 0.0

    # Monitoring coverage
    monitored_services = sum(1 for s in services if s.monitoring_enabled and s.status != "Unknown")
    coverage_pct = round((monitored_services / total_services * 100), 1) if total_services > 0 else 100.0

    summary = DashboardSummaryCards(
        total_services=total_services,
        operational_services=operational_count,
        degraded_services=degraded_count,
        down_services=down_count,
        overall_uptime_percentage=overall_uptime,
        active_incidents=active_incidents_count,
        avg_response_time_ms=avg_resp_time,
        monitoring_coverage_percentage=coverage_pct
    )

    # Status distribution dictionary
    status_dist = {
        "Operational": operational_count,
        "Degraded": degraded_count,
        "Down": down_count,
        "Maintenance": maintenance_count,
        "Unknown": unknown_count
    }

    # Recent checks for live feed (last 15)
    recent_checks = db.query(HealthCheck).order_by(desc(HealthCheck.checked_at)).limit(15).all()

    # Latency trend over last 6 intervals (hours or 10-min buckets)
    now = utc_now()
    latency_points: List[LatencyChartPoint] = []
    uptime_trend_points: List[Dict[str, Any]] = []

    for i in range(7, -1, -1):
        bucket_start = now - timedelta(hours=i*3)
        bucket_end = bucket_start + timedelta(hours=3)
        bucket_checks = [c for c in checks_24h if bucket_start <= c.checked_at.replace(tzinfo=timezone.utc if c.checked_at.tzinfo is None else c.checked_at.tzinfo) < bucket_end]
        
        time_label = bucket_start.strftime("%H:%M")
        if bucket_checks:
            lats = sorted([c.response_time_ms for c in bucket_checks])
            avg_l = round(sum(lats) / len(lats), 1)
            p95_idx = int(len(lats) * 0.95)
            p95_l = round(lats[min(p95_idx, len(lats)-1)], 1)
            up_cnt = sum(1 for c in bucket_checks if c.status in ("Healthy", "Operational", "Degraded"))
            up_p = round((up_cnt / len(bucket_checks)) * 100, 1)
        else:
            avg_l = avg_resp_time or 45.0
            p95_l = round(avg_l * 1.5, 1)
            up_p = 100.0

        latency_points.append(LatencyChartPoint(
            time=time_label,
            avg_latency=avg_l,
            p95_latency=p95_l
        ))
        uptime_trend_points.append({
            "time": time_label,
            "uptime": up_p
        })

    # Transform active incidents for response
    active_incidents_res = []
    for inc in active_incidents_query:
        active_incidents_res.append(IncidentResponse(
            id=inc.id,
            incident_number=inc.incident_number,
            service_id=inc.service_id,
            service_name=inc.service.name if inc.service else "Unknown",
            title=inc.title,
            description=inc.description,
            severity=inc.severity,
            status=inc.status,
            detected_at=inc.detected_at,
            acknowledged_at=inc.acknowledged_at,
            recovery_started_at=inc.recovery_started_at,
            resolved_at=inc.resolved_at,
            duration_seconds=inc.duration_seconds,
            resolution_notes=inc.resolution_notes,
            assigned_user_id=inc.assigned_user_id,
            assigned_user_name=inc.assigned_user.name if inc.assigned_user else "Unassigned",
            events=[]
        ))

    return DashboardOverviewResponse(
        summary=summary,
        status_distribution=status_dist,
        recent_checks=[HealthCheckResponse.model_validate(c) for c in recent_checks],
        active_incidents=active_incidents_res,
        latency_trend=latency_points,
        uptime_trend=uptime_trend_points
    )

@router.get("/service-health")
def get_service_health_summary(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    results = []
    for s in services:
        latest_chk = db.query(HealthCheck).filter(HealthCheck.service_id == s.id).order_by(desc(HealthCheck.checked_at)).first()
        results.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "environment": s.environment,
            "status": s.status,
            "response_time_ms": latest_chk.response_time_ms if latest_chk else None,
            "last_checked_at": latest_chk.checked_at if latest_chk else None
        })
    return results
