import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CarePlus Service Health Monitoring Dashboard"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "careplus_secret_key_super_secure_enterprise_grade_health_monitor_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./health_monitor.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Monitoring Defaults
    DEFAULT_MONITOR_INTERVAL_SECONDS: int = 15
    DEFAULT_TIMEOUT_SECONDS: int = 5
    DEFAULT_RETRY_COUNT: int = 2
    DEFAULT_FAILURE_THRESHOLD: int = 3
    DEFAULT_RECOVERY_THRESHOLD: int = 2
    DEFAULT_WARNING_THRESHOLD_MS: int = 300
    DEFAULT_CRITICAL_THRESHOLD_MS: int = 800
    DATA_RETENTION_DAYS: int = 30
    
    # SSRF Protection
    ALLOW_PRIVATE_NETWORKS: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
