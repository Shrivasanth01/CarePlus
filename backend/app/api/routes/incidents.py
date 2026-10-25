from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.all_models import Incident, IncidentEvent, Service, User, AuditLog, Notification
from app.schemas.all_schemas import (
    IncidentResponse, IncidentEventResponse, IncidentStatusUpdate,
    IncidentResolve, IncidentCreate
)
from app.api.dependencies import get_current_user_optional, get_current_user
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    service_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    page: int = 1,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if status_filter:
        if status_filter.lower() == "active":
            query = query.filter(Incident.status != "Resolved")
        else:
            query = query.filter(Incident.status == status_filter)

    if severity:
        query = query.filter(Incident.severity == severity)

    if service_id:
        query = query.filter(Incident.service_id == service_id)

    if search:
        search_f = f"%{search}%"
        query = query.filter((Incident.title.ilike(search_f)) | (Incident.incident_number.ilike(search_f)))

    incidents = query.order_by(desc(Incident.detected_at)).offset((page - 1) * limit).limit(limit).all()

    results = []
    for inc in incidents:
        events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).order_by(IncidentEvent.created_at.asc()).all()
        results.append(IncidentResponse(
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
            events=[IncidentEventResponse.model_validate(e) for e in events]
        ))

    return results

@router.get("/history", response_model=List[IncidentResponse])
def get_incident_history(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    incidents = db.query(Incident).filter(Incident.status == "Resolved").order_by(desc(Incident.resolved_at)).limit(limit).all()
    results = []
    for inc in incidents:
        events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).order_by(IncidentEvent.created_at.asc()).all()
        results.append(IncidentResponse(
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
            events=[IncidentEventResponse.model_validate(e) for e in events]
        ))
    return results

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).order_by(IncidentEvent.created_at.asc()).all()
    return IncidentResponse(
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
        events=[IncidentEventResponse.model_validate(e) for e in events]
    )

@router.post("/{incident_id}/acknowledge")
async def acknowledge_incident(
    incident_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = utc_now()
    inc.acknowledged_at = now
    inc.status = "Investigating"
    if current_user and not inc.assigned_user_id:
        inc.assigned_user_id = current_user.id

    db.add(IncidentEvent(
        incident_id=inc.id,
        event_type="Acknowledged",
        message=f"Incident acknowledged by {current_user.name if current_user else 'Operator'}. Status changed to Investigating.",
        user_id=current_user.id if current_user else None
    ))
    db.commit()

    await manager.broadcast({
        "type": "INCIDENT_UPDATED",
        "incident_id": inc.id,
        "incident_number": inc.incident_number,
        "status": inc.status,
        "acknowledged_at": inc.acknowledged_at.isoformat()
    })

    return {"message": "Incident acknowledged", "status": inc.status}

@router.post("/{incident_id}/update-status")
async def update_incident_status(
    incident_id: int,
    req: IncidentStatusUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = req.status
    if req.status == "Monitoring Recovery" and not inc.recovery_started_at:
        inc.recovery_started_at = utc_now()

    db.add(IncidentEvent(
        incident_id=inc.id,
        event_type=req.status,
        message=req.message or f"Status transitioned to {req.status} by {current_user.name if current_user else 'Operator'}.",
        user_id=current_user.id if current_user else None
    ))
    db.commit()

    await manager.broadcast({
        "type": "INCIDENT_UPDATED",
        "incident_id": inc.id,
        "incident_number": inc.incident_number,
        "status": inc.status
    })

    return {"message": f"Incident updated to {req.status}", "status": inc.status}

@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: int,
    req: IncidentResolve,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = utc_now()
    inc.status = "Resolved"
    inc.resolved_at = now
    detected = inc.detected_at.replace(tzinfo=timezone.utc) if inc.detected_at.tzinfo is None else inc.detected_at
    duration = int((now - detected).total_seconds())
    inc.duration_seconds = duration
    inc.resolution_notes = req.resolution_notes

    # Update service status back to operational if no other open incidents
    other_incidents = db.query(Incident).filter(
        Incident.service_id == inc.service_id,
        Incident.id != inc.id,
        Incident.status != "Resolved"
    ).count()

    if other_incidents == 0 and inc.service:
        inc.service.status = "Operational"

    db.add(IncidentEvent(
        incident_id=inc.id,
        event_type="Resolved",
        message=f"Incident resolved by {current_user.name if current_user else 'Operator'}. Notes: {req.resolution_notes}",
        user_id=current_user.id if current_user else None
    ))

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="INCIDENT_RESOLVED",
        entity_type="Incident",
        entity_id=inc.incident_number,
        details=f"Resolved incident {inc.incident_number} ({duration}s). Notes: {req.resolution_notes}"
    ))
    db.commit()

    await manager.broadcast({
        "type": "INCIDENT_RESOLVED",
        "incident_id": inc.id,
        "incident_number": inc.incident_number,
        "service_id": inc.service_id,
        "service_name": inc.service.name if inc.service else "",
        "duration_seconds": duration,
        "resolved_at": inc.resolved_at.isoformat()
    })

    return {"message": "Incident marked as resolved", "duration_seconds": duration}
