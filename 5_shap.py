import pandas as pd
import pickle
import shap
import matplotlib.pyplot as plt
import os

os.makedirs('charts', exist_ok=True)

# ── Load model and data ───────────────────────────────────────────
model    = pickle.load(open('model/model.pkl', 'rb'))
FEATURES = pickle.load(open('model/features.pkl', 'rb'))

df = pd.read_csv('dataset/clean_data.csv')
X  = df[FEATURES]

# Use a sample of 500 rows — SHAP on full 118k rows is slow
X_sample = X.sample(500, random_state=42)

print("Calculating SHAP values (this takes ~30 seconds)...")

# ── SHAP explainer ────────────────────────────────────────────────
# TreeExplainer is built for tree-based models like XGBoost
# It calculates how much each feature PUSHED the prediction up or down
explainer   = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_sample)

# ── 1. Summary plot — which features matter most overall ──────────
plt.figure()
shap.summary_plot(shap_values, X_sample, show=False)
plt.title('SHAP Summary — Feature Impact on Predictions')
plt.tight_layout()
plt.savefig('charts/8_shap_summary.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ Saved: 8_shap_summary.png")

# ── 2. Bar plot — average absolute SHAP values ────────────────────
plt.figure()
shap.summary_plot(shap_values, X_sample, plot_type='bar', show=False)
plt.title('SHAP Feature Importance (mean |SHAP|)')
plt.tight_layout()
plt.savefig('charts/9_shap_importance.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ Saved: 9_shap_importance.png")

# ── 3. Single prediction explanation ─────────────────────────────
# Pick one sample and explain why the model predicted what it did
sample_idx  = 0
sample_row  = X_sample.iloc[[sample_idx]]
sample_pred = model.predict(sample_row)[0]
sample_prob = model.predict_proba(sample_row)[0][1]

print(f"\nSingle prediction example:")
print(f"  Predicted: {'FIRE' if sample_pred == 1 else 'NO FIRE'}")
print(f"  Probability of fire: {sample_prob:.2%}")

print("\nTop features driving this prediction:")
shap_row = shap_values[sample_idx]
feature_shap = sorted(zip(FEATURES, shap_row), key=lambda x: abs(x[1]), reverse=True)
for feat, val in feature_shap[:5]:
    direction = "↑ increases fire risk" if val > 0 else "↓ decreases fire risk"
    print(f"  {feat}: {val:+.4f}  {direction}")

# ── Save SHAP values for API use ──────────────────────────────────
import numpy as np
shap_dict = {
    'feature_names': FEATURES,
    'mean_abs_shap': list(np.abs(shap_values).mean(axis=0))
}
pickle.dump(shap_dict, open('model/shap_summary.pkl', 'wb'))
print("\n✓ Saved: model/shap_summary.pkl")
print("\nSHAP analysis complete ✓")
