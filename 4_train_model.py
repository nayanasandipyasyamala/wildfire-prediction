import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, f1_score
)
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import os

os.makedirs('model', exist_ok=True)
os.makedirs('charts', exist_ok=True)

# ── Load clean data ───────────────────────────────────────────────
df = pd.read_csv('dataset/clean_data.csv')

FEATURES = pickle.load(open('model/features.pkl', 'rb'))

X = df[FEATURES]
y = df['occured']   # Binary: 0 = no fire, 1 = fire

# ── Train / test split ────────────────────────────────────────────
# 80% train, 20% test — stratify keeps same fire ratio in both splits
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training samples :", len(X_train))
print("Testing samples  :", len(X_test))

# ── Train XGBoost ─────────────────────────────────────────────────
# XGBoost is a gradient boosting model — builds many small decision
# trees and combines them to get very accurate predictions
print("\nTraining XGBoost model...")

model = XGBClassifier(
    n_estimators=200,      # 200 trees
    max_depth=6,           # each tree up to 6 levels deep
    learning_rate=0.1,     # how fast it learns
    subsample=0.8,         # use 80% of rows per tree (reduces overfitting)
    colsample_bytree=0.8,  # use 80% of features per tree
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42
)

model.fit(X_train, y_train)
print("Training complete ✓")

# ── Evaluate ──────────────────────────────────────────────────────
y_pred      = model.predict(X_test)
y_pred_prob = model.predict_proba(X_test)[:, 1]

print("\n" + "=" * 50)
print("MODEL PERFORMANCE")
print("=" * 50)
print(classification_report(y_test, y_pred, target_names=['No Fire', 'Fire']))

f1  = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_pred_prob)
print(f"F1 Score  : {f1:.4f}")
print(f"AUC-ROC   : {auc:.4f}")

# ── Confusion matrix chart ────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['No Fire', 'Fire'],
            yticklabels=['No Fire', 'Fire'])
plt.title('Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('charts/6_confusion_matrix.png', dpi=150)
plt.close()
print("\n✓ Saved: 6_confusion_matrix.png")

# ── Feature importance chart ──────────────────────────────────────
importance = pd.Series(model.feature_importances_, index=FEATURES)
importance = importance.sort_values(ascending=True)

plt.figure(figsize=(8, 6))
importance.plot(kind='barh', color='#378ADD', edgecolor='none')
plt.title('Feature Importance (XGBoost)')
plt.xlabel('Importance score')
plt.tight_layout()
plt.savefig('charts/7_feature_importance.png', dpi=150)
plt.close()
print("✓ Saved: 7_feature_importance.png")

# ── Save the trained model ────────────────────────────────────────
pickle.dump(model, open('model/model.pkl', 'wb'))
print("\n✓ Saved: model/model.pkl")

print("\nTop 5 most important features:")
print(importance.tail(5).iloc[::-1])
print("\nModel training complete ✓")
