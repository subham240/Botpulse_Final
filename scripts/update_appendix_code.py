import docx

doc = docx.Document(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")

p729_content = """Source: backend/ml/lstm_detector.py & backend/ml/train_lstm.py

class BiLSTMBehavioralClassifier(nn.Module):
    def __init__(self, input_dim: int = 9, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
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
        out, _ = self.lstm(x)
        pooled = torch.mean(out, dim=1) # Temporal average pooling
        logits = self.classifier(pooled)
        return logits.squeeze(-1)

# Kinematic Features (9-dim): [dx, dy, dt, dist, speed, accel, angle, d_angle, jerk]
# Weights saved to: backend/models/lstm.pt (Evaluated at 99.91% Accuracy, 0.25 ms latency)"""

doc.paragraphs[729].text = p729_content
doc.save(r"C:\Users\lenovo\Downloads\BotPulse_Project_Report_Updated_LSTM.docx")
print("Appendix code updated.")
