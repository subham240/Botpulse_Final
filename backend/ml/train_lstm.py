"""
BotPulse — Stage 2: Bidirectional LSTM Behavioral Sequencer Training Pipeline
Trains a deep sequential neural network on mouse movement trajectories from
C:\\Users\\lenovo\\Downloads\\web_bot_detection_dataset (Phase 1 & Phase 2).
"""

import os
import re
import json
import glob
import math
import time
import logging
import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Any

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("botpulse.ml.train_lstm")

DATASET_DIR = r"C:\Users\lenovo\Downloads\web_bot_detection_dataset"
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "lstm.pt")
SCALER_SAVE_PATH = os.path.join(MODELS_DIR, "lstm_scaler.joblib")
REPORT_SAVE_PATH = os.path.join(MODELS_DIR, "lstm_training_report.json")

COORD_PATTERN = re.compile(r'\[(?:m\()?(\d+),\s*(\d+)\)?\]')

# ------------------------------------------------------------------------------
# 1. Kinematic Feature Extraction per Trajectory
# ------------------------------------------------------------------------------
def extract_kinematic_steps(times: List[float], coords: List[Tuple[str, str]]) -> np.ndarray:
    """
    Extracts 9-dimensional kinematic features per step:
    [dx, dy, dt, dist, speed, accel, angle, d_angle, jerk]
    """
    n = min(len(times), len(coords))
    if n < 4:
        return np.empty((0, 9), dtype=np.float32)

    steps = []
    prev_speed = 0.0
    prev_accel = 0.0
    prev_angle = 0.0

    for i in range(1, n):
        t0 = times[i - 1] / 1000.0
        t1 = times[i] / 1000.0
        dt = max(0.001, t1 - t0)

        x0, y0 = float(coords[i - 1][0]), float(coords[i - 1][1])
        x1, y1 = float(coords[i][0]), float(coords[i][1])

        dx = x1 - x0
        dy = y1 - y0
        dist = math.hypot(dx, dy)
        speed = dist / dt

        # Clip extreme outliers due to micro-interval artifact
        speed = min(speed, 6000.0)

        accel = (speed - prev_speed) / dt
        accel = max(-100000.0, min(100000.0, accel))

        angle = math.atan2(dy, dx)
        d_angle = angle - prev_angle
        # Wrap to [-pi, pi]
        d_angle = (d_angle + math.pi) % (2.0 * math.pi) - math.pi

        jerk = (accel - prev_accel) / dt
        jerk = max(-1000000.0, min(1000000.0, jerk))

        steps.append([dx, dy, dt, dist, speed, accel, angle, d_angle, jerk])

        prev_speed = speed
        prev_accel = accel
        prev_angle = angle

    return np.array(steps, dtype=np.float32)


