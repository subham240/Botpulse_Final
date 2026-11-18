import time
from fastapi import APIRouter, Request, HTTPException, Body
from typing import Optional, Dict, Any
from backend.schemas.telemetry import TelemetryBatch, DecisionResponse
from backend.services.tracking_service import tracking_service
from backend.database import db

router = APIRouter(tags=["Telemetry Ingestion"])

@router.post("/events", response_model=DecisionResponse)
@router.post("/events/events", response_model=DecisionResponse)
@router.post("/telemetry/events", response_model=DecisionResponse)
@router.post("/telemetry", response_model=DecisionResponse)
def ingest_telemetry_events(batch: TelemetryBatch, request: Request):
    """
    Ingests client-side telemetry batches from botpulse.js or AI agents.
    Executes Three-Layer Detection Orchestration (XGBoost -> LSTM -> RAD-S1).
    Issues cryptographically signed prevention decision token.
    Attribution engine isolates bots (traditional/advanced) from legitimate AI agents (Gemini, Claude, GPTBot).
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check forwarded IP header if behind reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    batch_dict = batch.dict()

    # Normalize and extract request headers
    req_headers = dict(request.headers)
    req_query = dict(request.query_params)

    # Resolve User-Agent fallback
    if not batch_dict.get("user_agent") or batch_dict.get("user_agent") == "Unknown Browser":
        batch_dict["user_agent"] = request.headers.get("user-agent", "Unknown Browser")

    # Extract API key attribution from request headers / query params
    gemini_key = (
        batch.gemini_api_key
        or batch.api_key
        or request.headers.get("x-goog-api-key")
        or request.headers.get("x-gemini-api-key")
        or request.query_params.get("key")
        or request.query_params.get("gemini_api_key")
    )
    api_key = (
        batch.api_key
        or request.headers.get("x-api-key")
        or request.query_params.get("api_key")
    )

    # Attach full session metadata
    meta = batch_dict.get("session_metadata") or {}
    meta["headers"] = req_headers
    meta["query_params"] = req_query
    if gemini_key:
        meta["gemini_api_key"] = gemini_key
    if api_key:
        meta["api_key"] = api_key
    if batch.agent_family:
        meta["agent_family"] = batch.agent_family
    if batch.resemble_verdict:
        meta["resemble_verdict"] = batch.resemble_verdict
    batch_dict["session_metadata"] = meta

    # Process batch through tracking pipeline
    decision = tracking_service.process_telemetry_batch(batch_dict, client_ip=client_ip)
    return decision

@router.post("/events/test-agent", response_model=DecisionResponse)
@router.post("/telemetry/test-agent", response_model=DecisionResponse)
@router.post("/test-agent", response_model=DecisionResponse)
def test_ai_agent(payload: Dict[str, Any] = Body(...), request: Request = None):
    """
    Dedicated testing endpoint for AI agents (e.g. Gemini, Claude, GPTBot).
    Validates API key attribution, executes 3-layer detection, and returns the classification.
    Guarantees AI agents with API keys are classified as 'ai_agent' and not as bots.
    """
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    if request:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            client_ip = fwd.split(",")[0].strip()

    agent_family = payload.get("agent_family", "gemini")
    api_key = payload.get("api_key") or payload.get("gemini_api_key") or (request.headers.get("x-goog-api-key") if request else None)
    user_agent = payload.get("user_agent", "Google-Gemini-Agent/1.0 (+https://deepmind.google/technologies/gemini/)")
    session_id = payload.get("session_id", f"sess_gemini_test_{client_ip.replace('.', '_')}")
    site_key = payload.get("site_key", "bp_pub_alvera_live_7c4f19e")

    batch = {
        "site_key": site_key,
        "session_id": session_id,
        "user_agent": user_agent,
        "gemini_api_key": api_key,
        "api_key": api_key,
        "agent_family": agent_family,
        "events": payload.get("events", [
            {
                "event_type": "page_view",
                "url": "https://elvara.store/products",
                "timestamp": int(time.time() * 1000) - 200,
                "sequence_num": 1,
                "payload": {"query": "gemini autonomous test"}
            },
            {
                "event_type": "scroll",
                "url": "https://elvara.store/products",
                "timestamp": int(time.time() * 1000) - 100,
                "sequence_num": 2,
                "payload": {"scroll_y": 650}
            },
            {
                "event_type": "click",
                "url": "https://elvara.store/products/12",
                "timestamp": int(time.time() * 1000),
                "sequence_num": 3,
                "payload": {"target": "div.product-card", "class_hint": "product-link"}
            }
        ]),
        "session_metadata": {
            "gemini_api_key": api_key,
            "api_key": api_key,
            "headers": dict(request.headers) if request else {},
            "query_params": dict(request.query_params) if request else {}
        }
    }

    decision = tracking_service.process_telemetry_batch(batch, client_ip=client_ip)
    return decision
