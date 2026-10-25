import csv
import io
import json
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.all_models import Service, HealthCheck, Incident, ServiceGroup
from app.monitoring.uptime_calculator import calculate_service_uptime, calculate_latency_percentiles

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/availability")
def get_availability_analytics(period: str = "24h", db: Session = Depends(get_db)):
    services = db.query(Service).all()
    now = utc_now()
    delta = timedelta(hours=24) if period == "24h" else (timedelta(days=7) if period == "7d" else timedelta(days=30))
    start_time = now - delta

    by_environment = {}
    by_category = {}
    service_uptimes = []

    for s in services:
        u = calculate_service_uptime(db, s.id, start_time, now, method="check")["uptime_percentage"]
        service_uptimes.append(u)

        env = s.environment
        if env not in by_environment:
            by_environment[env] = []
        by_environment[env].append(u)

        cat = s.category
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(u)

    env_metrics = {k: round(sum(v)/len(v), 2) for k, v in by_environment.items()}
    cat_metrics = {k: round(sum(v)/len(v), 2) for k, v in by_category.items()}
    overall = round(sum(service_uptimes)/len(service_uptimes), 2) if service_uptimes else 100.0

    return {
        "overall_uptime": overall,
        "by_environment": env_metrics,
        "by_category": cat_metrics,
        "period": period
    }

@router.get("/response-time")
def get_response_time_analytics(period: str = "24h", db: Session = Depends(get_db)):
    services = db.query(Service).all()
    now = utc_now()
    delta = timedelta(hours=24) if period == "24h" else timedelta(days=7)
    start_time = now - delta

    service_perf = []
    all_latencies = []

    for s in services:
        checks = db.query(HealthCheck).filter(
            HealthCheck.service_id == s.id,
            HealthCheck.checked_at >= start_time
        ).all()
        lats = [c.response_time_ms for c in checks if c.response_time_ms and c.response_time_ms > 0]
        if lats:
            all_latencies.extend(lats)
            p = calculate_latency_percentiles(lats)
            service_perf.append({
                "service_id": s.id,
                "service_name": s.name,
                "category": s.category,
                "avg_latency": p["avg"],
                "p95_latency": p["p95"],
                "p99_latency": p["p99"],
                "min_latency": p["min"],
                "max_latency": p["max"]
            })

    # Sort slowest services by P95
    slowest_services = sorted(service_perf, key=lambda x: x["p95_latency"], reverse=True)[:5]
    global_p = calculate_latency_percentiles(all_latencies)

    return {
        "global_metrics": global_p,
        "slowest_services": slowest_services,
        "all_services": service_perf
    }

@router.get("/incidents")
def get_incident_analytics(period: str = "30d", db: Session = Depends(get_db)):
    now = utc_now()
    delta = timedelta(days=30)
    start_time = now - delta

    incidents = db.query(Incident).filter(Incident.detected_at >= start_time).all()
    total = len(incidents)
    resolved = [i for i in incidents if i.status == "Resolved" and i.duration_seconds is not None]
    active = [i for i in incidents if i.status != "Resolved"]

    durations = [i.duration_seconds for i in resolved if i.duration_seconds]
    mttr_seconds = round(sum(durations) / len(durations), 1) if durations else 0.0

    # Incident count per service
    by_service = {}
    for i in incidents:
        sname = i.service.name if i.service else "Unknown"
        by_service[sname] = by_service.get(sname, 0) + 1

    most_affected = sorted([{"service": k, "count": v} for k, v in by_service.items()], key=lambda x: x["count"], reverse=True)[:5]

    return {
        "total_incidents": total,
        "resolved_incidents": len(resolved),
        "active_incidents": len(active),
        "mttr_seconds": mttr_seconds,
        "mttr_minutes": round(mttr_seconds / 60, 1),
        "most_affected_services": most_affected
    }

@router.get("/reliability")
def get_reliability_index(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)
    uptimes = [calculate_service_uptime(db, s.id, twenty_four_hours_ago, utc_now(), method="check")["uptime_percentage"] for s in services]
    avg_uptime = sum(uptimes)/len(uptimes) if uptimes else 100.0

    # Reliability score out of 100 based on uptime, open incidents, and p95 latency
    active_incidents = db.query(Incident).filter(Incident.status != "Resolved").count()
    penalty = min(active_incidents * 5.0, 30.0)
    reliability_score = round(max(0.0, avg_uptime - penalty), 2)

    return {
        "reliability_score": reliability_score,
        "sla_target_percentage": 99.9,
        "sla_met": avg_uptime >= 99.9,
        "status": "Healthy" if reliability_score >= 95.0 else ("At Risk" if reliability_score >= 85.0 else "Critical")
    }

@router.get("/export")
def export_analytics_data(format: str = "json", db: Session = Depends(get_db)):
    services = db.query(Service).all()
    now = utc_now()
    start_time = now - timedelta(days=7)

    rows = []
    for s in services:
        u = calculate_service_uptime(db, s.id, start_time, now, method="check")
        rows.append({
            "service_id": s.id,
            "name": s.name,
            "category": s.category,
            "environment": s.environment,
            "status": s.status,
            "uptime_percentage": u["uptime_percentage"],
            "total_checks": u["total_checks"],
            "successful_checks": u["successful_checks"],
            "failed_checks": u["failed_checks"],
            "downtime_minutes": u["total_downtime_minutes"]
        })

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()) if rows else ["id"])
        writer.writeheader()
        writer.writerows(rows)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=careplus_analytics_{now.strftime('%Y%m%d')}.csv"}
        )
    else:
        return {"report_date": now.isoformat(), "services": rows}
