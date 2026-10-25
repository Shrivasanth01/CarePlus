import asyncio
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.all_models import Service
from app.monitoring.health_checker import execute_health_check
from app.monitoring.incident_detector import process_check_result
from app.core.logging import logger

class MonitoringScheduler:
    def __init__(self):
        self.is_running: bool = False
        self._task: asyncio.Task | None = None
        self.last_run_times: dict[int, float] = {}

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        logger.info("Background Monitoring Scheduler started.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Background Monitoring Scheduler stopped.")

    async def _monitoring_loop(self):
        while self.is_running:
            try:
                await self._run_pending_checks()
            except Exception as e:
                logger.error(f"Error in monitoring loop cycle: {e}", exc_info=True)
            
            # Sleep 2 seconds between scheduling passes
            await asyncio.sleep(2)

    async def _run_pending_checks(self):
        db: Session = SessionLocal()
        try:
            services = db.query(Service).filter(Service.monitoring_enabled == True).all()
            now = time.time()
            checks_to_run = []

            for service in services:
                interval = max(service.monitoring_interval or 15, 5)
                last_run = self.last_run_times.get(service.id, 0.0)
                if now - last_run >= interval:
                    self.last_run_times[service.id] = now
                    checks_to_run.append(service)

            for service in checks_to_run:
                try:
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
                except Exception as ex:
                    logger.warning(f"Error executing health check for service {service.name}: {ex}")

        finally:
            db.close()

scheduler = MonitoringScheduler()
