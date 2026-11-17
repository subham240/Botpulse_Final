import os
import numpy as np
import matplotlib.pyplot as plt

# Output directories
REPORT_IMG_DIR = r"C:\Users\lenovo\Downloads\Final_Minor_Project\report_images"
ARTIFACT_DIR = r"C:\Users\lenovo\.gemini\antigravity\brain\f0a6f58d-eb0b-4435-8c34-0b7f30b7536d"
os.makedirs(REPORT_IMG_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# -------------------------------------------------------------------------
# Figure 7.1: Model Performance Comparison (XGBoost vs. Bi-LSTM)
# -------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)

metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
xgboost_scores = [92.65, 86.81, 94.21, 89.71, 98.88]
bilstm_scores = [99.91, 100.0, 99.88, 99.94, 100.0]

x = np.arange(len(metrics))
width = 0.35

# High-contrast, clean academic palette
color_xgb = '#2563EB'   # Royal Blue
color_bilstm = '#7C3AED' # Modern Violet / Purple

rects1 = ax.bar(x - width/2, xgboost_scores, width, label='XGBoost (Layer 1 - Tabular Features)', 
                color=color_xgb, edgecolor='#1E40AF', linewidth=1.2, zorder=3)
rects2 = ax.bar(x + width/2, bilstm_scores, width, label='Bi-LSTM (Layer 2 - Sequential Trajectories)', 
                color=color_bilstm, edgecolor='#5B21B6', linewidth=1.2, zorder=3)

# Formatting
ax.set_ylabel('Score (%)', fontsize=12, fontweight='bold', color='#1F2937')
ax.set_title('Empirical Model Performance: XGBoost vs. Bi-LSTM Sequencer', 
             fontsize=14, fontweight='bold', pad=18, color='#111827')
ax.set_xticks(x)
ax.set_xticklabels(metrics, fontsize=11, fontweight='semibold', color='#374151')
ax.set_ylim(80, 105)
ax.grid(axis='y', linestyle='--', alpha=0.6, zorder=0, color='#D1D5DB')
ax.set_facecolor('#F9FAFB')
fig.patch.set_facecolor('#FFFFFF')

# Add values above bars
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(f'{height:.2f}%',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 4),  # 4 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9.5, fontweight='bold', color='#1F2937')

autolabel(rects1)
autolabel(rects2)

ax.legend(loc='lower right', frameon=True, facecolor='#FFFFFF', edgecolor='#E5E7EB', fontsize=10.5)

# Border cleanup
for spine in ax.spines.values():
    spine.set_color('#E5E7EB')
    spine.set_linewidth(1.2)

plt.tight_layout()

# Save Fig 7.1
fig71_path1 = os.path.join(REPORT_IMG_DIR, "fig_7_4.png")
fig71_path2 = os.path.join(REPORT_IMG_DIR, "fig_7_1_model_comparison_xgboost_vs_bilstm.png")
fig71_art = os.path.join(ARTIFACT_DIR, "fig_7_1_model_comparison_xgboost_vs_bilstm.png")

fig.savefig(fig71_path1, dpi=300, bbox_inches='tight')
fig.savefig(fig71_path2, dpi=300, bbox_inches='tight')
fig.savefig(fig71_art, dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved Figure 7.1 successfully.")

# -------------------------------------------------------------------------
# Figure 7.2: Inference Latency Comparison (XGBoost vs. Bi-LSTM)
# -------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(8.5, 5.2), dpi=300)

# Subplot 1: Mean Inference Latency
models = ['XGBoost (Layer 1)', 'Bi-LSTM (Layer 2)']
mean_latencies = [1.73, 0.25]
colors = [color_xgb, color_bilstm]

bars1 = ax1.bar(models, mean_latencies, color=colors, width=0.45, edgecolor=['#1E40AF', '#5B21B6'], linewidth=1.2, zorder=3)
ax1.set_ylabel('Inference Latency (ms)', fontsize=11, fontweight='bold', color='#1F2937')
ax1.set_title('Mean Single-Inference Latency', fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_ylim(0, 2.2)
ax1.grid(axis='y', linestyle='--', alpha=0.6, zorder=0, color='#D1D5DB')
ax1.set_facecolor('#F9FAFB')

for rect in bars1:
    h = rect.get_height()
    ax1.annotate(f'{h:.2f} ms',
                 xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 4),
                 textcoords="offset points",
                 ha='center', va='bottom', fontsize=10, fontweight='bold', color='#111827')

# Subplot 2: XGBoost Latency Percentiles vs Bi-LSTM
xgb_metrics = ['XGBoost\n(Mean)', 'XGBoost\n(P95 Tail)', 'Bi-LSTM\n(Mean Window)']
latency_vals = [1.73, 2.27, 0.25]
colors2 = ['#3B82F6', '#1D4ED8', '#7C3AED']

bars2 = ax2.bar(xgb_metrics, latency_vals, color=colors2, width=0.5, edgecolor=['#1E40AF', '#172554', '#5B21B6'], linewidth=1.2, zorder=3)
ax2.set_ylabel('Latency (ms)', fontsize=11, fontweight='bold', color='#1F2937')
ax2.set_title('Latency Profile & Tail Latency', fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_ylim(0, 2.8)
ax2.grid(axis='y', linestyle='--', alpha=0.6, zorder=0, color='#D1D5DB')
ax2.set_facecolor('#F9FAFB')

for rect in bars2:
    h = rect.get_height()
    ax2.annotate(f'{h:.2f} ms',
                 xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 4),
                 textcoords="offset points",
                 ha='center', va='bottom', fontsize=10, fontweight='bold', color='#111827')

# Add real-time threshold line across both
for ax in (ax1, ax2):
    ax.tick_params(axis='x', labelsize=10)
    for spine in ax.spines.values():
        spine.set_color('#E5E7EB')
        spine.set_linewidth(1.2)

fig.suptitle('BotPulse Model Inference Latency Benchmark (Real-Time Budget < 50ms)', 
             fontsize=13, fontweight='bold', y=0.98, color='#111827')
fig.patch.set_facecolor('#FFFFFF')

plt.tight_layout()

# Save Fig 7.2
fig72_path1 = os.path.join(REPORT_IMG_DIR, "fig_7_7.png")
fig72_path2 = os.path.join(REPORT_IMG_DIR, "fig_7_2_latency_comparison_xgboost_vs_bilstm.png")
fig72_art = os.path.join(ARTIFACT_DIR, "fig_7_2_latency_comparison_xgboost_vs_bilstm.png")

fig.savefig(fig72_path1, dpi=300, bbox_inches='tight')
fig.savefig(fig72_path2, dpi=300, bbox_inches='tight')
fig.savefig(fig72_art, dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved Figure 7.2 successfully.")
