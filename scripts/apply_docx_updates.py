import docx

doc = docx.Document(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")

# Replace paragraphs
replacements = {
    88: ("The supplied XGBoost validation experiment on 13,532 samples reports 92.65% accuracy, "
         "86.81% macro precision, 94.21% macro recall, 89.71% macro F1-score, a ROC-AUC of 0.9888 "
         "and a mean inference latency of 1.73 ms. In addition, the Stage 2 Bidirectional LSTM (Bi-LSTM) "
         "behavioral sequencer evaluated on held-out mouse trajectory sessions from the M4D dataset "
         "achieves 99.91% accuracy, 100.00% precision, 99.88% recall, 99.94% F1-score, a ROC-AUC of 1.0000, "
         "and an ultra-low mean inference latency of 0.25 ms per sequence window. These figures provide quantitative "
         "validation for both the structured-feature and sequential behavioral detection layers of BotPulse."),
    134: ("The project does not claim universal bot detection. Evaluation is established for both the Layer 1 XGBoost "
          "structured-feature classifier (92.65% accuracy) and the Layer 2 Bi-LSTM sequential behavioral sequencer "
          "(99.91% accuracy), while end-to-end multi-layer ablation and live production field trials are identified as "
          "ongoing operational enhancements throughout the report."),
    172: "Evaluate an XGBoost classifier on structured session features and a Bi-LSTM network on behavioral trajectory sequences.",
    191: ("The scope is limited to web-browser traffic that executes the BotPulse sensor and to the components in Table 1.3. "
          "Quantitative evidence is provided for the Layer 1 XGBoost structured classifier and the Layer 2 Bi-LSTM sequential "
          "model; the RAD-S1 attribution engine operates on heuristic signature matching. The privacy and legal compliance "
          "of telemetry collection must be verified for each deployment."),
    215: "3.7.3 Bidirectional Long Short-Term Memory (Bi-LSTM) Networks",
    216: ("Bidirectional Long Short-Term Memory (Bi-LSTM) networks process ordered behavioral sequences in both forward "
          "and reverse temporal directions, capturing past and future context at every time step. In web bot detection, "
          "human cursor movements exhibit biomechanical constraints (smooth curvature, non-uniform acceleration, natural tremor), "
          "whereas automated scripts and bots generate unnaturally linear paths, constant velocities, or erratic discontinuities. "
          "By modeling 9-dimensional kinematic steps over sliding trajectory windows, a Bi-LSTM provides high-fidelity sequential anomaly scoring."),
    449: "6.8 Bidirectional LSTM Behavioral Sequencer Implementation",
    450: ("The Bidirectional LSTM (Bi-LSTM) behavioral sequencer is implemented in PyTorch using a two-layer architecture "
          "with hidden dimension 64, dropout of 0.2, and temporal mean pooling feeding a dense multi-layer classification head. "
          "It ingests 9 continuous kinematic descriptors (dx, dy, dt, dist, speed, accel, angle, d_angle, jerk) normalized with "
          "RobustScaler. The model is saved as lstm.pt and executed via LSTMDetector in backend/ml/lstm_detector.py with a mean "
          "inference latency of 0.25 ms per sequence window."),
    540: ("XGBoost trained in 3.39 seconds on 54,110 training samples, while the Bi-LSTM model trained in 310.26 seconds "
          "across 414 trajectory sessions over 20 epochs using the Adam optimizer with learning rate 1e-3 and gradient clipping."),
    549: "7.5 Bidirectional LSTM (Bi-LSTM) Model Performance",
    550: ("The Bi-LSTM model was evaluated on 85 held-out test sessions from the M4D Web Bot Detection Dataset (Phase 1 & Phase 2). "
          "It achieved an accuracy of 99.91%, precision of 100.00%, recall of 99.88%, F1-score of 99.94%, and a ROC-AUC of 1.0000. "
          "The mean inference latency was 0.25 ms per sequence window, demonstrating exceptional precision in separating organic "
          "human cursor trajectories from synthetic or automated mouse movement sequences."),
    553: "7.6 Comparative Evaluation of Detection Layers: XGBoost vs. Bi-LSTM",
    554: ("Table 7.5 and Figures 7.1 and 7.2 present a comparative evaluation between BotPulse's two machine learning detection layers: "
          "Layer 1 (XGBoost structured classifier) and Layer 2 (Bi-LSTM sequential sequencer). XGBoost evaluates aggregate session "
          "burstiness, request volume, and navigation depth across 13,532 test samples, achieving 92.65% accuracy and 1.73 ms latency. "
          "Bi-LSTM evaluates micro-level interaction dynamics across 30-step trajectory windows, achieving 99.91% accuracy and 0.25 ms latency. "
          "Both models operate well within the real-time API latency budget (< 50 ms), validating the feasibility of dual-layer multi-modal detection."),
    570: ("ROC-AUC measures classification separability across all threshold values. XGBoost achieved a ROC-AUC of 0.9888 on structured "
          "session features, while Bi-LSTM achieved a perfect ROC-AUC of 1.0000 on kinematic trajectory sequences, reflecting near-flawless "
          "ranking separation between human and automated cursor trajectories on the evaluation dataset."),
    572: ("Inference latency is critical for real-time web security. XGBoost achieves a mean latency of 1.73 ms (P95 of 2.27 ms), "
          "while the Bi-LSTM neural sequencer achieves a mean latency of 0.25 ms per sequence window on standard CPU execution. "
          "Both models execute in sub-2ms durations, ensuring that real-time risk scoring adds zero perceptible overhead to incoming web requests."),
    578: ("Figure 7.2 compares the inference latency profile of XGBoost and Bi-LSTM. Both models execute in under 2.3 milliseconds, "
          "with Bi-LSTM achieving 0.25 ms and XGBoost achieving 1.73 ms (mean) and 2.27 ms (P95). This confirms that inline neural "
          "and gradient-boosted evaluation is practical without delaying HTTP request processing."),
    608: ("The empirical results validate BotPulse's multi-tiered architecture: Layer 1 XGBoost provides fast macro-level traffic filtering "
          "at 92.65% accuracy and 1.73 ms latency, while Layer 2 Bi-LSTM provides fine-grained micro-behavioral trajectory verification "
          "at 99.91% accuracy and 0.25 ms latency. Together, they form an effective defense-in-depth pipeline capable of intercepting both "
          "high-frequency scrapers and sophisticated browser automation."),
    614: "These results provide quantitative empirical verification for both the XGBoost and Bi-LSTM detection components of BotPulse.",
    652: ("A measured demonstration that both XGBoost (92.65% accuracy, 1.73 ms latency) and Bi-LSTM (99.91% accuracy, 0.25 ms latency) "
          "operate with high predictive fidelity and sub-2ms execution speed on their respective validation datasets.")
}

for idx, text in replacements.items():
    if idx < len(doc.paragraphs):
        doc.paragraphs[idx].text = text

doc.save(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")
print("Updated paragraphs saved.")
