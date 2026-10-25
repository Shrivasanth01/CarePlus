from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, asc
from app.database.connection import get_db
from app.models.all_models import (
    Service, ServiceGroup, HealthCheck, Incident,
    MaintenanceWindow, User, AuditLog, ServiceStatusEvent
)
from app.schemas.all_schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ServiceMetricsResponse, HealthCheckResponse
)
from app.monitoring.health_checker import execute_health_check
from app.monitoring.incident_detector import process_check_result
from app.monitoring.uptime_calculator import calculate_service_uptime, calculate_latency_percentiles
from app.api.dependencies import get_current_user_optional, require_role, get_current_user
from app.utils.ssrf import validate_url_for_ssrf
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/services", tags=["Services"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("", response_model=List[ServiceResponse])
def get_services(
    search: Optional[str] = None,
    category: Optional[str] = None,
    environment: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    group_id: Optional[int] = None,
    sort_by: str = "name",
    order: str = "asc",
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Service)

    if search:
        search_filter = f"%{search}%"
        query = query.filter((Service.name.ilike(search_filter)) | (Service.url.ilike(search_filter)))

    if category:
        query = query.filter(Service.category == category)

    if environment:
        query = query.filter(Service.environment == environment)

    if status_filter:
        query = query.filter(Service.status == status_filter)

    if group_id:
        query = query.filter(Service.group_id == group_id)

    # Sorting
    sort_column = getattr(Service, sort_by, Service.name)
    if order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    services = query.offset((page - 1) * limit).limit(limit).all()

    # Enrich each service with latest metrics
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)
    results = []

    for s in services:
        latest_chk = db.query(HealthCheck).filter(HealthCheck.service_id == s.id).order_by(desc(HealthCheck.checked_at)).first()
        active_incidents = db.query(Incident).filter(Incident.service_id == s.id, Incident.status != "Resolved").count()
        
        # 24h uptime
        uptime_data = calculate_service_uptime(db, s.id, twenty_four_hours_ago, utc_now(), method="check")

        results.append(ServiceResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            url=s.url,
            category=s.category,
            environment=s.environment,
            monitoring_type=s.monitoring_type,
            status=s.status,
            monitoring_enabled=s.monitoring_enabled,
            monitoring_interval=s.monitoring_interval,
            timeout_seconds=s.timeout_seconds,
            expected_status_code=s.expected_status_code,
            warning_threshold_ms=s.warning_threshold_ms,
            critical_threshold_ms=s.critical_threshold_ms,
            failure_threshold=s.failure_threshold,
            recovery_threshold=s.recovery_threshold,
            group_id=s.group_id,
            owner_id=s.owner_id,
            created_at=s.created_at,
            updated_at=s.updated_at,
            group_name=s.group.name if s.group else None,
            owner_name=s.owner.name if s.owner else None,
            current_response_time_ms=latest_chk.response_time_ms if latest_chk else None,
            uptime_percentage_24h=uptime_data["uptime_percentage"],
            last_checked_at=latest_chk.checked_at if latest_chk else None,
            active_incident_count=active_incidents
        ))

    return results

@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Validate SSRF
    if service_in.monitoring_type != "Simulated":
        is_valid, err = validate_url_for_ssrf(service_in.url)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid URL for monitoring: {err}")

    new_service = Service(
        name=service_in.name,
        description=service_in.description,
        url=service_in.url,
        category=service_in.category,
        environment=service_in.environment,
        monitoring_type=service_in.monitoring_type,
        status="Unknown",
        monitoring_enabled=service_in.monitoring_enabled,
        monitoring_interval=service_in.monitoring_interval,
        timeout_seconds=service_in.timeout_seconds,
        expected_status_code=service_in.expected_status_code,
        warning_threshold_ms=service_in.warning_threshold_ms,
        critical_threshold_ms=service_in.critical_threshold_ms,
        failure_threshold=service_in.failure_threshold,
        recovery_threshold=service_in.recovery_threshold,
        group_id=service_in.group_id,
        owner_id=service_in.owner_id or (current_user.id if current_user else None)
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="SERVICE_CREATED",
        entity_type="Service",
        entity_id=str(new_service.id),
        details=f"Service '{new_service.name}' registered for {new_service.monitoring_type} monitoring."
    ))
    db.commit()

    return ServiceResponse.model_validate(new_service)

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_details(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    latest_chk = db.query(HealthCheck).filter(HealthCheck.service_id == service.id).order_by(desc(HealthCheck.checked_at)).first()
    active_incidents = db.query(Incident).filter(Incident.service_id == service.id, Incident.status != "Resolved").count()
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)
    uptime_data = calculate_service_uptime(db, service.id, twenty_four_hours_ago, utc_now(), method="check")

    res = ServiceResponse.model_validate(service)
    res.group_name = service.group.name if service.group else None
    res.owner_name = service.owner.name if service.owner else None
    res.current_response_time_ms = latest_chk.response_time_ms if latest_chk else None
    res.uptime_percentage_24h = uptime_data["uptime_percentage"]
    res.last_checked_at = latest_chk.checked_at if latest_chk else None
    res.active_incident_count = active_incidents
    return res

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = service_in.model_dump(exclude_unset=True)
    if "url" in update_data and service.monitoring_type != "Simulated":
        is_valid, err = validate_url_for_ssrf(update_data["url"])
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {err}")

    for key, value in update_data.items():
        setattr(service, key, value)

    service.updated_at = utc_now()
    db.commit()
    db.refresh(service)

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="SERVICE_UPDATED",
        entity_type="Service",
        entity_id=str(service.id),
        details=f"Updated settings for service '{service.name}'"
    ))
    db.commit()

    return ServiceResponse.model_validate(service)

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service_name = service.name
    db.delete(service)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="SERVICE_DELETED",
        entity_type="Service",
        entity_id=str(service_id),
        details=f"Deleted service '{service_name}'"
    ))
    db.commit()

    return {"message": f"Service '{service_name}' successfully deleted"}

