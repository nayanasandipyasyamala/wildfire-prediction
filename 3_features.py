import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle
import os

os.makedirs('model', exist_ok=True)

df = pd.read_csv('dataset/wildfire.csv')
print("Raw data shape:", df.shape)

# ── 1. Drop low-value columns ─────────────────────────────────────
# daynight_N → 75% are 0, low signal
# wind_direction columns → less relevant for risk prediction
drop_cols = ['daynight_N', 'wind_direction_mean', 'wind_direction_std']
df = df.drop(columns=drop_cols)
print("After dropping weak columns:", df.shape)

# ── 2. Engineer risk_level from frp ───────────────────────────────
# FRP = Fire Radiative Power (fire intensity from satellite)
# We turn this continuous value into a 4-class risk label
def get_risk_level(frp):
    if frp == 0:
        return 0   # No fire
    elif frp < 20:
        return 1   # Low
    elif frp < 100:
        return 2   # Medium
    else:
        return 3   # High / Extreme

df['risk_level'] = df['frp'].apply(get_risk_level)

print("\nRisk level distribution:")
labels = {0: 'No fire', 1: 'Low', 2: 'Medium', 3: 'High/Extreme'}
for k, v in labels.items():
    count = (df['risk_level'] == k).sum()
    pct = round(count / len(df) * 100, 1)
    print(f"  {v}: {count} ({pct}%)")

# ── 3. Bin lat/lon into region clusters ───────────────────────────
# Exact coordinates are too noisy — bin into 10-degree grids
df['lat_bin'] = (df['lat'] // 10) * 10
df['lon_bin'] = (df['lon'] // 10) * 10
df = df.drop(columns=['lat', 'lon'])
print("\nLat/lon binned into 10° grids ✓")

# ── 4. Define features and targets ───────────────────────────────
FEATURES = [
    'fire_weather_index',
    'temp_mean',
    'humidity_min',
    'wind_speed_max',
    'solar_radiation_mean',
    'cloud_cover_mean',
    'dewpoint_mean',
    'evapotranspiration_total',
    'pressure_mean',
    'temp_range',
    'lat_bin',
    'lon_bin'
]

X = df[FEATURES]
y_binary = df['occured']       # 0 or 1  → fire yes/no
y_multi  = df['risk_level']    # 0,1,2,3 → risk level

# ── 5. Scale features ─────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=FEATURES)

print("\nFeatures scaled with StandardScaler ✓")
print("Feature means after scaling (should be ~0):")
print(X_scaled.mean().round(4))

# ── 6. Save everything ───────────────────────────────────────────
X_scaled['occured']    = y_binary.values
X_scaled['risk_level'] = y_multi.values

X_scaled.to_csv('dataset/clean_data.csv', index=False)
pickle.dump(scaler, open('model/scaler.pkl', 'wb'))
pickle.dump(FEATURES, open('model/features.pkl', 'wb'))

print("\nSaved:")
print("  → dataset/clean_data.csv  (scaled features + targets)")
print("  → model/scaler.pkl     (scaler for API use later)")
print("  → model/features.pkl   (feature list for API use later)")
print("\nClean data shape:", X_scaled.shape)
print("\nFeature engineering complete ✓")
