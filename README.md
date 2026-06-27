# Wildfire Risk Prediction — Run Guide

## Folder structure
wildfire-project/
├── data/
│   └── wildfire.csv         ← PUT YOUR DOWNLOADED CSV HERE
├── model/                   ← auto-created when you run scripts
├── charts/                  ← auto-created when you run scripts
├── frontend/
│   └── App.jsx              ← copy into your React app's src/
├── 1_load_data.py
├── 2_eda.py
├── 3_features.py
├── 4_train_model.py
├── 5_shap.py
└── api.py

---

## Step 0 — Install libraries (one time only)
pip install pandas numpy matplotlib seaborn scikit-learn xgboost shap fastapi uvicorn pydantic

---

## Step 1 — Load and inspect the data
python 1_load_data.py
→ You should see: Shape (118858, 17), no missing values, 50/50 balance

## Step 2 — Explore the data (EDA)
python 2_eda.py
→ Charts saved to /charts folder. Open them to understand the data.

## Step 3 — Feature engineering
python 3_features.py
→ Creates data/clean_data.csv, model/scaler.pkl, model/features.pkl

## Step 4 — Train the model
python 4_train_model.py
→ Creates model/model.pkl. Should see F1 > 0.85 and AUC > 0.90

## Step 5 — SHAP explainability
python 5_shap.py
→ Creates charts/8_shap_summary.png and model/shap_summary.pkl

---

## Step 6 — Start the API (keep this terminal open)
uvicorn api:app --reload
→ Visit http://localhost:8000 — should say "Wildfire API is running ✓"
→ Visit http://localhost:8000/docs — interactive API docs (auto-generated!)

---

## Step 7 — Set up React frontend (open a NEW terminal)
npx create-react-app wildfire-frontend
cd wildfire-frontend
npm install recharts
npm install -D tailwindcss
npx tailwindcss init

Copy App.jsx from frontend/App.jsx into wildfire-frontend/src/App.jsx
Then run:
npm start
→ Visit http://localhost:3000 — your dashboard is live!

---

## How it all connects
Your browser (React) → sends weather inputs → FastAPI (api.py) →
loads model.pkl → predicts → sends back risk score + SHAP values →
React shows result on dashboard
