import os
import time
import logging
from typing import Dict, Any, List

try:
    import pandas as pd
    import joblib
    HAS_ML = True
except ImportError:
    HAS_ML = False
    pd = None
    joblib = None

from backend.config import settings
from backend.ml.feature_extractor import COMMON_FEATURES

logger = logging.getLogger("botpulse.ml.xgboost")

class XGBoostDetector:
    """
    Layer 1: XGBoost Gradient Boosted Classifier.
    Evaluates 27-dimensional behavioral and HTTP features.
    Isolates obvious human traffic from automated bots.
    """

    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.is_ready = False
        self.model_path = os.path.join(settings.MODELS_DIR, "xgboost.joblib")
        self.preprocessor_path = os.path.join(settings.MODELS_DIR, "preprocessor.joblib")
        self._load_model()

    def _load_model(self):
        if not HAS_ML:
            logger.info("ML runtime libraries (pandas/joblib) not present. Operating with rule-based screening.")
            self.is_ready = False
            return
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.preprocessor_path):
                self.model = joblib.load(self.model_path)
                self.preprocessor = joblib.load(self.preprocessor_path)
                self.is_ready = True
                logger.info("XGBoost Layer 1 loaded successfully from %s", self.model_path)
            else:
                logger.error("XGBoost model files missing at %s or %s", self.model_path, self.preprocessor_path)
                self.is_ready = False
        except Exception as e:
            logger.error("Failed to load XGBoost Layer 1: %s", e)
            self.is_ready = False

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Executes real inference through the trained preprocessor and XGBoost model.
        """
        if not self.is_ready:
            return {
                "layer": "xgboost",
                "status": "unavailable",
                "predicted_class": "unknown",
                "confidence": None,
                "requires_advanced_analysis": True,
                "reason_codes": ["MODEL_ARTIFACT_UNAVAILABLE"],
                "latency_ms": 0.0
            }

        t0 = time.perf_counter()
        try:
            # Build DataFrame with strictly ordered common features
            df = pd.DataFrame([{col: float(features.get(col, 0.0)) for col in COMMON_FEATURES}])
            
            # Apply trained StandardScaler
            X_scaled = self.preprocessor.transform(df)
            
            # Prediction and probability
            pred_class = int(self.model.predict(X_scaled)[0])
            
            if hasattr(self.model, "predict_proba"):
                probs = self.model.predict_proba(X_scaled)[0]
                prob_human = float(probs[0])
                prob_bot = float(probs[1])
            else:
                prob_bot = 1.0 if pred_class == 1 else 0.0
                prob_human = 1.0 - prob_bot

            latency_ms = (time.perf_counter() - t0) * 1000.0

            # 0 = Human, 1 = Web Robot
            predicted_label = "automated_bot" if pred_class == 1 else "human"
            confidence = prob_bot if pred_class == 1 else prob_human

            # Determine whether Layer 2 (LSTM) or Layer 3 (RAD-S1) inspection is required:
            # - When probability is ambiguous (0.35 to 0.70)
            # - Or when classified as bot (to distinguish standard scraper from adaptive advanced bot)
            requires_advanced = (0.35 <= prob_bot <= 0.75) or (pred_class == 1)

            reason_codes = []
            if features.get("MAX_BARRAGE", 0) > 8:
                reason_codes.append("HIGH_FREQUENCY_BURST")
            if features.get("STANDARD_DEVIATION", 0) < 0.05 and features.get("NUMBER_OF_REQUESTS", 0) > 3:
                reason_codes.append("UNNATURAL_FIXED_CADENCE")
            if features.get("CONSECUTIVE", 0) > 0.85:
                reason_codes.append("ZERO_CURVATURE_TRAJECTORY")
            if features.get("IS_AUTOMATED_TOOL", 0) > 0.5:
                reason_codes.append("HEADLESS_AUTOMATION_SIGNATURE")

            # Correlate strong automation indicators with tabular probabilities
            has_automation = (
                "HEADLESS_AUTOMATION_SIGNATURE" in reason_codes
                or ("ZERO_CURVATURE_TRAJECTORY" in reason_codes and "UNNATURAL_FIXED_CADENCE" in reason_codes)
                or features.get("MAX_BARRAGE", 0) >= 10
            )

            if has_automation and prob_bot < 0.60:
                prob_bot = 0.91
                prob_human = 0.09
                pred_class = 1
                predicted_label = "automated_bot"
                confidence = 0.91
                requires_advanced = True

            return {
                "layer": "xgboost",
                "status": "completed",
                "predicted_class": predicted_label,
                "prob_human": round(prob_human, 4),
                "prob_bot": round(prob_bot, 4),
                "confidence": round(confidence, 4),
                "requires_advanced_analysis": requires_advanced,
                "reason_codes": reason_codes,
                "latency_ms": round(latency_ms, 2)
            }
        except Exception as err:
            logger.error("XGBoost prediction failure: %s", err)
            return {
                "layer": "xgboost",
                "status": "error",
                "predicted_class": "unknown",
                "confidence": None,
                "requires_advanced_analysis": True,
                "reason_codes": [f"PREDICTION_ERROR: {str(err)}"],
                "latency_ms": round((time.perf_counter() - t0) * 1000.0, 2)
            }
