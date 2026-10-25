import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import HealthCheck, Service, Incident, MaintenanceWindow

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def calculate_service_uptime(
    db: Session,
    service_id: int,
    start_time: datetime,
    end_time: datetime,
    method: str = "interval"  # "interval" or "check"
) -> Dict[str, Any]:
    """
    Computes precise uptime percentage for a given service over a time window.
    Accounts for maintenance windows by excluding maintenance time.
    """
    start_time = ensure_utc(start_time)
    end_time = ensure_utc(end_time)
    total_window_seconds = max((end_time - start_time).total_seconds(), 1.0)

    # 1. Calculate eligible maintenance duration within the window
    maint_windows = db.query(MaintenanceWindow).filter(
        (MaintenanceWindow.service_id == service_id) | (MaintenanceWindow.service_id.is_(None)),
        MaintenanceWindow.status.in_(["Completed", "In Progress"])
    ).all()

    maintenance_seconds = 0.0
    for mw in maint_windows:
        mw_start = ensure_utc(mw.start_time)
        mw_end = ensure_utc(mw.end_time)
        if mw_start < end_time and mw_end > start_time:
            overlap_start = max(mw_start, start_time)
            overlap_end = min(mw_end, end_time)
            if overlap_end > overlap_start:
                maintenance_seconds += (overlap_end - overlap_start).total_seconds()

    eligible_monitoring_seconds = max(total_window_seconds - maintenance_seconds, 1.0)

    # 2. Query health checks in this period
    checks = db.query(HealthCheck).filter(
        HealthCheck.service_id == service_id
    ).all()

    # Filter checks by date with tz awareness
    filtered_checks = [
        c for c in checks
        if start_time <= ensure_utc(c.checked_at) <= end_time
    ]

    total_checks = len(filtered_checks)
    if total_checks == 0:
        return {
            "uptime_percentage": 100.0,
            "total_checks": 0,
            "successful_checks": 0,
            "failed_checks": 0,
            "total_downtime_minutes": 0.0,
            "eligible_monitoring_hours": round(eligible_monitoring_seconds / 3600, 2),
            "maintenance_hours": round(maintenance_seconds / 3600, 2),
            "calculation_method": method
        }

    successful_checks = sum(1 for c in filtered_checks if c.status in ("Healthy", "Operational", "Degraded"))
    failed_checks = total_checks - successful_checks

    if method == "check":
        uptime_pct = round((successful_checks / total_checks) * 100, 2)
        total_downtime_minutes = round((failed_checks / total_checks) * (eligible_monitoring_seconds / 60), 2)
    else:
        # Interval-based calculation
        incidents = db.query(Incident).filter(
            Incident.service_id == service_id
        ).all()

        downtime_seconds = 0.0
        for inc in incidents:
            inc_start = ensure_utc(inc.detected_at)
            inc_end = ensure_utc(inc.resolved_at) if inc.resolved_at else utc_now()
            if inc_start <= end_time and inc_end >= start_time:
                overlap_start = max(inc_start, start_time)
                overlap_end = min(inc_end, end_time)
                if overlap_end > overlap_start:
                    downtime_seconds += (overlap_end - overlap_start).total_seconds()

        # If no explicit incident logged, but failed checks exist, estimate interval downtime
        if downtime_seconds == 0.0 and failed_checks > 0:
            downtime_seconds = (failed_checks / total_checks) * eligible_monitoring_seconds

        downtime_seconds = min(downtime_seconds, eligible_monitoring_seconds)
        available_seconds = eligible_monitoring_seconds - downtime_seconds
        uptime_pct = round((available_seconds / eligible_monitoring_seconds) * 100, 2)
        total_downtime_minutes = round(downtime_seconds / 60, 2)

    return {
        "uptime_percentage": max(0.0, min(100.0, uptime_pct)),
        "total_checks": total_checks,
        "successful_checks": successful_checks,
        "failed_checks": failed_checks,
        "total_downtime_minutes": total_downtime_minutes,
        "eligible_monitoring_hours": round(eligible_monitoring_seconds / 3600, 2),
        "maintenance_hours": round(maintenance_seconds / 3600, 2),
        "calculation_method": method
    }

def calculate_latency_percentiles(latencies: List[float]) -> Dict[str, float]:
    if not latencies:
        return {
            "avg": 0.0,
            "min": 0.0,
            "max": 0.0,
            "median": 0.0,
            "p95": 0.0,
            "p99": 0.0
        }

    sorted_lats = sorted(latencies)
    n = len(sorted_lats)

    def percentile(p: float) -> float:
        idx = int(math.ceil((p / 100.0) * n)) - 1
        idx = max(0, min(idx, n - 1))
        return sorted_lats[idx]

    return {
        "avg": round(sum(sorted_lats) / n, 2),
        "min": round(sorted_lats[0], 2),
        "max": round(sorted_lats[-1], 2),
        "median": round(percentile(50), 2),
        "p95": round(percentile(95), 2),
        "p99": round(percentile(99), 2)
    }
