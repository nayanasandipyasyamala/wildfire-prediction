import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FIELD_LABELS = {
  fire_weather_index:       "Fire Weather Index",
  temp_mean:                "Temperature Mean (°C)",
  humidity_min:             "Humidity Min (%)",
  wind_speed_max:           "Wind Speed Max (km/h)",
  solar_radiation_mean:     "Solar Radiation Mean",
  cloud_cover_mean:         "Cloud Cover Mean (%)",
  dewpoint_mean:            "Dew Point Mean (°C)",
  evapotranspiration_total: "Evapotranspiration Total",
  pressure_mean:            "Pressure Mean (hPa)",
  temp_range:               "Temperature Range",
  lat_bin:                  "Latitude (grid)",
  lon_bin:                  "Longitude (grid)",
};

const DEFAULT_MANUAL = {
  fire_weather_index: 14.5, temp_mean: 28.0, humidity_min: 20.0,
  wind_speed_max: 18.0, solar_radiation_mean: 260.0, cloud_cover_mean: 15.0,
  dewpoint_mean: 8.0, evapotranspiration_total: 6.0, pressure_mean: 950.0,
  temp_range: 13.0, lat_bin: 10.0, lon_bin: 20.0,
};

export default function App() {
  const [mode,    setMode]    = useState("city");   // "city" | "manual"
  const [city,    setCity]    = useState("");
  const [form,    setForm]    = useState(DEFAULT_MANUAL);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const getRiskBg = (label) => ({
    Low:     "bg-green-100 text-green-700 border-green-200",
    Moderate:"bg-yellow-100 text-yellow-700 border-yellow-200",
    High:    "bg-orange-100 text-orange-700 border-orange-200",
    Extreme: "bg-red-100 text-red-700 border-red-200",
  }[label] || "bg-gray-100 text-gray-700");

  const getRiskEmoji = (label) => ({
    Low:"🟢", Moderate:"🟡", High:"🟠", Extreme:"🔴"
  }[label] || "⚪");

  // ── City prediction ─────────────────────────────────────────────
  const handleCityPredict = async () => {
    if (!city.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(
        `http://localhost:8000/predict-city/${encodeURIComponent(city.trim())}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "City not found");
      }
      setResult({ ...(await res.json()), mode: "city" });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // ── Manual prediction ───────────────────────────────────────────
  const handleManualPredict = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("http://localhost:8000/predict-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setResult({ ...(await res.json()), mode: "manual" });
    } catch (e) {
      setError("Cannot connect to API. Make sure api.py is running.");
    }
    setLoading(false);
  };

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: parseFloat(value) }));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Wildfire Risk Prediction</h1>
            <p className="text-xs text-gray-400">Powered by XGBoost + Live Weather Data</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode("city"); setResult(null); setError(null); }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === "city"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            🌍 Search by City
          </button>
          <button
            onClick={() => { setMode("manual"); setResult(null); setError(null); }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === "manual"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            ✏️ Enter Manually
          </button>
        </div>

        {/* City mode */}
        {mode === "city" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-3">
              Type any city name — live weather is fetched automatically
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCityPredict()}
                placeholder="e.g. Mumbai, Sydney, Cape Town, California..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3
                           text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleCityPredict}
                disabled={loading || !city.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium
                           px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Fetching..." : "Check Risk"}
              </button>
            </div>
            {error && (
              <div className="mt-3">
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 border border-red-100 mb-2">
                  ⚠️ {error} — city not recognised
                </p>
                <p className="text-sm text-gray-500">
                  Can't find your location?{" "}
                  <button
                    onClick={() => { setMode("manual"); setError(null); }}
                    className="text-orange-500 underline font-medium"
                  >
                    Enter weather manually instead →
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-4">
              Enter weather conditions for your location manually
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(DEFAULT_MANUAL).map((key) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {FIELD_LABELS[key]}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2
                               text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleManualPredict}
              disabled={loading}
              className="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white
                         font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Predicting..." : "Predict Fire Risk"}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                ⚠️ {error}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Risk card */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {result.mode === "city" && result.weather ? (
                      <>
                        <p className="text-sm text-gray-400">Current risk in</p>
                        <h2 className="text-2xl font-semibold text-gray-900">
                          {result.weather.city}, {result.weather.country}
                        </h2>
                      </>
                    ) : (
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Manual Prediction
                      </h2>
                    )}
                  </div>
                  <span className="text-5xl">{getRiskEmoji(result.risk_label)}</span>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full
                                border text-sm font-semibold mb-4 ${getRiskBg(result.risk_label)}`}>
                  {result.risk_label} Risk
                </div>

                <div className="text-6xl font-bold text-gray-900 mb-1">
                  {result.fire_probability}%
                </div>
                <p className="text-sm text-gray-400 mb-4">probability of fire occurrence</p>

                <div className="bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result.fire_probability}%`, backgroundColor: result.risk_color }}
                  />
                </div>
              </div>

              {/* Weather used — city mode only */}
              {result.mode === "city" && result.weather && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Live Weather Used
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Temperature",        value: `${result.weather.temp}°C`,      icon: "🌡️" },
                      { label: "Humidity",            value: `${result.weather.humidity}%`,   icon: "💧" },
                      { label: "Wind Speed",          value: `${result.weather.wind} km/h`,   icon: "💨" },
                      { label: "Pressure",            value: `${result.weather.pressure} hPa`,icon: "🔵" },
                      { label: "Cloud Cover",         value: `${result.weather.clouds}%`,     icon: "☁️" },
                      { label: "Fire Weather Index",  value: result.weather.fwi,              icon: "🔥" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-gray-400">{item.icon} {item.label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SHAP chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Why this prediction?</h3>
              <p className="text-xs text-gray-400 mb-6">
                Red = increases fire risk · Green = decreases fire risk
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={result.shap_values} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={170} />
                  <Tooltip formatter={(v) => v.toFixed(4)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {result.shap_values.map((entry, i) => (
                      <Cell key={i} fill={entry.value > 0 ? "#ef4444" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Top factor</p>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{result.shap_values[0]?.feature}</span>{" "}
                  is the biggest driver
                  {result.shap_values[0]?.value > 0 ? " — pushing risk higher 🔺" : " — pushing risk lower 🔻"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-20 text-gray-300">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-lg">Search a city or enter values manually</p>
            <p className="text-sm mt-2">Try: Mumbai · Sydney · Cape Town · Amazon</p>
          </div>
        )}
      </div>
    </div>
  );
}