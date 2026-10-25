from fastapi import APIRouter
from app.api.routes import (
    auth, dashboard, services, service_groups,
    incidents, uptime, analytics, monitoring,
    notifications, maintenance, audit_logs, demo
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(services.router)
api_router.include_router(service_groups.router)
api_router.include_router(incidents.router)
api_router.include_router(uptime.router)
api_router.include_router(analytics.router)
api_router.include_router(monitoring.router)
api_router.include_router(notifications.router)
api_router.include_router(maintenance.router)
api_router.include_router(audit_logs.router)
api_router.include_router(demo.router)
