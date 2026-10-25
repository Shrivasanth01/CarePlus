from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.connection import engine, Base
from app.seed import seed_database
from app.monitoring.scheduler import scheduler
from app.websocket.connection_manager import manager
from app.api.router import api_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting CarePlus Health Monitoring Platform...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    await scheduler.start()
    yield
    # Shutdown
    logger.info("Stopping CarePlus Health Monitoring Platform...")
    await scheduler.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Service Health Monitoring Dashboard – Real-Time Uptime, Incident Tracking & System Observability",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Real-Time Monitoring
@app.websocket("/ws/monitoring")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to CarePlus Live Monitoring Stream",
            "active_connections": len(manager.active_connections)
        })
        while True:
            # Keep receiving pings or client queries
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "Online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "websocket": "/ws/monitoring"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "scheduler_active": scheduler.is_running}
