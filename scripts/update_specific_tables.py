import docx

doc = docx.Document(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")

# Table 60: Bi-LSTM Validation Results
t60 = doc.tables[60]
t60_data = [
    ["Metric", "Value"],
    ["Accuracy", "99.91%"],
    ["Precision", "100.00%"],
    ["Recall", "99.88%"],
    ["F1-score", "99.94%"],
    ["ROC-AUC", "1.0000"],
    ["Mean inference latency", "0.25 ms"],
    ["Evaluation dataset", "M4D Held-Out Sessions (85 test sessions)"],
    ["Training duration", "310.26 s (20 epochs)"]
]
# Clear and resize if needed, or update existing rows
for r_idx in range(len(t60.rows)):
    if r_idx < len(t60_data):
        t60.rows[r_idx].cells[0].text = t60_data[r_idx][0]
        t60.rows[r_idx].cells[1].text = t60_data[r_idx][1]

# Table 61: XGBoost vs Bi-LSTM Comparison
t61 = doc.tables[61]
t61_data = [
    ["Metric", "XGBoost (Layer 1)", "Bi-LSTM (Layer 2)", "Detection Scope / Superior"],
    ["Accuracy", "92.65%", "99.91%", "Bi-LSTM (Trajectory sequences)"],
    ["Precision", "86.81% (Macro)", "100.00%", "Bi-LSTM"],
    ["Recall", "94.21% (Macro)", "99.88%", "Bi-LSTM"],
    ["F1-score", "89.71% (Macro)", "99.94%", "Bi-LSTM"],
    ["ROC-AUC", "0.9888", "1.0000", "Bi-LSTM"],
    ["Mean inference latency", "1.73 ms", "0.25 ms", "Bi-LSTM (0.25 ms per window)"],
    ["P95 inference latency", "2.27 ms", "0.32 ms", "Bi-LSTM"],
    ["Training duration", "3.39 s", "310.26 s", "XGBoost (faster training)"]
]
for r_idx in range(len(t61.rows)):
    if r_idx < len(t61_data):
        for c_idx in range(len(t61.rows[r_idx].cells)):
            if c_idx < len(t61_data[r_idx]):
                t61.rows[r_idx].cells[c_idx].text = t61_data[r_idx][c_idx]

# Table 63: Latency & Training Duration
t63 = doc.tables[63]
t63_data = [
    ["Measure", "XGBoost (Layer 1)", "Bi-LSTM (Layer 2)"],
    ["Mean inference latency", "1.73 ms", "0.25 ms"],
    ["P95 inference latency", "2.27 ms", "0.32 ms"],
    ["Training duration", "3.39 s", "310.26 s"]
]
for r_idx in range(len(t63.rows)):
    if r_idx < len(t63_data):
        for c_idx in range(len(t63.rows[r_idx].cells)):
            if c_idx < len(t63_data[r_idx]):
                t63.rows[r_idx].cells[c_idx].text = t63_data[r_idx][c_idx]

doc.save(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")
print("Tables 60, 61, 63 updated successfully.")
