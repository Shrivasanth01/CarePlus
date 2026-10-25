from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import MonitoringSettings, Service, HealthCheck, AuditLog, User
from app.schemas.all_schemas import MonitoringSettingsResponse, MonitoringSettingsUpdate
from app.monitoring.scheduler import scheduler
from app.api.dependencies import get_current_user_optional
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/monitoring", tags=["Monitoring Configuration"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/settings", response_model=MonitoringSettingsResponse)
def get_monitoring_settings(db: Session = Depends(get_db)):
    settings_obj = db.query(MonitoringSettings).filter(MonitoringSettings.service_id.is_(None)).first()
    if not settings_obj:
        # Create global default settings row if missing
        settings_obj = MonitoringSettings(
            service_id=None,
            monitoring_interval=15,
            timeout_seconds=5,
            retry_count=2,
            failure_threshold=3,
            recovery_threshold=2,
            warning_threshold_ms=300,
            critical_threshold_ms=800
        )
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

@router.put("/settings", response_model=MonitoringSettingsResponse)
def update_monitoring_settings(
    update_data: MonitoringSettingsUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    settings_obj = db.query(MonitoringSettings).filter(MonitoringSettings.service_id.is_(None)).first()
    if not settings_obj:
        settings_obj = MonitoringSettings(service_id=None)
        db.add(settings_obj)

    for field, val in update_data.model_dump(exclude_unset=True).items():
        setattr(settings_obj, field, val)

    settings_obj.updated_at = utc_now()
    db.commit()
    db.refresh(settings_obj)

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        action="MONITORING_SETTINGS_UPDATED",
        entity_type="MonitoringSettings",
        entity_id="global",
        details="Global monitoring thresholds and intervals updated"
    ))
    db.commit()

    return settings_obj

@router.post("/start")
async def start_monitoring():
    await scheduler.start()
    return {"message": "Background monitoring scheduler started", "is_running": scheduler.is_running}

@router.post("/stop")
async def stop_monitoring():
    await scheduler.stop()
    return {"message": "Background monitoring scheduler stopped", "is_running": scheduler.is_running}

@router.get("/status")
def get_monitoring_status(db: Session = Depends(get_db)):
    total_checks = db.query(HealthCheck).count()
    enabled_services = db.query(Service).filter(Service.monitoring_enabled == True).count()
    total_services = db.query(Service).count()

    return {
        "scheduler_running": scheduler.is_running,
        "websocket_active_clients": len(manager.active_connections),
        "total_checks_recorded": total_checks,
        "enabled_services_count": enabled_services,
        "total_services_count": total_services
    }
