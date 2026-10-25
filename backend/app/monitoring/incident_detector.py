import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.all_models import (
    Service, HealthCheck, Incident, IncidentEvent,
    Notification, ServiceStatusEvent, MaintenanceWindow, User
)
from app.websocket.connection_manager import manager
from app.core.logging import logger

def utc_now():
    return datetime.now(timezone.utc)

def ensure_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def is_service_in_maintenance(db: Session, service_id: int) -> bool:
    now = utc_now()
    maint_windows = db.query(MaintenanceWindow).filter(
        (MaintenanceWindow.service_id == service_id) | (MaintenanceWindow.service_id.is_(None)),
        MaintenanceWindow.status.in_(["Scheduled", "In Progress"])
    ).all()
    for mw in maint_windows:
        if ensure_utc(mw.start_time) <= now <= ensure_utc(mw.end_time):
            return True
    return False

async def process_check_result(
    db: Session,
    service: Service,
    check_result: dict
):
    """
    Evaluates recent health checks, triggers status transitions, handles incident creation
    and resolution, logs events, creates notifications, and broadcasts live updates.
    """
    # 1. Save HealthCheck record
    health_check = HealthCheck(
        service_id=service.id,
        check_type=service.monitoring_type,
        status=check_result["status"],
        response_time_ms=check_result["response_time_ms"],
        http_status_code=check_result.get("http_status_code"),
        error_message=check_result.get("error_message"),
        checked_at=utc_now()
    )
    db.add(health_check)
    db.commit()
    db.refresh(health_check)

    # 2. Check if service is currently under maintenance
    in_maintenance = is_service_in_maintenance(db, service.id)
    if in_maintenance and service.status != "Maintenance":
        old_status = service.status
        service.status = "Maintenance"
        db.add(ServiceStatusEvent(
            service_id=service.id,
            previous_status=old_status,
            new_status="Maintenance",
            reason="Service entered scheduled maintenance window."
        ))
        db.commit()

    if service.status == "Maintenance":
        # Suppress incident creation during maintenance
        await manager.broadcast({
            "type": "HEALTH_CHECK_COMPLETED",
            "service_id": service.id,
            "service_name": service.name,
            "status": service.status,
            "response_time_ms": health_check.response_time_ms,
            "http_status_code": health_check.http_status_code,
            "checked_at": health_check.checked_at.isoformat()
        })
        return

    # 3. Retrieve recent consecutive checks
    recent_checks = db.query(HealthCheck).filter(
        HealthCheck.service_id == service.id
    ).order_by(desc(HealthCheck.checked_at)).limit(max(service.failure_threshold, service.recovery_threshold) + 2).all()

    consecutive_failures = 0
    consecutive_successes = 0

    for chk in recent_checks:
        if chk.status == "Down":
            if consecutive_successes == 0:
                consecutive_failures += 1
            else:
                break
        else:
            if consecutive_failures == 0:
                consecutive_successes += 1
            else:
                break

    # 4. Check for active open incident
    active_incident = db.query(Incident).filter(
        Incident.service_id == service.id,
        Incident.status != "Resolved"
    ).order_by(desc(Incident.detected_at)).first()

    old_status = service.status
    new_status = old_status

    # 5. Evaluate Down / Degraded status & Incident Creation
    if consecutive_failures >= service.failure_threshold:
        new_status = "Down"
        if not active_incident:
            # Create a new incident!
            inc_number = f"INC-{random.randint(1000, 9999)}"
            # Find an admin or operator to assign
            admin = db.query(User).filter(User.role.in_(["Admin", "Operator"])).first()

            severity = "Critical" if "Connection refused" in (check_result.get("error_message") or "") or check_result.get("http_status_code") == 503 else "High"

            new_incident = Incident(
                incident_number=inc_number,
                service_id=service.id,
                title=f"Service Outage: {service.name} is Unresponsive",
                description=check_result.get("error_message") or f"Service failed {consecutive_failures} consecutive health checks.",
                severity=severity,
                status="Detected",
                detected_at=utc_now(),
                assigned_user_id=admin.id if admin else None
            )
            db.add(new_incident)
            db.commit()
            db.refresh(new_incident)

            # Log incident event
            event = IncidentEvent(
                incident_id=new_incident.id,
                event_type="Detected",
                message=f"Incident automatically created after {consecutive_failures} consecutive failed health checks. Status Code: {check_result.get('http_status_code')}"
            )
            db.add(event)

            # Notification
            notif = Notification(
                service_id=service.id,
                incident_id=new_incident.id,
                notification_type="service_down",
                title=f"Incident Alert: {service.name} is Down",
                message=f"{service.name} has experienced a critical outage. Reason: {check_result.get('error_message') or 'Check failed'}"
            )
            db.add(notif)
            db.commit()

            logger.warning(f"New Incident {new_incident.incident_number} triggered for service {service.name}")
            
            await manager.broadcast({
                "type": "INCIDENT_CREATED",
                "incident_id": new_incident.id,
                "incident_number": new_incident.incident_number,
                "service_id": service.id,
                "service_name": service.name,
                "title": new_incident.title,
                "severity": new_incident.severity,
                "status": new_incident.status,
                "detected_at": new_incident.detected_at.isoformat()
            })

    elif consecutive_failures > 0:
        # 1 or 2 failures: warn/degrade
        if service.status == "Operational":
            new_status = "Degraded"
    else:
        # Consecutive successes
        if active_incident and consecutive_successes >= service.recovery_threshold:
            # Service has recovered!
            new_status = "Operational"
            active_incident.status = "Resolved"
            active_incident.resolved_at = utc_now()
            duration = int((ensure_utc(active_incident.resolved_at) - ensure_utc(active_incident.detected_at)).total_seconds())
            active_incident.duration_seconds = duration
            active_incident.resolution_notes = f"Service recovered after {consecutive_successes} consecutive healthy checks. Latency: {check_result['response_time_ms']}ms."
            
            event = IncidentEvent(
                incident_id=active_incident.id,
                event_type="Resolved",
                message=f"Service automatically recovered. Health check latency normal ({check_result['response_time_ms']}ms)."
            )
            db.add(event)

            notif = Notification(
                service_id=service.id,
                incident_id=active_incident.id,
                notification_type="service_recovered",
                title=f"Service Recovered: {service.name}",
                message=f"{service.name} has recovered and is now operational."
            )
            db.add(notif)
            db.commit()

            await manager.broadcast({
                "type": "INCIDENT_RESOLVED",
                "incident_id": active_incident.id,
                "incident_number": active_incident.incident_number,
                "service_id": service.id,
                "service_name": service.name,
                "duration_seconds": duration,
                "resolved_at": active_incident.resolved_at.isoformat()
            })

        elif check_result["status"] == "Degraded":
            new_status = "Degraded"
        else:
            if not active_incident:
                new_status = "Operational"

    # 6. Record Status Change Event if status changed
    if new_status != old_status:
        service.status = new_status
        status_event = ServiceStatusEvent(
            service_id=service.id,
            previous_status=old_status,
            new_status=new_status,
            reason=check_result.get("error_message") or f"Service transitioned from {old_status} to {new_status}"
        )
        db.add(status_event)
        db.commit()

        await manager.broadcast({
            "type": "SERVICE_STATUS_CHANGED",
            "service_id": service.id,
            "service_name": service.name,
            "previous_status": old_status,
            "new_status": new_status,
            "timestamp": utc_now().isoformat()
        })

    # 7. Broadcast completed health check
    await manager.broadcast({
        "type": "HEALTH_CHECK_COMPLETED",
        "service_id": service.id,
        "service_name": service.name,
        "status": service.status,
        "response_time_ms": health_check.response_time_ms,
        "http_status_code": health_check.http_status_code,
        "checked_at": health_check.checked_at.isoformat()
    })
