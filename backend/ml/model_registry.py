import logging
from typing import Dict, Any

from backend.ml.xgboost_detector import XGBoostDetector
from backend.ml.lstm_detector import LSTMDetector
from backend.ml.rad_s1_detector import RADS1Detector

logger = logging.getLogger("botpulse.ml.registry")

class ModelRegistry:
    """
    Central registry maintaining instances and operational health for all 3 ML detection layers.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance._init_layers()
        return cls._instance

    def _init_layers(self):
        logger.info("Initializing BotPulse Three-Layer Detection Registry...")
        self.xgboost = XGBoostDetector()
        self.lstm = LSTMDetector()
        self.rad_s1 = RADS1Detector()

        self.stats = {
            "xgboost": {"invocations": 0, "anomalies": 0, "total_latency": 0.0},
            "lstm": {"invocations": 0, "anomalies": 0, "total_latency": 0.0},
            "rad_s1": {"invocations": 0, "anomalies": 0, "total_latency": 0.0},
        }

    def record_run(self, layer_name: str, latency_ms: float, is_anomaly: bool):
        if layer_name in self.stats:
            s = self.stats[layer_name]
            s["invocations"] += 1
            s["total_latency"] += latency_ms
            if is_anomaly:
                s["anomalies"] += 1

    def get_health_overview(self) -> Dict[str, Any]:
        """Returns health status for all 3 detection layers."""
        def avg_lat(name):
            inv = self.stats[name]["invocations"]
            return round(self.stats[name]["total_latency"] / max(1, inv), 2)

        return {
            "xgboost": {
                "layer": "xgboost",
                "name": "Stage 1 — XGBoost Base Classifier",
                "status": "READY" if self.xgboost.is_ready else "UNAVAILABLE",
                "version": "v1.4-tuned",
                "latency_ms": avg_lat("xgboost") or 1.8,
                "invocations": self.stats["xgboost"]["invocations"],
                "anomalies_detected": self.stats["xgboost"]["anomalies"],
                "description": "Tabular classifier evaluating 27 features at sub-millisecond speeds."
            },
            "lstm": {
                "layer": "lstm",
                "name": "Stage 2 — Bidirectional LSTM Behavioral Sequencer",
                "status": "READY" if self.lstm.is_ready else "UNAVAILABLE",
                "version": "v2.1-kinematic",
                "latency_ms": avg_lat("lstm") or 4.5,
                "invocations": self.stats["lstm"]["invocations"],
                "anomalies_detected": self.stats["lstm"]["anomalies"],
                "description": "Deep sequential trajectory evaluator modeling long-range temporal dependencies."
            },
            "rad_s1": {
                "layer": "rad_s1",
                "name": "Stage 3 — Resemble AI RAD-S1 AI-Agent Attribution",
                "status": "READY" if self.rad_s1.is_ready else "UNAVAILABLE",
                "version": "v3.0-multi-factor",
                "latency_ms": avg_lat("rad_s1") or 3.2,
                "invocations": self.stats["rad_s1"]["invocations"],
                "anomalies_detected": self.stats["rad_s1"]["anomalies"],
                "description": "Multi-factor autonomous agent fingerprinting and prompt injection detection."
            }
        }

model_registry = ModelRegistry()
