import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, Base, engine
from app.models.all_models import (
    User, ServiceGroup, Service, HealthCheck, Incident,
    IncidentEvent, MaintenanceWindow, Notification, MonitoringSettings, AuditLog
)
from app.core.security import get_password_hash
from app.core.logging import logger

def utc_now():
    return datetime.now(timezone.utc)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            logger.info("Database already seeded. Skipping initial seed.")
            return

        logger.info("Seeding initial database with sample data...")

        # 1. Users
        admin_user = User(
            name="Alexander Vance (Admin)",
            email="admin@careplus.com",
            password_hash=get_password_hash("admin123"),
            role="Admin",
            is_active=True
        )
        operator_user = User(
            name="Sarah Jenkins (Operator)",
            email="operator@careplus.com",
            password_hash=get_password_hash("operator123"),
            role="Operator",
            is_active=True
        )
        viewer_user = User(
            name="Michael Chen (Viewer)",
            email="viewer@careplus.com",
            password_hash=get_password_hash("viewer123"),
            role="Viewer",
            is_active=True
        )
        db.add_all([admin_user, operator_user, viewer_user])
        db.commit()

        # 2. Service Groups
        g_core = ServiceGroup(name="Core Infrastructure", description="Essential platform and networking backbones")
        g_pay = ServiceGroup(name="Payment & Billing", description="Payment gateways, invoices, and financial pipelines")
        g_auth = ServiceGroup(name="Identity & Access", description="Authentication, tokens, and authorization gateways")
        g_data = ServiceGroup(name="Data & Analytics", description="Reporting databases, warehouses, and metric pipelines")
        db.add_all([g_core, g_pay, g_auth, g_data])
        db.commit()

        # 3. Global Monitoring Settings
        global_settings = MonitoringSettings(
            service_id=None,
            monitoring_interval=15,
            timeout_seconds=5,
            retry_count=2,
            failure_threshold=3,
            recovery_threshold=2,
            warning_threshold_ms=300,
            critical_threshold_ms=800
        )
        db.add(global_settings)
        db.commit()

        # 4. 10 Sample Services
        sample_services = [
            {
                "name": "Main Website",
                "description": "Public customer-facing web portal and marketing pages",
                "url": "sim://main-website.careplus.io/health",
                "category": "Website",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 15,
                "timeout_seconds": 5,
                "expected_status_code": 200,
                "warning_threshold_ms": 250,
                "critical_threshold_ms": 600,
                "group_id": g_core.id,
                "owner_id": admin_user.id
            },
            {
                "name": "Authentication API",
                "description": "OAuth2 / JWT token generation and session validation engine",
                "url": "sim://auth.careplus.io/v1/status",
                "category": "Authentication Service",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 15,
                "timeout_seconds": 3,
                "expected_status_code": 200,
                "warning_threshold_ms": 150,
                "critical_threshold_ms": 400,
                "group_id": g_auth.id,
                "owner_id": admin_user.id
            },
            {
                "name": "Payment API",
                "description": "Stripe/PayPal payment processing gateway & webhook receiver",
                "url": "sim://payments.careplus.io/api/health",
                "category": "Payment Service",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Degraded",
                "monitoring_enabled": True,
                "monitoring_interval": 10,
                "timeout_seconds": 4,
                "expected_status_code": 200,
                "warning_threshold_ms": 200,
                "critical_threshold_ms": 500,
                "group_id": g_pay.id,
                "owner_id": operator_user.id
            },
            {
                "name": "User Management API",
                "description": "Core CRUD user registry and permissions microservice",
                "url": "sim://users.careplus.io/healthz",
                "category": "REST API",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 15,
                "timeout_seconds": 5,
                "expected_status_code": 200,
                "warning_threshold_ms": 300,
                "critical_threshold_ms": 700,
                "group_id": g_auth.id,
                "owner_id": admin_user.id
            },
            {
                "name": "Notification Service",
                "description": "Transactional emails, SMS, and in-app alert dispatcher",
                "url": "sim://notify.careplus.io/ping",
                "category": "Internal Service",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 20,
                "timeout_seconds": 5,
                "expected_status_code": 200,
                "warning_threshold_ms": 350,
                "critical_threshold_ms": 800,
                "group_id": g_core.id,
                "owner_id": operator_user.id
            },
            {
                "name": "Database Service",
                "description": "PostgreSQL Primary Cluster health and connection pool check",
                "url": "sim://db-primary.internal.careplus.io:5432/health",
                "category": "Database Service",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 10,
                "timeout_seconds": 3,
                "expected_status_code": 200,
                "warning_threshold_ms": 100,
                "critical_threshold_ms": 300,
                "group_id": g_data.id,
                "owner_id": admin_user.id
            },
            {
                "name": "File Storage Service",
                "description": "S3-compatible object store and asset distribution endpoint",
                "url": "sim://storage.careplus.io/minio/health/live",
                "category": "Backend Service",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 30,
                "timeout_seconds": 6,
                "expected_status_code": 200,
                "warning_threshold_ms": 400,
                "critical_threshold_ms": 1000,
                "group_id": g_core.id,
                "owner_id": operator_user.id
            },
            {
                "name": "Analytics Service",
                "description": "Clickstream and event aggregation reporting engine",
                "url": "sim://analytics.careplus.io/health",
                "category": "Custom Service",
                "environment": "Staging",
                "monitoring_type": "Simulated",
                "status": "Down",
                "monitoring_enabled": True,
                "monitoring_interval": 15,
                "timeout_seconds": 5,
                "expected_status_code": 200,
                "warning_threshold_ms": 300,
                "critical_threshold_ms": 800,
                "group_id": g_data.id,
                "owner_id": operator_user.id
            },
            {
                "name": "Admin API",
                "description": "Enterprise administration dashboard management endpoints",
                "url": "sim://admin-api.careplus.io/health",
                "category": "REST API",
                "environment": "Production",
                "monitoring_type": "Simulated",
                "status": "Maintenance",
                "monitoring_enabled": True,
                "monitoring_interval": 20,
                "timeout_seconds": 5,
                "expected_status_code": 200,
                "warning_threshold_ms": 250,
                "critical_threshold_ms": 600,
                "group_id": g_core.id,
                "owner_id": admin_user.id
            },
            {
                "name": "Background Worker",
                "description": "Celery / Redis asynchronous queue consumer workers",
                "url": "sim://workers.internal.careplus.io/heartbeat",
                "category": "Backend Service",
                "environment": "Development",
                "monitoring_type": "Simulated",
                "status": "Operational",
                "monitoring_enabled": True,
                "monitoring_interval": 15,
                "timeout_seconds": 4,
                "expected_status_code": 200,
                "warning_threshold_ms": 200,
                "critical_threshold_ms": 500,
                "group_id": g_core.id,
                "owner_id": operator_user.id
            }
        ]

        created_services = []
        for s_data in sample_services:
            svc = Service(**s_data)
            db.add(svc)
            created_services.append(svc)
        db.commit()

        # 5. Generate Historical Health Checks (Past 24 Hours)
        logger.info("Generating historical health checks for past 24 hours...")
        now = utc_now()
        checks_batch = []

        for svc in created_services:
            # Generate 48 checks across the past 24 hours (every 30 mins)
            for i in range(48, 0, -1):
                chk_time = now - timedelta(minutes=i * 30)

                if svc.status == "Down":
                    # Recent checks down
                    if i < 6:
                        status = "Down"
                        lat = round(random.uniform(900.0, 2200.0), 1)
                        code = 503
                        err = "Service Unavailable: Worker pool exhausted"
                    else:
                        status = "Operational"
                        lat = round(random.uniform(40.0, 160.0), 1)
                        code = 200
                        err = None
                elif svc.status == "Degraded":
                    # Intermittent degraded latency
                    if i < 10:
                        status = "Degraded"
                        lat = round(random.uniform(svc.warning_threshold_ms + 15, svc.critical_threshold_ms - 20), 1)
                        code = 200
                        err = f"High latency ({lat}ms)"
                    else:
                        status = "Operational"
                        lat = round(random.uniform(35.0, 150.0), 1)
                        code = 200
                        err = None
                elif svc.status == "Maintenance":
                    status = "Operational"
                    lat = round(random.uniform(25.0, 80.0), 1)
                    code = 200
                    err = None
                else: # Operational
                    if random.random() < 0.96:
                        status = "Operational"
                        lat = round(random.uniform(20.0, 180.0), 1)
                        code = 200
                        err = None
                    else:
                        status = "Degraded"
                        lat = round(random.uniform(svc.warning_threshold_ms + 5, svc.warning_threshold_ms + 80), 1)
                        code = 200
                        err = "Transient latency jitter"

                checks_batch.append(HealthCheck(
                    service_id=svc.id,
                    check_type=svc.monitoring_type,
                    status=status,
                    response_time_ms=lat,
                    http_status_code=code,
                    error_message=err,
                    checked_at=chk_time
                ))

        db.bulk_save_objects(checks_batch)
        db.commit()

        # 6. Sample Incidents
        analytics_svc = next((s for s in created_services if s.name == "Analytics Service"), None)
        if analytics_svc:
            inc1 = Incident(
                incident_number="INC-4091",
                service_id=analytics_svc.id,
                title="Service Outage: Analytics Service is Unresponsive",
                description="Gateway timeout returned after repeated health check attempts. Database connection queue saturated.",
                severity="Critical",
                status="Investigating",
                detected_at=now - timedelta(hours=2, minutes=45),
                acknowledged_at=now - timedelta(hours=2, minutes=30),
                assigned_user_id=operator_user.id
            )
            db.add(inc1)
            db.commit()
            db.refresh(inc1)

            db.add(IncidentEvent(
                incident_id=inc1.id,
                event_type="Detected",
                message="Incident automatically triggered after 3 consecutive failed health checks. Status Code: 503",
                created_at=inc1.detected_at
            ))
            db.add(IncidentEvent(
                incident_id=inc1.id,
                event_type="Acknowledged",
                message="Investigating upstream database locks on analytics clickhouse cluster.",
                user_id=operator_user.id,
                created_at=inc1.acknowledged_at
            ))
            db.commit()

        # Past resolved incident for Payment API
        payment_svc = next((s for s in created_services if s.name == "Payment API"), None)
        if payment_svc:
            inc2 = Incident(
                incident_number="INC-3814",
                service_id=payment_svc.id,
                title="Major Degradation: Payment API Elevated Error Rate",
                description="Third-party payment webhooks experiencing elevated latency and HTTP 429 rate limit errors.",
                severity="High",
                status="Resolved",
                detected_at=now - timedelta(days=2, hours=4),
                acknowledged_at=now - timedelta(days=2, hours=3, minutes=50),
                recovery_started_at=now - timedelta(days=2, hours=3, minutes=20),
                resolved_at=now - timedelta(days=2, hours=3),
                duration_seconds=3600,
                resolution_notes="Stripe IP failover completed. Rate limit quotas adjusted.",
                assigned_user_id=admin_user.id
            )
            db.add(inc2)
            db.commit()
            db.refresh(inc2)

            db.add(IncidentEvent(
                incident_id=inc2.id,
                event_type="Detected",
                message="Automated alert: Error rate exceeded 5% threshold.",
                created_at=inc2.detected_at
            ))
            db.add(IncidentEvent(
                incident_id=inc2.id,
                event_type="Resolved",
                message="Stripe IP failover completed. Latency normalized to 85ms.",
                user_id=admin_user.id,
                created_at=inc2.resolved_at
            ))
            db.commit()

        # 7. Maintenance Windows
        admin_svc = next((s for s in created_services if s.name == "Admin API"), None)
        maint1 = MaintenanceWindow(
            service_id=admin_svc.id if admin_svc else None,
            title="Scheduled Database Engine Upgrade v16.2",
            description="Routine security patch application and read-replica index rebalancing",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=3),
            status="In Progress",
            created_by=admin_user.id
        )
        maint2 = MaintenanceWindow(
            service_id=None,  # All services
            title="Quarterly Infrastructure Router Firmware Update",
            description="Redundant switch failover test and core firewall rule sync",
            start_time=now + timedelta(days=5, hours=2),
            end_time=now + timedelta(days=5, hours=6),
            status="Scheduled",
            created_by=admin_user.id
        )
        db.add_all([maint1, maint2])
        db.commit()

        # 8. Notifications
        notif1 = Notification(
            service_id=analytics_svc.id if analytics_svc else None,
            incident_id=inc1.id if analytics_svc else None,
            notification_type="service_down",
            title="Critical Outage: Analytics Service Down",
            message="Analytics Service failed consecutive health checks and is marked Down.",
            is_read=False,
            created_at=now - timedelta(hours=2, minutes=45)
        )
        notif2 = Notification(
            service_id=payment_svc.id if payment_svc else None,
            incident_id=inc2.id if payment_svc else None,
            notification_type="incident_resolved",
            title="Resolved: Payment API Latency Normal",
            message="Payment API has fully recovered and returned to Operational.",
            is_read=True,
            created_at=now - timedelta(days=2, hours=3)
        )
        db.add_all([notif1, notif2])
        db.commit()

        # 9. Audit Logs
        db.add(AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INITIALIZED",
            entity_type="System",
            entity_id="init",
            details="CarePlus Service Health Monitoring Dashboard initialized with core services and thresholds."
        ))
        db.add(AuditLog(
            user_id=admin_user.id,
            action="MAINTENANCE_SCHEDULED",
            entity_type="MaintenanceWindow",
            entity_id=str(maint1.id),
            details="Scheduled Database Engine Upgrade v16.2 on Admin API"
        ))
        db.commit()

        logger.info("Successfully completed initial database seeding.")

    except Exception as e:
        logger.error(f"Error during database seeding: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
