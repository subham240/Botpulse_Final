import docx

doc = docx.Document(r'C:\Users\lenovo\Downloads\BotPulse_Project_Report (1).docx')
for i, p in enumerate(doc.paragraphs):
    for r in p.runs:
        if 'graphic' in r._r.xml:
            print(f'P{i} has graphic. Next 2 paragraphs:')
            for j in range(i+1, min(i+4, len(doc.paragraphs))):
                print(f'   P{j}: {doc.paragraphs[j].text}')
