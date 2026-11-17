import zipfile
import shutil

src_docx = r"C:\Users\lenovo\Downloads\BotPulse_Project_Report (1).docx"
target_docx = r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx"

new_fig_7_4 = r"C:\Users\lenovo\Downloads\Final_Minor_Project\report_images\fig_7_4.png"
new_fig_7_7 = r"C:\Users\lenovo\Downloads\Final_Minor_Project\report_images\fig_7_7.png"

with zipfile.ZipFile(src_docx, 'r') as zin:
    with zipfile.ZipFile(target_docx, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == 'word/media/bp_fig_7_4.png':
                with open(new_fig_7_4, 'rb') as f:
                    zout.writestr(item, f.read())
                print("Replaced word/media/bp_fig_7_4.png")
            elif item.filename == 'word/media/bp_fig_7_7.png':
                with open(new_fig_7_7, 'rb') as f:
                    zout.writestr(item, f.read())
                print("Replaced word/media/bp_fig_7_7.png")
            else:
                zout.writestr(item, zin.read(item.filename))

print("Created updated docx archive.")
