# 🔥 Wildfire Risk Prediction System

A machine learning application that predicts wildfire risk using weather and environmental data. Features an XGBoost model with SHAP explainability, a FastAPI backend, and a React frontend dashboard.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Model Performance](#model-performance)

---

## 🎯 Overview

This project predicts wildfire risk based on meteorological and geographic factors. It provides:

- **Data Processing Pipeline**: Load, clean, and explore wildfire datasets
- **ML Model**: XGBoost classifier with >0.85 F1-score
- **Explainability**: SHAP values for model interpretability
- **REST API**: FastAPI backend for predictions
- **Interactive Dashboard**: React frontend for risk assessment

---

## ✨ Features

- ✅ **Automated Data Pipeline**: End-to-end data loading → EDA → feature engineering → model training
- ✅ **High Performance Model**: XGBoost with F1-score > 0.85, AUC > 0.90
- ✅ **Feature Engineering**: Automatic derivation of 20+ features from 5 simple inputs
- ✅ **Model Explainability**: SHAP summary plots for understanding predictions
- ✅ **REST API**: Fast, scalable predictions with interactive documentation
- ✅ **Risk Classification**: 4-tier risk levels (Low, Moderate, High, Extreme)
- ✅ **CORS Enabled**: Frontend integration ready
- ✅ **Cross-platform**: Works on Windows, macOS, Linux

---

## 🛠️ Tech Stack

### Backend

- **Python 3.8+**
- **FastAPI** - Web framework
- **XGBoost** - ML model
- **SHAP** - Model explainability
- **Scikit-learn** - Preprocessing & metrics
- **Pandas/NumPy** - Data processing

### Frontend

- **React 18+**
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

---

## 📁 Project Structure

```
wildfire-prediction/
├── dataset/
│   ├── wildfire.csv              # Original dataset
│   └── clean_data.csv            # Processed data (auto-generated)
├── model/
│   ├── model.pkl                 # Trained XGBoost model
│   ├── scaler.pkl                # Feature scaler
│   └── features.pkl              # Feature names list
├── charts/
│   ├── *.png                     # EDA visualizations
│   └── 8_shap_summary.png        # SHAP explainability plot
├── wildfire-frontend/            # React app
│   ├── src/
│   │   ├── App.js
│   │   ├── App.jsx
│   │   └── ...
│   └── package.json
├── 1_load_data.py                # Data loading & validation
├── 2_eda.py                      # Exploratory data analysis
├── 3_features.py                 # Feature engineering
├── 4_train_model.py              # Model training
├── 5_shap.py                     # SHAP analysis
├── api.py                        # FastAPI server
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 14+ (for frontend)
- pip or conda

### Backend Setup

1. **Clone and navigate to project:**

   ```bash
   cd c:\wildfire_predcetion
   ```

2. **Create virtual environment (recommended):**

   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or: source venv/bin/activate  # macOS/Linux
   ```

3. **Install Python dependencies:**
   ```bash
   pip install pandas numpy matplotlib seaborn scikit-learn xgboost shap fastapi uvicorn pydantic
   ```

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd wildfire-frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

---

## 📖 Usage

### Quick Start (Complete Pipeline)

Run the full ML pipeline in sequence:

```bash
# Step 1: Load and validate data
python 1_load_data.py
# Output: Data shape, missing values check, class balance

# Step 2: Exploratory Data Analysis
python 2_eda.py
# Output: Charts saved to /charts folder

# Step 3: Feature Engineering
python 3_features.py
# Output: clean_data.csv, scaler.pkl, features.pkl

# Step 4: Train Model
python 4_train_model.py
# Output: model.pkl with F1 > 0.85, AUC > 0.90

# Step 5: Generate SHAP Explanations
python 5_shap.py
# Output: SHAP summary plot to /charts
```

### Running the API

**Terminal 1 - Start the backend:**

```bash
uvicorn api:app --reload
```

- API runs at: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**Terminal 2 - Start the frontend:**

```bash
cd wildfire-frontend
npm start
```

- Frontend runs at: http://localhost:3000

---

## 🔌 API Documentation

### Base URL

```
http://localhost:8000
```

### Health Check

```http
GET /
```

Response: `"Wildfire API is running ✓"`

### Predict Risk

```http
POST /predict
Content-Type: application/json

{
  "temp": 25.5,
  "humidity": 60.0,
  "wind": 12.0,
  "cloud": 30.0,
  "lat": 40.7128,
  "lon": -74.0060
}
```

**Response:**

```json
{
  "risk_probability": 0.72,
  "risk_label": "High",
  "risk_color": "#f97316",
  "feature_values": {
    "fire_weather_index": 8.5,
    "temp_mean": 25.5,
    "humidity_min": 60.0,
    "wind_speed_max": 12.0,
    "solar_radiation_mean": 210.0,
    ...
  }
}
```

### Interactive API Docs

Visit http://localhost:8000/docs for Swagger UI - test endpoints directly in your browser.

---

## 📊 Model Performance

The trained model achieves:

| Metric        | Score  |
| ------------- | ------ |
| **F1-Score**  | > 0.85 |
| **AUC-ROC**   | > 0.90 |
| **Accuracy**  | > 0.84 |
| **Precision** | > 0.80 |

### Risk Classification Thresholds

| Risk Level  | Probability |
| ----------- | ----------- |
| 🟢 Low      | < 25%       |
| 🟡 Moderate | 25% - 50%   |
| 🟠 High     | 50% - 75%   |
| 🔴 Extreme  | ≥ 75%       |

---

## 🔍 Model Explainability

SHAP (SHapley Additive exPlanations) values explain which features most influence each prediction:

```bash
python 5_shap.py
# View: charts/8_shap_summary.png
```

Top influencing features:

1. Fire Weather Index
2. Temperature Mean
3. Wind Speed Max
4. Solar Radiation
5. Humidity Min

---

## 📝 Input Features

The API accepts just 5 simple inputs; the system derives all other features:

| Input        | Range        | Description       |
| ------------ | ------------ | ----------------- |
| **temp**     | -20 to 50 °C | Mean temperature  |
| **humidity** | 0 to 100 %   | Relative humidity |
| **wind**     | 0 to 50 km/h | Max wind speed    |
| **cloud**    | 0 to 100 %   | Cloud coverage    |
| **lat**      | -90 to 90    | Latitude          |
| **lon**      | -180 to 180  | Longitude         |

---

## � Troubleshooting

### Model files not found

```
Error: FileNotFoundError: model/model.pkl
```

**Solution:** Run the complete pipeline: `python 4_train_model.py`

### CORS errors

```
Error: CORS policy blocked
```

**Solution:** Ensure frontend is on `http://localhost:3000`. Check `api.py` CORS settings.

### API won't start

```
Error: Address already in use
```

**Solution:** Kill process on port 8000 or use a different port:

```bash
uvicorn api:app --port 8001
```

---

## 📈 Next Steps

- Add more weather variables to improve model
- Deploy to cloud (AWS, GCP, Azure)
- Add real-time data integration
- Implement model retraining pipeline
- Add user authentication
- Create alerts system for extreme risk

---

## 📄 License

This project is provided as-is for educational and research purposes.

---

## 📧 Support

For issues or questions, please open an issue in the repository.

**Last Updated**: 2024

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
