import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from backend.config import settings

logger = logging.getLogger("botpulse.services.resemble")


class ResembleClient:
    """
    Server-side Resemble.AI Agent Detection (RAD-S1) API client.
    Mirrors the server lookup/sync pattern from resemble-rad-s1-tester while keeping
    RESEMBLE_API_TOKEN strictly on the server (never exposed to browsers).
    """

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    @property
    def is_configured(self) -> bool:
        return bool(settings.RESEMBLE_API_TOKEN and settings.RESEMBLE_API_TOKEN.strip())

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {settings.RESEMBLE_API_TOKEN.strip()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _get_json(self, path: str, params: Optional[Dict[str, str]] = None, timeout: float = 8.0) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        base = settings.RESEMBLE_BASE_URL.rstrip("/")
        url = f"{base}/{path.lstrip('/')}"
        if params:
            url = f"{url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers=self._headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            logger.debug("Resemble API HTTP %s for %s", exc.code, path)
        except Exception as exc:
            logger.debug("Resemble API request error for %s: %s", path, exc)
        return None

    def check_status(self) -> str:
        if not self.is_configured:
            return "not_configured"
        base = settings.RESEMBLE_BASE_URL.rstrip("/")
        req = urllib.request.Request(f"{base}/sites", headers=self._headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                return "connected" if resp.status == 200 else f"error_{resp.status}"
        except urllib.error.HTTPError as exc:
            return f"error_{exc.code}"
        except Exception:
            return "unreachable"

    def fetch_session(self, resemble_sid: str) -> Optional[Dict[str, Any]]:
        """
        Server-side lookup of a Resemble session by sid (with short 30s cache).
        Returns dict containing settled, visitor_class, p_person, action, duration_s, etc.
        """
        if not resemble_sid or not self.is_configured:
            return None

        now = time.time()
        cached = self._cache.get(resemble_sid)
        if cached and now - cached["ts"] < 30.0:
            return cached["data"]

        # 1. Query sessions and match EXACT sid (Resemble's ?sid= filter may return full list)
        data = self._get_json("sessions", params={"sid": resemble_sid}, timeout=6.0)
        if data:
            items = data.get("items") or []
            for item in items:
                if isinstance(item, dict) and str(item.get("sid") or "") == str(resemble_sid):
                    self._cache[resemble_sid] = {"ts": now, "data": item}
                    return item

        # 2. Direct path lookup fallback (also require exact sid/id match)
        direct = self._get_json(f"sessions/{urllib.parse.quote(resemble_sid)}", timeout=6.0)
        if direct:
            item = direct.get("item", direct)
            if isinstance(item, dict) and (
                str(item.get("sid") or "") == str(resemble_sid)
                or str(item.get("id") or "") == str(resemble_sid)
            ):
                self._cache[resemble_sid] = {"ts": now, "data": item}
                return item

        return None

    def fetch_recent_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.is_configured:
            return []
        params: Dict[str, str] = {}
        if settings.RESEMBLE_SITE_ID:
            params["site_id"] = str(settings.RESEMBLE_SITE_ID)
        data = self._get_json("sessions", params=params or None, timeout=12.0)
        if not data:
            data = self._get_json("sessions", timeout=12.0)
        if not data:
            return []
        items = data.get("items") or []
        return items[:limit]


resemble_client = ResembleClient()
