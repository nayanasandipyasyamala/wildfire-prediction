import pandas as pd

# ── Load the dataset ──────────────────────────────────────────────
# Put your downloaded CSV inside the 'data' folder
df = pd.read_csv('dataset/wildfire.csv')

# ── Basic info ────────────────────────────────────────────────────
print("=" * 50)
print("SHAPE  →  rows:", df.shape[0], " | columns:", df.shape[1])
print("=" * 50)

print("\nCOLUMN NAMES:")
for col in df.columns:
    print(" -", col)

print("\nDATA TYPES:")
print(df.dtypes)

print("\nFIRST 5 ROWS:")
print(df.head())

print("\nMISSING VALUES:")
missing = df.isnull().sum()
print(missing[missing > 0] if missing.sum() > 0 else "  No missing values ✓")

print("\nBASIC STATS:")
print(df.describe())

print("\nTARGET COLUMN  →  occured")
print(df['occured'].value_counts())
print("\n0 = No fire  |  1 = Fire occurred")
print("Balance:", round(df['occured'].mean() * 100, 2), "% fires")
