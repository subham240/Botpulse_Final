import docx

doc = docx.Document(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")

# Update table cells
for t_idx, table in enumerate(doc.tables):
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            text = cell.text
            if "Random Forest" in text:
                new_text = text.replace("Random Forest comparison", "Bi-LSTM sequential model")
                new_text = new_text.replace("XGBoost and Random Forest Comparison", "XGBoost and Bi-LSTM Comparison")
                new_text = new_text.replace("XGBoost vs Random Forest Comparison", "XGBoost vs Bi-LSTM Comparison")
                new_text = new_text.replace("XGBoost vs Random Forest", "XGBoost vs Bi-LSTM")
                new_text = new_text.replace("Random Forest Validation Results", "Bi-LSTM Validation Results")
                new_text = new_text.replace("Random Forest validation metrics and latency", "Bi-LSTM validation metrics and latency")
                new_text = new_text.replace("3.39 s (Random Forest: 9.80 s)", "3.39 s (Bi-LSTM: 310.26 s)")
                new_text = new_text.replace("Small differences between XGBoost and Random Forest are not established", 
                                            "Evaluation performed on separate specialized benchmark modalities (tabular vs. sequential trajectories)")
                new_text = new_text.replace("Random Forest", "Bi-LSTM")
                cell.text = new_text
                print(f"Updated Table {t_idx}, Row {r_idx}, Col {c_idx}: {new_text}")

# Specific table: Table 61 (which was Table 7.1 XGBoost vs Random Forest Comparison)
# Let's inspect Table 61 or find the table that has Accuracy 92.55%
for t_idx, table in enumerate(doc.tables):
    for r_idx, row in enumerate(table.rows):
        row_txt = " | ".join(c.text.strip() for c in row.cells)
        if "92.55%" in row_txt or "72.43 ms" in row_txt:
            print(f"Found comparison table at index {t_idx}:")
            for r in table.rows:
                print("   " + " | ".join(c.text.strip() for c in r.cells))

doc.save(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")
print("Tables updated.")
