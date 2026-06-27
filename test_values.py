import pandas as pd
import pickle

df  = pd.read_csv('dataset/wildfire.csv')
FEATURES = pickle.load(open('model/features.pkl', 'rb'))

# Drop what we engineered away
df['lat_bin'] = (df['lat'] // 10) * 10
df['lon_bin'] = (df['lon'] // 10) * 10

# Show 3 real examples — one fire, one no fire
fire    = df[df['occured'] == 1][FEATURES].iloc[0]
no_fire = df[df['occured'] == 0][FEATURES].iloc[0]

print("=== FIRE EXAMPLE (paste this into /docs) ===")
print(fire.to_dict())

print("\n=== NO FIRE EXAMPLE (paste this into /docs) ===")
print(no_fire.to_dict())