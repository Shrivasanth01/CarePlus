from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import ServiceGroup, Service, Incident, HealthCheck, AuditLog, User
from app.schemas.all_schemas import ServiceGroupCreate, ServiceGroupResponse, ServiceGroupHealth, ServiceResponse
from app.monitoring.uptime_calculator import calculate_service_uptime
from app.api.dependencies import get_current_user_optional

router = APIRouter(prefix="/service-groups", tags=["Service Groups"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("", response_model=List[ServiceGroupHealth])
def get_service_groups(db: Session = Depends(get_db)):
    groups = db.query(ServiceGroup).all()
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)
    results = []

    for g in groups:
        services = db.query(Service).filter(Service.group_id == g.id).all()
        total = len(services)
        operational = sum(1 for s in services if s.status == "Operational")
        degraded = sum(1 for s in services if s.status == "Degraded")
        down = sum(1 for s in services if s.status == "Down")

        service_ids = [s.id for s in services]
        active_incidents = db.query(Incident).filter(
            Incident.service_id.in_(service_ids),
            Incident.status != "Resolved"
        ).count() if service_ids else 0

        # Average group uptime
        if services:
            uptimes = [calculate_service_uptime(db, s.id, twenty_four_hours_ago, utc_now(), method="check")["uptime_percentage"] for s in services]
            avg_uptime = round(sum(uptimes) / len(uptimes), 2)
        else:
            avg_uptime = 100.0

        results.append(ServiceGroupHealth(
            id=g.id,
            name=g.name,
            description=g.description,
            total_services=total,
            operational=operational,
            degraded=degraded,
            down=down,
            uptime_percentage=avg_uptime,
            active_incidents=active_incidents
        ))

    return results

@router.post("", response_model=ServiceGroupResponse, status_code=status.HTTP_201_CREATED)
def create_service_group(
    group_in: ServiceGroupCreate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    existing = db.query(ServiceGroup).filter(ServiceGroup.name == group_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service group with this name already exists")

    new_group = ServiceGroup(name=group_in.name, description=group_in.description)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="GROUP_CREATED",
        entity_type="ServiceGroup",
        entity_id=str(new_group.id),
        details=f"Created service group '{new_group.name}'"
    ))
    db.commit()

    return ServiceGroupResponse.model_validate(new_group)

@router.get("/{group_id}/services", response_model=List[ServiceResponse])
def get_services_by_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(ServiceGroup).filter(ServiceGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Service group not found")

    services = db.query(Service).filter(Service.group_id == group_id).all()
    results = []
    twenty_four_hours_ago = utc_now() - timedelta(hours=24)

    for s in services:
        latest_chk = db.query(HealthCheck).filter(HealthCheck.service_id == s.id).order_by(HealthCheck.checked_at.desc()).first()
        active_incidents = db.query(Incident).filter(Incident.service_id == s.id, Incident.status != "Resolved").count()
        uptime_data = calculate_service_uptime(db, s.id, twenty_four_hours_ago, utc_now(), method="check")

        res = ServiceResponse.model_validate(s)
        res.group_name = group.name
        res.current_response_time_ms = latest_chk.response_time_ms if latest_chk else None
        res.uptime_percentage_24h = uptime_data["uptime_percentage"]
        res.last_checked_at = latest_chk.checked_at if latest_chk else None
        res.active_incident_count = active_incidents
        results.append(res)

    return results

@router.delete("/{group_id}")
def delete_service_group(
    group_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    group = db.query(ServiceGroup).filter(ServiceGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Service group not found")

    # Unlink services from group
    db.query(Service).filter(Service.group_id == group_id).update({"group_id": None})
    group_name = group.name
    db.delete(group)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="GROUP_DELETED",
        entity_type="ServiceGroup",
        entity_id=str(group_id),
        details=f"Deleted service group '{group_name}'"
    ))
    db.commit()

    return {"message": f"Service group '{group_name}' deleted"}