@router.post("/{service_id}/check")
async def trigger_manual_health_check(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    result = await execute_health_check(
        service_id=service.id,
        url=service.url,
        monitoring_type=service.monitoring_type,
        timeout_seconds=service.timeout_seconds,
        expected_status_code=service.expected_status_code,
        warning_threshold_ms=service.warning_threshold_ms,
        critical_threshold_ms=service.critical_threshold_ms,
        current_status=service.status
    )

    await process_check_result(db, service, result)

    return {
        "service_id": service.id,
        "service_name": service.name,
        "status": service.status,
        "result": result
    }

@router.post("/{service_id}/enable")
def enable_service_monitoring(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.monitoring_enabled = True
    db.commit()
    return {"message": f"Monitoring enabled for service '{service.name}'", "enabled": True}

@router.post("/{service_id}/disable")
def disable_service_monitoring(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.monitoring_enabled = False
    db.commit()
    return {"message": f"Monitoring disabled for service '{service.name}'", "enabled": False}

@router.post("/{service_id}/maintenance")
def toggle_maintenance(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    old_status = service.status
    if service.status == "Maintenance":
        service.status = "Operational"
        reason = "Maintenance ended manually."
    else:
        service.status = "Maintenance"
        reason = "Manual maintenance initiated."

    db.add(ServiceStatusEvent(
        service_id=service.id,
        previous_status=old_status,
        new_status=service.status,
        reason=reason
    ))
    db.commit()

    return {"service_id": service.id, "status": service.status, "message": reason}

@router.get("/{service_id}/metrics", response_model=ServiceMetricsResponse)
def get_service_metrics(
    service_id: int,
    period: str = "24h",  # 1h, 6h, 24h, 7d, 30d
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    now = utc_now()
    if period == "1h":
        start_time = now - timedelta(hours=1)
    elif period == "6h":
        start_time = now - timedelta(hours=6)
    elif period == "7d":
        start_time = now - timedelta(days=7)
    elif period == "30d":
        start_time = now - timedelta(days=30)
    else: # default 24h
        start_time = now - timedelta(hours=24)

    uptime_calc = calculate_service_uptime(db, service_id, start_time, now, method="interval")
    
    checks = db.query(HealthCheck).filter(
        HealthCheck.service_id == service_id,
        HealthCheck.checked_at >= start_time,
        HealthCheck.checked_at <= now
    ).order_by(HealthCheck.checked_at.asc()).all()

    latencies = [c.response_time_ms for c in checks if c.response_time_ms is not None and c.response_time_ms > 0]
    percentiles = calculate_latency_percentiles(latencies)

    latest_chk = checks[-1] if checks else None
    current_latency = latest_chk.response_time_ms if latest_chk else percentiles["avg"]

    incident_count = db.query(Incident).filter(
        Incident.service_id == service_id,
        Incident.detected_at >= start_time
    ).count()

    return ServiceMetricsResponse(
        service_id=service.id,
        service_name=service.name,
        current_response_time_ms=current_latency,
        avg_response_time_ms=percentiles["avg"],
        min_response_time_ms=percentiles["min"],
        max_response_time_ms=percentiles["max"],
        p95_response_time_ms=percentiles["p95"],
        p99_response_time_ms=percentiles["p99"],
        uptime_percentage=uptime_calc["uptime_percentage"],
        total_checks=uptime_calc["total_checks"],
        successful_checks=uptime_calc["successful_checks"],
        failed_checks=uptime_calc["failed_checks"],
        total_downtime_minutes=uptime_calc["total_downtime_minutes"],
        incident_count=incident_count,
        period=period
    )

@router.get("/{service_id}/history")
def get_service_history(
    service_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    checks = db.query(HealthCheck).filter(
        HealthCheck.service_id == service_id
    ).order_by(desc(HealthCheck.checked_at)).limit(limit).all()

    events = db.query(ServiceStatusEvent).filter(
        ServiceStatusEvent.service_id == service_id
    ).order_by(desc(ServiceStatusEvent.created_at)).limit(limit).all()

    return {
        "service_id": service.id,
        "service_name": service.name,
        "checks": [HealthCheckResponse.model_validate(c) for c in checks],
        "status_events": [
            {
                "id": ev.id,
                "previous_status": ev.previous_status,
                "new_status": ev.new_status,
                "reason": ev.reason,
                "created_at": ev.created_at
            }
            for ev in events
        ]
    }
