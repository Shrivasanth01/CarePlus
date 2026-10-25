import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.all_models import AuditLog, User
from app.schemas.all_schemas import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 50,
    page: int = 1,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    results = []
    for log in logs:
        results.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=log.user.name if log.user else "System / Anonymous",
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at
        ))
    return results

@router.get("/export")
def export_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(1000).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details"])
    for l in logs:
        writer.writerow([
            l.id,
            l.created_at.isoformat(),
            l.user.name if l.user else "System",
            l.action,
            l.entity_type,
            l.entity_id,
            l.details
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=careplus_audit_logs.csv"}
    )
