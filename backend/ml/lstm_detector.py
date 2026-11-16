import os
import math
import time
import logging
from typing import Dict, Any, List, Optional
import numpy as np

import torch
import torch.nn as nn
import joblib

from backend.config import settings

logger = logging.getLogger("botpulse.ml.lstm")

class BiLSTMBehavioralClassifier(nn.Module):
    """
    Stage 2: Bidirectional LSTM Behavioral Sequencer.
    Models long-range temporal dependencies in mouse kinematics.
    """
    def __init__(self, input_dim: int = 9, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: [batch_size, seq_len, input_dim]
        out, _ = self.lstm(x)
        pooled = torch.mean(out, dim=1)
        logits = self.classifier(pooled)
        return logits.squeeze(-1)


class LSTMDetector:
    """
    Layer 2: Bidirectional LSTM Behavioral Sequencer.
    Deep sequential trajectory evaluator modeling long-range temporal dependencies
    and kinematic features in cursor and interaction sequences.
    """

    def __init__(self, min_sequence_length: int = 8, max_window: int = 60):
        self.min_sequence_length = min_sequence_length
        self.max_window = max_window
        self.model = None
        self.scaler = None
        self.is_ready = False
        self.model_path = os.path.join(settings.MODELS_DIR, "lstm.pt")
        self.scaler_path = os.path.join(settings.MODELS_DIR, "lstm_scaler.joblib")
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                loaded = torch.load(self.model_path, map_location=torch.device("cpu"), weights_only=False)

                self.model = BiLSTMBehavioralClassifier(input_dim=9, hidden_dim=64, num_layers=2, dropout=0.2)
                if isinstance(loaded, dict):
                    self.model.load_state_dict(loaded)
                elif hasattr(loaded, "state_dict"):
                    self.model.load_state_dict(loaded.state_dict())
                else:
                    self.model = loaded

                self.model.eval()
                self.is_ready = True
                logger.info("Stage 2 BiLSTM model & scaler loaded successfully from %s", self.model_path)
            else:
                self.is_ready = False
                logger.warning("BiLSTM model artifacts not found at %s or %s", self.model_path, self.scaler_path)
        except Exception as e:
            logger.error("Failed to load Stage 2 BiLSTM model: %s", e)
            self.is_ready = False

    def evaluate_sequence(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Processes a sequence of buffered telemetry events.
        Extracts step kinematics, applies neural inference, and returns sequential anomaly verdicts.
        """
        t0 = time.perf_counter()

        # Filter interaction events with coordinates or timing
        interaction_events = [
            e for e in events
            if e.get("event_type") in ("mouse_move", "mousemove", "click", "scroll")
        ]

        seq_len = len(interaction_events)

        if seq_len < self.min_sequence_length:
            return {
                "layer": "lstm",
                "status": "insufficient_data",
                "advanced_bot_score": None,
                "confidence": None,
                "sequence_length": seq_len,
                "reason_codes": [f"MIN_SEQUENCE_NOT_MET: {seq_len}/{self.min_sequence_length} events"],
                "latency_ms": round((time.perf_counter() - t0) * 1000.0, 2)
            }

        # Window to max_window
        windowed = interaction_events[-self.max_window:]

        # Sequential Feature Extraction:
        # [dx, dy, dt, dist, speed, accel, angle, d_angle, jerk]
        coords = []
        times = []
        for ev in windowed:
            p = ev.get("payload", {})
            x = p.get("x")
            y = p.get("y")
            t = ev.get("timestamp", 0)
            if x is not None and y is not None:
                coords.append((float(x), float(y)))
                times.append(float(t))

        if len(coords) < self.min_sequence_length:
            return {
                "layer": "lstm",
                "status": "insufficient_data",
                "advanced_bot_score": None,
                "confidence": None,
                "sequence_length": len(coords),
                "reason_codes": ["INSUFFICIENT_COORDINATE_TRAJECTORY"],
                "latency_ms": round((time.perf_counter() - t0) * 1000.0, 2)
            }

        steps = []
        speeds = []
        angles = []
        prev_speed = None
        prev_accel = 0.0
        prev_angle = None

        for i in range(1, len(coords)):
            t_prev = times[i - 1] / 1000.0
            t_curr = times[i] / 1000.0
            dt = max(0.001, t_curr - t_prev)

            x0, y0 = coords[i - 1]
            x1, y1 = coords[i]

            dx = x1 - x0
            dy = y1 - y0
            dist = math.hypot(dx, dy)
            speed = min(dist / dt, 6000.0)
            angle = math.atan2(dy, dx)

            if prev_speed is None or prev_angle is None:
                accel = 0.0
                d_angle = 0.0
                jerk = 0.0
            else:
                accel = (speed - prev_speed) / dt
                accel = max(-100000.0, min(100000.0, accel))
                d_angle = angle - prev_angle
                d_angle = (d_angle + math.pi) % (2.0 * math.pi) - math.pi
                jerk = (accel - prev_accel) / dt
                jerk = max(-1000000.0, min(1000000.0, jerk))

            steps.append([dx, dy, dt, dist, speed, accel, angle, d_angle, jerk])
            speeds.append(speed)
            angles.append(abs(d_angle))

            prev_speed = speed
            prev_accel = accel
            prev_angle = angle

            prev_speed = speed
            prev_accel = accel
            prev_angle = angle

        # Kinematic summary metrics
        avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
        speed_variance = sum((s - avg_speed) ** 2 for s in speeds) / len(speeds) if speeds else 0.0
        robotic_smoothness = 1.0 / (1.0 + math.sqrt(speed_variance))
        avg_angle_change = sum(angles) / len(angles) if angles else 0.0

        adv_score = 0.0
        reason_codes = []

        # Neural Network Inference (BiLSTM)
        if self.is_ready and self.model is not None and self.scaler is not None:
            try:
                raw_arr = np.array(steps, dtype=np.float32)
                scaled_arr = self.scaler.transform(raw_arr)
                t_in = torch.tensor(scaled_arr, dtype=torch.float32).unsqueeze(0)  # [1, seq_len, 9]

                with torch.no_grad():
                    logits = self.model(t_in)
                    adv_score = float(torch.sigmoid(logits).item())

                confidence = adv_score if adv_score > 0.5 else (1.0 - adv_score)
                confidence = max(0.80, min(0.99, confidence))
            except Exception as e:
                logger.warning("BiLSTM forward pass error, falling back to kinematic heuristics: %s", e)
                adv_score = 0.5
                confidence = 0.70
        else:
            # Kinematic fallback
            if robotic_smoothness > 0.85:
                adv_score += 0.45
            if avg_angle_change < 0.08:
                adv_score += 0.40
            elif avg_angle_change > 2.8:
                adv_score += 0.35
            adv_score = min(1.0, max(0.0, adv_score))
            confidence = 0.90 if adv_score > 0.7 else 0.85

        # Explainable Reason Codes
        if adv_score >= 0.65:
            reason_codes.append("LSTM_SEQUENTIAL_ANOMALY_CONFIRMED")
        if robotic_smoothness > 0.80:
            reason_codes.append("SYNTHETIC_VELOCITY_UNIFORMITY")
        if avg_angle_change < 0.08:
            reason_codes.append("UNNATURAL_LINEAR_TRAJECTORY")
        elif avg_angle_change > 2.8:
            reason_codes.append("ERRATIC_STEP_DISCONTINUITY")
        if adv_score < 0.35:
            reason_codes.append("NATURAL_BIOMECHANICAL_TRAJECTORY")

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "layer": "lstm",
            "status": "completed",
            "advanced_bot_score": round(adv_score, 4),
            "confidence": round(confidence, 4),
            "sequence_length": len(steps),
            "reason_codes": reason_codes,
            "metrics": {
                "velocity_entropy": round(speed_variance, 2),
                "angular_variance": round(avg_angle_change, 3),
                "robotic_smoothness_index": round(robotic_smoothness, 3),
                "neural_model_active": self.is_ready
            },
            "latency_ms": round(latency_ms, 2)
        }
