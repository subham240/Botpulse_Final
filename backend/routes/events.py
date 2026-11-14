from fastapi import APIRouter, Request, HTTPException
from backend.schemas.telemetry import TelemetryBatch, DecisionResponse
from backend.services.tracking_service import tracking_service
from backend.database import db

router = APIRouter(prefix="/events", tags=["Telemetry Ingestion"])

@router.post("", response_model=DecisionResponse)
async def ingest_telemetry_events(batch: TelemetryBatch, request: Request):
    """
    Ingests client-side telemetry batches from botpulse.js.
    Executes Three-Layer Detection Orchestration (XGBoost -> LSTM -> RAD-S1).
    Issues cryptographically signed prevention decision token.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check forwarded IP header if behind reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    # Process batch through tracking pipeline
    decision = tracking_service.process_telemetry_batch(batch.dict(), client_ip=client_ip)
    return decision
