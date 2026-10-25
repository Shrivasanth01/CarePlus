from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "Viewer"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

# Service Group Schemas
class ServiceGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class ServiceGroupCreate(ServiceGroupBase):
    pass

class ServiceGroupResponse(ServiceGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime
    services_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

class ServiceGroupHealth(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    total_services: int
    operational: int
    degraded: int
    down: int
    uptime_percentage: float
    active_incidents: int

# Service Schemas
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    category: str = "REST API"
    environment: str = "Production"
    monitoring_type: str = "HTTP"  # HTTP, HTTPS, Simulated
    monitoring_enabled: bool = True
    monitoring_interval: int = 15
    timeout_seconds: int = 5
    expected_status_code: int = 200
    warning_threshold_ms: int = 300
    critical_threshold_ms: int = 800
    failure_threshold: int = 3
    recovery_threshold: int = 2
    group_id: Optional[int] = None
    owner_id: Optional[int] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    environment: Optional[str] = None
    monitoring_type: Optional[str] = None
    monitoring_enabled: Optional[bool] = None
    monitoring_interval: Optional[int] = None
    timeout_seconds: Optional[int] = None
    expected_status_code: Optional[int] = None
    warning_threshold_ms: Optional[int] = None
    critical_threshold_ms: Optional[int] = None
    failure_threshold: Optional[int] = None
    recovery_threshold: Optional[int] = None
    group_id: Optional[int] = None
    owner_id: Optional[int] = None
    status: Optional[str] = None

class HealthCheckResponse(BaseModel):
    id: int
    service_id: int
    check_type: str
    status: str
    response_time_ms: float
    http_status_code: Optional[int] = None
    error_message: Optional[str] = None
    checked_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncidentEventResponse(BaseModel):
    id: int
    incident_id: int
    event_type: str
    message: str
    user_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncidentResponse(BaseModel):
    id: int
    incident_number: str
    service_id: int
    service_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    detected_at: datetime
    acknowledged_at: Optional[datetime] = None
    recovery_started_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    resolution_notes: Optional[str] = None
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    events: Optional[List[IncidentEventResponse]] = []
    model_config = ConfigDict(from_attributes=True)

class ServiceResponse(ServiceBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    group_name: Optional[str] = None
    owner_name: Optional[str] = None
    current_response_time_ms: Optional[float] = None
    uptime_percentage_24h: Optional[float] = 100.0
    last_checked_at: Optional[datetime] = None
    active_incident_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

class ServiceMetricsResponse(BaseModel):
    service_id: int
    service_name: str
    current_response_time_ms: float
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    uptime_percentage: float
    total_checks: int
    successful_checks: int
    failed_checks: int
    total_downtime_minutes: float
    incident_count: int
    period: str

# Incident Request Schemas
class IncidentCreate(BaseModel):
    service_id: int
    title: str
    description: Optional[str] = None
    severity: str = "Critical"

class IncidentStatusUpdate(BaseModel):
    status: str  # Detected, Investigating, Identified, Monitoring Recovery, Resolved
    message: Optional[str] = None
    notes: Optional[str] = None

class IncidentResolve(BaseModel):
    resolution_notes: str

# Maintenance Window Schemas
class MaintenanceWindowBase(BaseModel):
    service_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime

class MaintenanceWindowCreate(MaintenanceWindowBase):
    pass

class MaintenanceWindowUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None

class MaintenanceWindowResponse(MaintenanceWindowBase):
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    service_name: Optional[str] = "All Services"
    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    service_id: Optional[int] = None
    incident_id: Optional[int] = None
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Monitoring Settings Schemas
class MonitoringSettingsBase(BaseModel):
    monitoring_interval: int = 15
    timeout_seconds: int = 5
    retry_count: int = 2
    failure_threshold: int = 3
    recovery_threshold: int = 2
    warning_threshold_ms: int = 300
    critical_threshold_ms: int = 800

class MonitoringSettingsUpdate(BaseModel):
    monitoring_interval: Optional[int] = None
    timeout_seconds: Optional[int] = None
    retry_count: Optional[int] = None
    failure_threshold: Optional[int] = None
    recovery_threshold: Optional[int] = None
    warning_threshold_ms: Optional[int] = None
    critical_threshold_ms: Optional[int] = None

class MonitoringSettingsResponse(MonitoringSettingsBase):
    id: int
    service_id: Optional[int] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Dashboard Overview Schemas
class DashboardSummaryCards(BaseModel):
    total_services: int
    operational_services: int
    degraded_services: int
    down_services: int
    overall_uptime_percentage: float
    active_incidents: int
    avg_response_time_ms: float
    monitoring_coverage_percentage: float

class StatusTimelinePoint(BaseModel):
    timestamp: str
    operational: int
    degraded: int
    down: int

class LatencyChartPoint(BaseModel):
    time: str
    avg_latency: float
    p95_latency: float

class DashboardOverviewResponse(BaseModel):
    summary: DashboardSummaryCards
    status_distribution: Dict[str, int]
    recent_checks: List[HealthCheckResponse]
    active_incidents: List[IncidentResponse]
    latency_trend: List[LatencyChartPoint]
    uptime_trend: List[Dict[str, Any]]