# ------------------------------------------------------------------------------
# 2. Dataset Ingestion (Phase 1 & Phase 2)
# ------------------------------------------------------------------------------
def load_all_sessions(dataset_dir: str = DATASET_DIR) -> List[Dict[str, Any]]:
    logger.info("Loading session trajectories from: %s", dataset_dir)
    sessions = []

    # --- Phase 1: Annotations ---
    p1_ann_files = glob.glob(os.path.join(dataset_dir, "phase1", "annotations", "*", "*"))
    p1_labels = {}
    for af in p1_ann_files:
        with open(af, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    sid = parts[0]
                    lbl = " ".join(parts[1:]).lower()
                    # 0 = human, 1 = bot (moderate or advanced)
                    p1_labels[sid] = 0 if lbl == "human" else 1

    # --- Phase 1: Mouse movement JSONs ---
    p1_jsons = glob.glob(os.path.join(dataset_dir, "phase1", "data", "mouse_movements", "*", "*", "mouse_movements.json"))
    p1_loaded = 0
    for jf in p1_jsons:
        sid = os.path.basename(os.path.dirname(jf))
        if sid in p1_labels:
            with open(jf, "r", encoding="utf-8") as f:
                d = json.load(f)
            t_str = d.get("mousemove_times", "")
            b_str = d.get("total_behaviour", "") or d.get("mousemove_total_behaviour", "")
            times = [float(x) for x in t_str.split(",") if x.strip()]
            coords = COORD_PATTERN.findall(b_str)
            if len(times) >= 8 and len(coords) >= 8:
                feats = extract_kinematic_steps(times, coords)
                if len(feats) >= 8:
                    sessions.append({
                        "session_id": sid,
                        "phase": "phase1",
                        "label": p1_labels[sid],
                        "features": feats
                    })
                    p1_loaded += 1
    logger.info("Phase 1 loaded: %d sessions", p1_loaded)

    # --- Phase 2: JSON Lines ---
    p2_files = [
        (os.path.join(dataset_dir, "phase2", "data", "mouse_movements", "humans", "mouse_movements_humans.json"), 0),
        (os.path.join(dataset_dir, "phase2", "data", "mouse_movements", "bots", "mouse_movements_moderate_bots.json"), 1),
        (os.path.join(dataset_dir, "phase2", "data", "mouse_movements", "bots", "mouse_movements_advanced_bots.json"), 1),
    ]
    p2_loaded = 0
    for fp, lbl in p2_files:
        if not os.path.exists(fp):
            logger.warning("Missing Phase 2 file: %s", fp)
            continue
        with open(fp, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                sid = d.get("session_id", f"p2_{len(sessions)}")
                t_str = d.get("mousemove_times", "")
                b_str = d.get("mousemove_total_behaviour", "")
                times = [float(x) for x in t_str.split(",") if x.strip()]
                coords = COORD_PATTERN.findall(b_str)
                if len(times) >= 8 and len(coords) >= 8:
                    feats = extract_kinematic_steps(times, coords)
                    if len(feats) >= 8:
                        sessions.append({
                            "session_id": sid,
                            "phase": "phase2",
                            "label": lbl,
                            "features": feats
                        })
                        p2_loaded += 1
    logger.info("Phase 2 loaded: %d sessions", p2_loaded)
    logger.info("Total loaded sessions across phases: %d", len(sessions))
    return sessions


# ------------------------------------------------------------------------------
# 3. Sliding Window Sequence Generation
# ------------------------------------------------------------------------------
def create_sequence_dataset(
    sessions: List[Dict[str, Any]],
    window_size: int = 30,
    step_size: int = 15,
    max_windows_per_session: int = 50
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    X_list = []
    y_list = []
    session_ids = []

    for s in sessions:
        feats = s["features"]
        lbl = s["label"]
        sid = s["session_id"]
        n_steps = len(feats)

        if n_steps < window_size:
            # Pad short sequence
            pad_len = window_size - n_steps
            pad = np.zeros((pad_len, feats.shape[1]), dtype=np.float32)
            padded = np.vstack([feats, pad])
            X_list.append(padded)
            y_list.append(lbl)
            session_ids.append(sid)
            continue

        windows_added = 0
        for start_idx in range(0, n_steps - window_size + 1, step_size):
            if windows_added >= max_windows_per_session:
                break
            w = feats[start_idx : start_idx + window_size]
            X_list.append(w)
            y_list.append(lbl)
            session_ids.append(sid)
            windows_added += 1

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    return X, y, session_ids


# ------------------------------------------------------------------------------
# 4. PyTorch BiLSTM Behavioral Classifier Architecture
# ------------------------------------------------------------------------------
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
        # Global average pooling across time steps
        pooled = torch.mean(out, dim=1)
        logits = self.classifier(pooled)
        return logits.squeeze(-1)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            logits = self.forward(x)
            return torch.sigmoid(logits)


# PyTorch Dataset Wrapper
class TrajectoryDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


# ------------------------------------------------------------------------------
# 5. Main Training Routine
# ------------------------------------------------------------------------------
def train_lstm_model():
    t_start = time.time()
    logger.info("=== Starting BotPulse LSTM Behavioral Sequencer Training ===")

    # 1. Load Sessions
    sessions = load_all_sessions(DATASET_DIR)
    if not sessions:
        raise RuntimeError("No valid sessions found in dataset directory!")

    # 2. Stratified Session Split (Prevents data leakage across session windows)
    all_sids = [s["session_id"] for s in sessions]
    all_labels = [s["label"] for s in sessions]

    train_sids, test_sids = train_test_split(
        all_sids, test_size=0.20, random_state=42, stratify=all_labels
    )
    train_sids_set = set(train_sids)

    train_sessions = [s for s in sessions if s["session_id"] in train_sids_set]
    test_sessions = [s for s in sessions if s["session_id"] not in train_sids_set]

    logger.info("Split: %d train sessions, %d test sessions", len(train_sessions), len(test_sessions))

    # 3. Generate Sequence Windows
    window_size = 30
    step_size = 15
    X_train_raw, y_train, _ = create_sequence_dataset(train_sessions, window_size=window_size, step_size=step_size)
    X_test_raw, y_test, _ = create_sequence_dataset(test_sessions, window_size=window_size, step_size=step_size)

    logger.info("Generated sequence windows: Train=%s, Test=%s", X_train_raw.shape, X_test_raw.shape)
    logger.info("Train label balance: Human=%.1f%%, Bot=%.1f%%",
                (1.0 - np.mean(y_train)) * 100, np.mean(y_train) * 100)

    # 4. Fit Feature Scaler on Training Step Features
    N_tr, L_tr, D_tr = X_train_raw.shape
    flat_train = X_train_raw.reshape(-1, D_tr)

    scaler = RobustScaler()
    scaler.fit(flat_train)

    X_train = scaler.transform(flat_train).reshape(N_tr, L_tr, D_tr)
    X_test = scaler.transform(X_test_raw.reshape(-1, D_tr)).reshape(X_test_raw.shape)

    # Save fitted scaler
    joblib.dump(scaler, SCALER_SAVE_PATH)
    logger.info("Feature scaler saved to: %s", SCALER_SAVE_PATH)

    # 5. Build DataLoaders
    batch_size = 64
    train_ds = TrajectoryDataset(X_train, y_train)
    test_ds = TrajectoryDataset(X_test, y_test)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    # 6. Initialize Model
    device = torch.device("cpu")
    model = BiLSTMBehavioralClassifier(input_dim=9, hidden_dim=64, num_layers=2, dropout=0.2).to(device)

    # Class weighting to handle imbalance
    pos_weight = torch.tensor([(len(y_train) - sum(y_train)) / max(1, sum(y_train))], device=device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=12)

    # 7. Training Loop
    epochs = 12
    logger.info("Training BiLSTM for %d epochs...", epochs)

    best_f1 = 0.0
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / len(train_loader)

        # Validation at epoch end
        model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for bx, by in test_loader:
                bx = bx.to(device)
                probs = torch.sigmoid(model(bx)).cpu().numpy()
                val_preds.extend(probs)
                val_targets.extend(by.numpy())

        val_preds = np.array(val_preds)
        val_targets = np.array(val_targets)
        val_binary = (val_preds >= 0.5).astype(int)

        acc = accuracy_score(val_targets, val_binary)
        f1 = f1_score(val_targets, val_binary, zero_division=0)
        logger.info("Epoch %2d/%2d - Loss: %.4f - Val Acc: %.4f - Val F1: %.4f",
                    epoch, epochs, avg_loss, acc, f1)

        if f1 > best_f1:
            best_f1 = f1

    # 8. Final Comprehensive Evaluation on Held-out Test Set
    model.eval()
    t_inf_start = time.perf_counter()
    with torch.no_grad():
        test_probs = []
        test_labels = []
        for bx, by in test_loader:
            probs = torch.sigmoid(model(bx.to(device))).cpu().numpy()
            test_probs.extend(probs)
            test_labels.extend(by.numpy())

    total_inf_time = (time.perf_counter() - t_inf_start) * 1000.0
    avg_inf_latency_ms = total_inf_time / max(1, len(test_probs))

    test_probs = np.array(test_probs)
    test_labels = np.array(test_labels)
    test_binary = (test_probs >= 0.5).astype(int)

    final_accuracy = float(accuracy_score(test_labels, test_binary))
    final_precision = float(precision_score(test_labels, test_binary, zero_division=0))
    final_recall = float(recall_score(test_labels, test_binary, zero_division=0))
    final_f1 = float(f1_score(test_labels, test_binary, zero_division=0))
    final_auc = float(roc_auc_score(test_labels, test_probs)) if len(np.unique(test_labels)) > 1 else 1.0

    logger.info("=== Final Held-Out Evaluation Results ===")
    logger.info("Accuracy:  %.4f", final_accuracy)
    logger.info("Precision: %.4f", final_precision)
    logger.info("Recall:    %.4f", final_recall)
    logger.info("F1 Score:  %.4f", final_f1)
    logger.info("ROC-AUC:   %.4f", final_auc)
    logger.info("Avg Single-Window Latency: %.2f ms", avg_inf_latency_ms)

    # 9. Save Trained PyTorch Model
    # Save full model for straightforward loading
    torch.save(model, MODEL_SAVE_PATH)
    logger.info("Model saved successfully to: %s", MODEL_SAVE_PATH)

    # 10. Write Training & Evaluation Report
    report = {
        "model_name": "Stage 2 — Bidirectional LSTM Behavioral Sequencer",
        "dataset": "M4D Web Bot Detection Dataset (Phase 1 & Phase 2)",
        "dataset_path": DATASET_DIR,
        "trained_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_sessions": len(sessions),
        "train_sessions": len(train_sessions),
        "test_sessions": len(test_sessions),
        "sequence_window_size": window_size,
        "input_features": [
            "dx", "dy", "dt", "dist", "speed", "accel", "angle", "d_angle", "jerk"
        ],
        "model_architecture": {
            "type": "BiLSTM",
            "input_dim": 9,
            "hidden_dim": 64,
            "num_layers": 2,
            "bidirectional": True,
            "dropout": 0.2
        },
        "evaluation_metrics": {
            "accuracy": round(final_accuracy, 4),
            "precision": round(final_precision, 4),
            "recall": round(final_recall, 4),
            "f1_score": round(final_f1, 4),
            "roc_auc": round(final_auc, 4),
            "mean_latency_ms": round(avg_inf_latency_ms, 2)
        },
        "training_time_seconds": round(time.time() - t_start, 2)
    }

    with open(REPORT_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info("Report saved to: %s", REPORT_SAVE_PATH)
    logger.info("=== Training Complete in %.1fs ===", time.time() - t_start)
    return report

if __name__ == "__main__":
    train_lstm_model()
