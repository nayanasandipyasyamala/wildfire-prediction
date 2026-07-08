from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import shap
import requests

# ── Load model and tools ──────────────────────────────────────────
model     = pickle.load(open('model/model.pkl', 'rb'))
scaler    = pickle.load(open('model/scaler.pkl', 'rb'))
FEATURES  = pickle.load(open('model/features.pkl', 'rb'))
explainer = shap.TreeExplainer(model)

app = FastAPI(title="Wildfire Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Risk label ────────────────────────────────────────────────────
def get_risk_label(prob: float):
    if prob < 0.25:   return "Low",      "#22c55e"
    elif prob < 0.50: return "Moderate", "#f59e0b"
    elif prob < 0.75: return "High",     "#f97316"
    else:             return "Extreme",  "#ef4444"

# ── Derive all ML features from just 5 simple weather inputs ──────
# User only knows temp, humidity, wind, cloud, location
# Everything else is calculated from these
def derive_features(temp: float, humidity: float, wind: float,
                    cloud: float, lat: float, lon: float):
    dewpoint   = temp - ((100 - humidity) / 5)
    solar_rad  = 300 * (1 - cloud / 100)
    evapo      = max(0, (temp * 0.1) - (humidity * 0.02))
    fwi        = max(0, (temp * 0.5) + (wind * 0.3) - (humidity * 0.2))
    temp_range = max(3.0, temp * 0.2)
    pressure   = max(870, 1013 - abs(lat) * 0.5)
    lat_bin    = (lat // 10) * 10
    lon_bin    = (lon // 10) * 10

    return {
        "fire_weather_index":       round(fwi, 4),
        "temp_mean":                round(temp, 4),
        "humidity_min":             round(humidity, 4),
        "wind_speed_max":           round(wind, 4),
        "solar_radiation_mean":     round(solar_rad, 4),
        "cloud_cover_mean":         round(cloud, 4),
        "dewpoint_mean":            round(dewpoint, 4),
        "evapotranspiration_total": round(evapo, 4),
        "pressure_mean":            round(pressure, 4),
        "temp_range":               round(temp_range, 4),
        "lat_bin":                  round(lat_bin, 4),
        "lon_bin":                  round(lon_bin, 4),
    }

# ── Geocode city → lat/lon ────────────────────────────────────────
def geocode_city(city: str):
    url  = "https://geocoding-api.open-meteo.com/v1/search"
    res  = requests.get(url, params={"name": city, "count": 1, "language": "en", "format": "json"})
    data = res.json()
    if not data.get("results"):
        return None
    r = data["results"][0]
    return {"name": r.get("name", city), "country": r.get("country", ""), "lat": r["latitude"], "lon": r["longitude"]}

# ── Fetch live weather from Open-Meteo (no API key needed) ────────
def fetch_weather(lat: float, lon: float):
    url    = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,cloud_cover,dew_point_2m",
        "daily":   "temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration",
        "timezone": "auto", "forecast_days": 1,
    }
    data     = requests.get(url, params=params).json()
    c        = data["current"]
    d        = data["daily"]
    temp     = c["temperature_2m"]
    humidity = c["relative_humidity_2m"]
    wind     = c["wind_speed_10m"]
    pressure = c["surface_pressure"]
    clouds   = c["cloud_cover"]
    dewpoint = c["dew_point_2m"]
    evapo    = d["et0_fao_evapotranspiration"][0]
    t_range  = d["temperature_2m_max"][0] - d["temperature_2m_min"][0]
    solar    = 300 * (1 - clouds / 100)
    fwi      = max(0, (temp * 0.5) + (wind * 0.3) - (humidity * 0.2))
    lat_bin  = (lat // 10) * 10
    lon_bin  = (lon // 10) * 10

    return {
        "features": {
            "fire_weather_index":       round(fwi, 4),
            "temp_mean":                round(temp, 4),
            "humidity_min":             round(float(humidity), 4),
            "wind_speed_max":           round(wind, 4),
            "solar_radiation_mean":     round(solar, 4),
            "cloud_cover_mean":         round(float(clouds), 4),
            "dewpoint_mean":            round(dewpoint, 4),
            "evapotranspiration_total": round(evapo, 4),
            "pressure_mean":            round(float(pressure), 4),
            "temp_range":               round(t_range, 4),
            "lat_bin":                  round(lat_bin, 4),
            "lon_bin":                  round(lon_bin, 4),
        },
        "display": {
            "temp": temp, "humidity": humidity, "wind": round(wind, 1),
            "pressure": round(float(pressure), 1), "clouds": clouds,
            "dewpoint": round(dewpoint, 1), "fwi": round(fwi, 2),
        }
    }

# ── Run prediction ────────────────────────────────────────────────
def run_prediction(features: dict):
    input_scaled = scaler.transform(np.array([[features[f] for f in FEATURES]]))
    prob         = model.predict_proba(input_scaled)[0][1]
    predicted    = int(model.predict(input_scaled)[0])
    risk_label, risk_color = get_risk_label(prob)
    shap_vals    = explainer.shap_values(input_scaled)[0]
    shap_list    = sorted([
        {"feature": f, "value": round(float(v), 4)}
        for f, v in zip(FEATURES, shap_vals)
    ], key=lambda x: abs(x["value"]), reverse=True)[:6]
    return {
        "fire_probability": round(float(prob) * 100, 1),
        "predicted":  predicted,
        "risk_label": risk_label,
        "risk_color": risk_color,
        "shap_values": shap_list,
    }

# ── ENDPOINT 1: City search → auto weather ────────────────────────
@app.get("/predict-city/{city}")
def predict_city(city: str):
    location = geocode_city(city)
    if not location:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    weather = fetch_weather(location["lat"], location["lon"])
    result  = run_prediction(weather["features"])
    result["weather"] = {**location, **weather["display"]}
    return result

# ── ENDPOINT 2: Simple manual — only 5 real inputs ────────────────
class SimpleInput(BaseModel):
    temp:     float   # temperature °C
    humidity: float   # humidity %
    wind:     float   # wind speed km/h
    cloud:    float   # cloud cover %
    lat:      float   # latitude (from GPS)
    lon:      float   # longitude (from GPS)

@app.post("/predict-simple")
def predict_simple(data: SimpleInput):
    features = derive_features(data.temp, data.humidity, data.wind, data.cloud, data.lat, data.lon)
    result   = run_prediction(features)
    result["weather"] = {
        "temp": data.temp, "humidity": data.humidity,
        "wind": data.wind, "clouds": data.cloud,
        "fwi":  features["fire_weather_index"],
        "dewpoint": features["dewpoint_mean"],
    }
    return result

# ── Health check ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Wildfire API is running ✓"}