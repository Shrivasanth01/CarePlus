from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.all_models import MaintenanceWindow, Service, AuditLog, User
from app.schemas.all_schemas import (
    MaintenanceWindowCreate, MaintenanceWindowUpdate, MaintenanceWindowResponse
)
from app.api.dependencies import get_current_user_optional

router = APIRouter(prefix="/maintenance", tags=["Maintenance Windows"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("", response_model=List[MaintenanceWindowResponse])
def get_maintenance_windows(db: Session = Depends(get_db)):
    windows = db.query(MaintenanceWindow).order_by(desc(MaintenanceWindow.start_time)).all()
    results = []
    for w in windows:
        results.append(MaintenanceWindowResponse(
            id=w.id,
            service_id=w.service_id,
            service_name=w.service.name if w.service else "All Services",
            title=w.title,
            description=w.description,
            start_time=w.start_time,
            end_time=w.end_time,
            status=w.status,
            created_by=w.created_by,
            created_at=w.created_at
        ))
    return results

@router.post("", response_model=MaintenanceWindowResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_window(
    mw_in: MaintenanceWindowCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if mw_in.end_time <= mw_in.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    now = utc_now()
    initial_status = "In Progress" if mw_in.start_time <= now <= mw_in.end_time else "Scheduled"

    new_mw = MaintenanceWindow(
        service_id=mw_in.service_id,
        title=mw_in.title,
        description=mw_in.description,
        start_time=mw_in.start_time,
        end_time=mw_in.end_time,
        status=initial_status,
        created_by=current_user.id if current_user else None
    )
    db.add(new_mw)
    db.commit()
    db.refresh(new_mw)

    if mw_in.service_id and initial_status == "In Progress":
        svc = db.query(Service).filter(Service.id == mw_in.service_id).first()
        if svc:
            svc.status = "Maintenance"
            db.commit()

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="MAINTENANCE_SCHEDULED",
        entity_type="MaintenanceWindow",
        entity_id=str(new_mw.id),
        details=f"Maintenance window '{new_mw.title}' created ({new_mw.start_time} - {new_mw.end_time})"
    ))
    db.commit()

    return MaintenanceWindowResponse(
        id=new_mw.id,
        service_id=new_mw.service_id,
        service_name=new_mw.service.name if new_mw.service else "All Services",
        title=new_mw.title,
        description=new_mw.description,
        start_time=new_mw.start_time,
        end_time=new_mw.end_time,
        status=new_mw.status,
        created_by=new_mw.created_by,
        created_at=new_mw.created_at
    )

@router.put("/{maintenance_id}", response_model=MaintenanceWindowResponse)
def update_maintenance_window(
    maintenance_id: int,
    mw_update: MaintenanceWindowUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    mw = db.query(MaintenanceWindow).filter(MaintenanceWindow.id == maintenance_id).first()
    if not mw:
        raise HTTPException(status_code=404, detail="Maintenance window not found")

    for field, val in mw_update.model_dump(exclude_unset=True).items():
        setattr(mw, field, val)

    db.commit()
    db.refresh(mw)

    return MaintenanceWindowResponse(
        id=mw.id,
        service_id=mw.service_id,
        service_name=mw.service.name if mw.service else "All Services",
        title=mw.title,
        description=mw.description,
        start_time=mw.start_time,
        end_time=mw.end_time,
        status=mw.status,
        created_by=mw.created_by,
        created_at=mw.created_at
    )

@router.delete("/{maintenance_id}")
def delete_maintenance_window(
    maintenance_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    mw = db.query(MaintenanceWindow).filter(MaintenanceWindow.id == maintenance_id).first()
    if not mw:
        raise HTTPException(status_code=404, detail="Maintenance window not found")

    # If service was in maintenance, return to operational
    if mw.service_id and mw.status in ["In Progress", "Scheduled"]:
        svc = db.query(Service).filter(Service.id == mw.service_id).first()
        if svc and svc.status == "Maintenance":
            svc.status = "Operational"

    title = mw.title
    db.delete(mw)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="MAINTENANCE_CANCELLED",
        entity_type="MaintenanceWindow",
        entity_id=str(maintenance_id),
        details=f"Cancelled maintenance window '{title}'"
    ))
    db.commit()

    return {"message": f"Maintenance window '{title}' deleted/cancelled"}
