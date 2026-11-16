import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.database import db
from backend.ml.model_registry import model_registry

from backend.routes.auth import router as auth_router
from backend.routes.websites import router as websites_router
from backend.routes.events import router as events_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.prevention import router as prevention_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("botpulse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    logger.info("Starting %s on port 8000...", settings.PROJECT_NAME)
    health = model_registry.get_health_overview()
    logger.info("Model Health: XGBoost=%s, LSTM=%s, RAD-S1=%s",
                health["xgboost"]["status"], health["lstm"]["status"], health["rad_s1"]["status"])
    yield
    logger.info("Shutting down BotPulse Backend Engine.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Three-Layer AI Bot Detection, Behavioral Telemetry & Autonomous Prevention Engine",
    lifespan=lifespan,
    redirect_slashes=False
)

# Configure CORS for dashboard and protected websites (supports all origins, tunnels, and Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount Routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(websites_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(prevention_router, prefix=settings.API_V1_STR)
# Mount root aliases for telemetry ingestion
app.include_router(events_router, prefix="")

# Serve Client Tracking SDK directly from root and API paths
SDK_PATH = os.path.join(os.path.dirname(__file__), "sdk", "botpulse.js")

@app.get("/botpulse.js")
@app.get("/api/v1/botpulse.js")
def serve_botpulse_sdk():
    """Serves the universal client tracking JavaScript SDK."""
    if os.path.exists(SDK_PATH):
        with open(SDK_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(content=content, media_type="application/javascript")
    return Response(content="// SDK not found", status_code=404)

@app.get("/")
@app.get("/api")
@app.get("/api/v1")
def api_root():
    """Root endpoint for Vercel and API discovery."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "supabase_postgresql" if getattr(db, "is_postgres", False) else ("mongodb" if db.is_mongodb else "sqlite_fallback"),
        "models": model_registry.get_health_overview(),
        "default_site": settings.DEFAULT_SITE_DOMAIN
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
