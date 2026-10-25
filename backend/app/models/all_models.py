from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.database.connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Viewer")  # Admin, Operator, Viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    services_owned = relationship("Service", back_populates="owner")
    incidents_assigned = relationship("Incident", back_populates="assigned_user")
    audit_logs = relationship("AuditLog", back_populates="user")


class ServiceGroup(Base):
    __tablename__ = "service_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    services = relationship("Service", back_populates="group")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False, default="REST API")
    environment = Column(String(50), nullable=False, default="Production")
    monitoring_type = Column(String(50), nullable=False, default="HTTP")  # HTTP, HTTPS, Simulated
    status = Column(String(50), nullable=False, default="Unknown")  # Operational, Degraded, Down, Unknown, Maintenance
    monitoring_enabled = Column(Boolean, default=True)
    monitoring_interval = Column(Integer, default=15)  # in seconds
    timeout_seconds = Column(Integer, default=5)
    expected_status_code = Column(Integer, default=200)
    warning_threshold_ms = Column(Integer, default=300)
    critical_threshold_ms = Column(Integer, default=800)
    failure_threshold = Column(Integer, default=3)
    recovery_threshold = Column(Integer, default=2)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("service_groups.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    owner = relationship("User", back_populates="services_owned")
    group = relationship("ServiceGroup", back_populates="services")
    health_checks = relationship("HealthCheck", back_populates="service", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="service", cascade="all, delete-orphan")
    maintenance_windows = relationship("MaintenanceWindow", back_populates="service", cascade="all, delete-orphan")
    status_events = relationship("ServiceStatusEvent", back_populates="service", cascade="all, delete-orphan")


class HealthCheck(Base):
    __tablename__ = "health_checks"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    check_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)  # Healthy, Degraded, Down
    response_time_ms = Column(Float, nullable=False)
    http_status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=utc_now, index=True)

    service = relationship("Service", back_populates="health_checks")

Index("ix_health_checks_service_checked_at", HealthCheck.service_id, HealthCheck.checked_at.desc())


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, index=True, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=False, default="Critical")  # Critical, High, Medium, Low
    status = Column(String(50), nullable=False, default="Detected")  # Detected, Investigating, Identified, Monitoring Recovery, Resolved
    detected_at = Column(DateTime, default=utc_now, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    recovery_started_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    service = relationship("Service", back_populates="incidents")
    assigned_user = relationship("User", back_populates="incidents_assigned")
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    incident = relationship("Incident", back_populates="events")


class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="Scheduled")  # Scheduled, In Progress, Completed, Cancelled
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    service = relationship("Service", back_populates="maintenance_windows")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)
    notification_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, index=True)


class MonitoringSettings(Base):
    __tablename__ = "monitoring_settings"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=True, unique=True)
    monitoring_interval = Column(Integer, default=15)
    timeout_seconds = Column(Integer, default=5)
    retry_count = Column(Integer, default=2)
    failure_threshold = Column(Integer, default=3)
    recovery_threshold = Column(Integer, default=2)
    warning_threshold_ms = Column(Integer, default=300)
    critical_threshold_ms = Column(Integer, default=800)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="audit_logs")


class ServiceStatusEvent(Base):
    __tablename__ = "service_status_events"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    service = relationship("Service", back_populates="status_events")
