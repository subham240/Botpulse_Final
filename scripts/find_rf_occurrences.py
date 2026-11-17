import docx

doc = docx.Document(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")

print("=== Paragraph occurrences of 'Random Forest' ===")
for i, p in enumerate(doc.paragraphs):
    if "Random Forest" in p.text:
        print(f"P{i}: {p.text}")

print("\n=== Table occurrences of 'Random Forest' ===")
for t_idx, table in enumerate(doc.tables):
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            if "Random Forest" in cell.text:
                print(f"Table {t_idx}, Row {r_idx}, Col {c_idx}: {cell.text.strip()}")
