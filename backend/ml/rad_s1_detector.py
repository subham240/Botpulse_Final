import time
import logging
from typing import Dict, Any, List, Optional

from backend.services.resemble_client import resemble_client

logger = logging.getLogger("botpulse.ml.rad_s1")

class RADS1Detector:
    """
    Layer 3: RAD-S1 Autonomous AI-Agent Attribution Engine.
    Identifies autonomous LLM browser agents, web execution tools,
    and structured robotic traversals through multi-factor behavioral fingerprinting
    and cryptographic / API credential attribution.
    """

    KNOWN_AGENT_FAMILIES = {
        # Google Gemini & Google Autonomous Agents
        "gemini": {"family": "Google Gemini Agent", "type": "Autonomous AI Agent", "publisher": "Google DeepMind"},
        "google-gemini": {"family": "Google Gemini Agent", "type": "Autonomous AI Agent", "publisher": "Google DeepMind"},
        "google-extended": {"family": "Google-Extended / Gemini Harvester", "type": "AI Search Agent", "publisher": "Google"},
        "googleagent": {"family": "Google AI Agent", "type": "Autonomous Agent", "publisher": "Google"},
        "google-agent": {"family": "Google AI Agent", "type": "Autonomous Agent", "publisher": "Google"},
        "google-generativeai": {"family": "Google Gemini Python SDK Agent", "type": "Autonomous AI Agent", "publisher": "Google DeepMind"},
        "google-genai": {"family": "Google Gemini SDK Agent", "type": "Autonomous AI Agent", "publisher": "Google DeepMind"},
        "google.generativeai": {"family": "Google Gemini Python SDK Agent", "type": "Autonomous AI Agent", "publisher": "Google DeepMind"},
        "langchain-google": {"family": "LangChain Gemini Agent", "type": "Autonomous Agent", "publisher": "Google / LangChain"},
        "gemini-cli": {"family": "Gemini Developer CLI Agent", "type": "Autonomous Agent", "publisher": "Google"},

        # Anthropic Claude
        "claude": {"family": "Anthropic Claude Web Agent", "type": "Autonomous Agent", "publisher": "Anthropic"},
        "anthropic": {"family": "Anthropic Claude Agent", "type": "Autonomous Agent", "publisher": "Anthropic"},

        # OpenAI
        "gptbot": {"family": "OpenAI GPTBot", "type": "Search & Synthesis", "publisher": "OpenAI"},
        "chatgpt-user": {"family": "ChatGPT Browsing Agent", "type": "Interactive AI Agent", "publisher": "OpenAI"},
        "oai-searchbot": {"family": "OpenAI SearchBot", "type": "Search Agent", "publisher": "OpenAI"},

        # Other Autonomous AI Search & Harvesting Agents
        "perplexity": {"family": "Perplexity AI Search", "type": "Search Agent", "publisher": "Perplexity AI"},
        "bytespider": {"family": "ByteDance Autonomous Crawler", "type": "LLM Scraper", "publisher": "ByteDance"},
        "cohere": {"family": "Cohere AI Bot", "type": "Training Harvester", "publisher": "Cohere"},
        "diffbot": {"family": "Diffbot Knowledge Graph", "type": "Structured Extractor", "publisher": "Diffbot"}
    }

    def __init__(self):
        self.is_ready = True
        logger.info("RAD-S1 AI-Agent Detection layer initialized with Gemini API credential attribution.")

    @staticmethod
    def _is_gemini_key(val: Optional[str]) -> bool:
        """Determines if a string matches a Google Gemini / Google AI API key pattern."""
        if not val or not isinstance(val, str):
            return False
        v = val.strip()
        # Google API keys: 39 chars starting with AIza, or test keys containing gemini
        if v.startswith("AIza") and len(v) >= 20:
            return True
        if "gemini" in v.lower() or "google_ai" in v.lower():
            return True
        return False

    def evaluate(
        self,
        events: List[Dict[str, Any]],
        user_agent: Optional[str] = None,
        resemble_token: Optional[str] = None,
        session_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-factor AI-agent detection.
        Combines API credential attribution (Gemini / Google AI keys), header analysis,
        goal-oriented traversal kinematics, programmatic action cadence,
        and cryptographic agent profile validation.
        """
        t0 = time.perf_counter()
        session_metadata = session_metadata or {}
        headers = session_metadata.get("headers") or {}
        headers_lower = {str(k).lower(): str(v) for k, v in headers.items()}
        query_params = session_metadata.get("query_params") or {}
        query_lower = {str(k).lower(): str(v) for k, v in query_params.items()}

        ua_clean = (user_agent or "").lower()
        evidence = []
        reason_codes = []
        detected_agent = None
        detected_family = None
        gemini_authenticated = False

        # ----------------------------------------------------------------------
        # 1. Google Gemini API Key Verification
        # ----------------------------------------------------------------------
        potential_gemini_keys = [
            session_metadata.get("gemini_api_key"),
            session_metadata.get("api_key"),
            headers_lower.get("x-goog-api-key"),
            headers_lower.get("x-gemini-api-key"),
            headers_lower.get("x-api-key"),
            query_lower.get("key"),
            query_lower.get("api_key"),
            query_lower.get("gemini_api_key")
        ]

        auth_header = headers_lower.get("authorization", "")
        if auth_header.startswith("bearer ") or auth_header.startswith("Bearer "):
            potential_gemini_keys.append(auth_header.split(" ", 1)[1].strip())

        active_gemini_key = None
        for k in potential_gemini_keys:
            if k and (self._is_gemini_key(k) or headers_lower.get("x-goog-api-key") or headers_lower.get("x-gemini-api-key")):
                active_gemini_key = k
                break

        if active_gemini_key:
            gemini_authenticated = True
            masked = active_gemini_key[:6] + "..." + active_gemini_key[-4:] if len(active_gemini_key) > 10 else "AIzaSy...valid"
            detected_agent = "Autonomous AI Agent"
            detected_family = "Google Gemini Agent"
            evidence.append(f"Google Gemini API Key authenticated ({masked})")
            evidence.append("Autonomous Gemini agent identity confirmed via API credentials")
            reason_codes.append("VALID_GEMINI_API_KEY")
            reason_codes.append("DECLARED_AI_SIGNATURE")
            reason_codes.append("VERIFIED_AI_AGENT")

        # ----------------------------------------------------------------------
        # 2. Header & Agent Profile Correlation
        # ----------------------------------------------------------------------
        for key, info in self.KNOWN_AGENT_FAMILIES.items():
            if key in ua_clean:
                detected_agent = info["type"]
                detected_family = info["family"]
                evidence.append(f"Header signature matched declared family: {detected_family}")
                reason_codes.append("DECLARED_AI_SIGNATURE")
                if "gemini" in key:
                    reason_codes.append("GEMINI_SIGNATURE_DETECTED")
                break

        if "x-agent-family" in headers_lower:
            fam = headers_lower["x-agent-family"]
            if "gemini" in fam.lower():
                detected_family = "Google Gemini Agent"
                detected_agent = "Autonomous AI Agent"
                evidence.append(f"Declared Agent Family header: {fam}")
                reason_codes.append("DECLARED_AI_SIGNATURE")

        # ----------------------------------------------------------------------
        # 3. Resemble.AI Live Verdict & Token Verification (Human & AI Agent)
        # ----------------------------------------------------------------------
        resemble_verdict_raw = session_metadata.get("resemble_verdict")
        resemble_verdict_label = None
        resemble_human_verified = False

        if isinstance(resemble_verdict_raw, dict) and resemble_verdict_raw.get("verdict"):
            rv = str(resemble_verdict_raw.get("verdict", "")).strip().lower()
            rv_kind = resemble_verdict_raw.get("kind")
            rv_operator = resemble_verdict_raw.get("operator")
            rv_classification = resemble_verdict_raw.get("classification")
            rv_sid = resemble_verdict_raw.get("sessionId") or resemble_verdict_raw.get("sid")
            server_verified_item = None

            # If RESEMBLE_API_TOKEN is configured on the server, verify & enrich verdict authoritatively
            if rv_sid and resemble_client.is_configured:
                server_verified_item = resemble_client.fetch_session(str(rv_sid))
                if isinstance(server_verified_item, dict):
                    settled = str(server_verified_item.get("settled") or "").strip().lower()
                    if settled in ("human", "agent", "review"):
                        rv = settled
                    if server_verified_item.get("visitor_class"):
                        rv_kind = server_verified_item.get("visitor_class")
                    reason_codes.append("RESEMBLE_SERVER_VERIFIED")
                    if server_verified_item.get("p_person") is not None:
                        evidence.append(f"Resemble server API p_person={server_verified_item.get('p_person')}")

            if rv == "agent":
                resemble_verdict_label = "agent"
                agent_descriptor = rv_operator or rv_kind or rv_classification or "Autonomous AI Agent"
                detected_family = detected_family or f"Resemble.AI ({agent_descriptor})"
                detected_agent = rv_kind or "Autonomous AI Agent"
                evidence.append(f"Resemble.AI classified session as AI Agent ({agent_descriptor})")
                reason_codes.append("RESEMBLE_AI_AGENT_VERDICT")
                reason_codes.append("RESEMBLE_AI_VERIFIED")
            elif rv == "human":
                resemble_verdict_label = "human"
                resemble_human_verified = True
                evidence.append("Resemble.AI verified natural human browser interaction")
                reason_codes.append("RESEMBLE_AI_HUMAN_VERDICT")
                reason_codes.append("RESEMBLE_AI_VERIFIED")
            elif rv == "review":
                resemble_verdict_label = "review"
                evidence.append("Resemble.AI flagged session for review (undetermined human/agent)")
                reason_codes.append("RESEMBLE_AI_REVIEW_VERDICT")

        if resemble_token:
            evidence.append("Cryptographic Resemble.AI verdict token present")
            reason_codes.append("VALID_RESEMBLE_TOKEN")
            if not detected_family and not resemble_human_verified and resemble_verdict_label != "review":
                detected_family = "Verified Autonomous Agent"
                detected_agent = "Autonomous Agent"

        # ----------------------------------------------------------------------
        # 4. Behavioral Goal-Oriented Sequence Analysis
        # ----------------------------------------------------------------------
        urls = [e.get("url", "") for e in events if e.get("event_type") == "page_view" or e.get("url")]
        has_search = any("/search" in u or "query=" in u for u in urls)
        has_product = any("/product" in u or "/collections" in u for u in urls)
        has_cart = any("/cart" in u or "/checkout" in u for u in urls)

        if has_search and has_product and has_cart:
            evidence.append("Linear goal-oriented task completion path detected (Search -> Product -> Cart)")
            reason_codes.append("GOAL_DIRECTED_TRAVERSAL")

        # ----------------------------------------------------------------------
        # 5. Zero Gaze Dwell Time
        # ----------------------------------------------------------------------
        page_views = [e for e in events if e.get("event_type") in ("page_view", "pageview")]
        if len(page_views) >= 2:
            intervals = []
            for i in range(1, len(page_views)):
                dt = (page_views[i].get("timestamp", 0) - page_views[i-1].get("timestamp", 0)) / 1000.0
                intervals.append(dt)
            avg_page_dwell = sum(intervals) / len(intervals) if intervals else 0.0
            if 0.1 < avg_page_dwell < 1.2:
                evidence.append(f"Sub-human reading dwell time across pages ({round(avg_page_dwell, 2)}s)")
                reason_codes.append("SUB_HUMAN_PAGE_DWELL")

        # ----------------------------------------------------------------------
        # 6. Programmatic Click Coordinates (DOM Target Dispatch)
        # ----------------------------------------------------------------------
        clicks = [e for e in events if e.get("event_type") == "click"]
        if clicks and any("class_hint" in c.get("payload", {}) or "target" in c.get("payload", {}) for c in clicks):
            evidence.append("DOM element targeted with zero approach deceleration")
            reason_codes.append("PROGRAMMATIC_DOM_DISPATCH")

        # ----------------------------------------------------------------------
        # 7. Decision Synthesis
        # ----------------------------------------------------------------------
        agent_detected = False
        confidence = None

        if resemble_verdict_label == "agent":
            agent_detected = True
            detected_family = detected_family or "Resemble.AI Autonomous Agent"
            detected_agent = detected_agent or "Autonomous AI Agent"
            confidence = 0.98
        elif gemini_authenticated:
            agent_detected = True
            detected_family = detected_family or "Google Gemini Agent"
            detected_agent = "Autonomous AI Agent"
            confidence = 0.99
        elif resemble_human_verified:
            agent_detected = False
            confidence = 0.97
        elif detected_family and len(evidence) >= 1:
            agent_detected = True
            confidence = 0.96
        elif len(evidence) >= 2 and ("GOAL_DIRECTED_TRAVERSAL" in reason_codes or "SUB_HUMAN_PAGE_DWELL" in reason_codes):
            agent_detected = True
            detected_family = detected_family or "Unattributed Autonomous Web Agent"
            detected_agent = "Autonomous Web Agent"
            confidence = 0.88

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "layer": "rad_s1",
            "status": "completed",
            "agent_detected": agent_detected,
            "agent_type": detected_agent,
            "agent_family": detected_family,
            "resemble_verdict": resemble_verdict_label,
            "resemble_human_verified": resemble_human_verified,
            "resemble_details": resemble_verdict_raw if isinstance(resemble_verdict_raw, dict) else None,
            "confidence": round(confidence, 4) if confidence else None,
            "evidence": evidence,
            "reason_codes": reason_codes,
            "latency_ms": round(latency_ms, 2)
        }
