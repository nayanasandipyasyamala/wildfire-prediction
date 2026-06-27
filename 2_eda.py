import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

os.makedirs('charts', exist_ok=True)

df = pd.read_csv('dataset/wildfire.csv')

print("Starting EDA — charts will be saved to /charts folder\n")

# ── 1. Target balance ─────────────────────────────────────────────
plt.figure(figsize=(6, 4))
df['occured'].value_counts().plot(kind='bar', color=['#378ADD', '#D85A30'], edgecolor='none')
plt.xticks([0, 1], ['No Fire', 'Fire'], rotation=0)
plt.title('Fire Occurrence Balance')
plt.ylabel('Count')
plt.tight_layout()
plt.savefig('charts/1_target_balance.png', dpi=150)
plt.close()
print("✓ Saved: 1_target_balance.png")

# ── 2. Feature distributions ──────────────────────────────────────
features = [
    'temp_mean', 'humidity_min', 'wind_speed_max',
    'fire_weather_index', 'solar_radiation_mean',
    'cloud_cover_mean', 'dewpoint_mean', 'evapotranspiration_total'
]

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for i, feat in enumerate(features):
    axes[i].hist(df[feat], bins=40, color='#378ADD', edgecolor='none', alpha=0.8)
    axes[i].set_title(feat, fontsize=10)
    axes[i].set_ylabel('Count')

plt.suptitle('Feature Distributions', fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig('charts/2_distributions.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ Saved: 2_distributions.png")

# ── 3. Feature vs fire occurrence (boxplots) ──────────────────────
fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for i, feat in enumerate(features):
    fire = df[df['occured'] == 1][feat]
    no_fire = df[df['occured'] == 0][feat]
    axes[i].boxplot([no_fire, fire], labels=['No Fire', 'Fire'])
    axes[i].set_title(feat, fontsize=10)

plt.suptitle('Feature Values: Fire vs No Fire', fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig('charts/3_fire_vs_nofire.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ Saved: 3_fire_vs_nofire.png")

# ── 4. Correlation heatmap ────────────────────────────────────────
plt.figure(figsize=(12, 10))
corr = df[features + ['fire_weather_index', 'frp', 'occured']].corr()
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm',
            center=0, square=True, linewidths=0.5)
plt.title('Feature Correlation Heatmap')
plt.tight_layout()
plt.savefig('charts/4_correlation.png', dpi=150)
plt.close()
print("✓ Saved: 4_correlation.png")

# ── 5. FRP distribution (fire intensity) ─────────────────────────
plt.figure(figsize=(8, 4))
fire_only = df[df['frp'] > 0]['frp']
plt.hist(fire_only, bins=50, color='#D85A30', edgecolor='none', alpha=0.8)
plt.title('FRP Distribution (fire intensity — fire events only)')
plt.xlabel('FRP value')
plt.ylabel('Count')
plt.tight_layout()
plt.savefig('charts/5_frp_distribution.png', dpi=150)
plt.close()
print("✓ Saved: 5_frp_distribution.png")

# ── Print key insights ────────────────────────────────────────────
print("\n" + "=" * 50)
print("KEY INSIGHTS")
print("=" * 50)

corr_with_target = df[features + ['occured']].corr()['occured'].drop('occured')
print("\nTop features correlated with fire occurrence:")
print(corr_with_target.abs().sort_values(ascending=False))

print("\nMean values — Fire vs No Fire:")
print(df.groupby('occured')[features[:4]].mean().round(2))
print("\nAll charts saved to /charts folder ✓")
