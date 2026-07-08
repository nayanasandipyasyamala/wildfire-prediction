import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function App() {
  const [mode,    setMode]    = useState("city");
  const [city,    setCity]    = useState("");
  const [form,    setForm]    = useState({ temp: 28, humidity: 40, wind: 18, cloud: 15 });
  const [locMsg,  setLocMsg]  = useState("Click to use your current location");
  const [coords,  setCoords]  = useState({ lat: 20, lon: 78 });  // default: India center
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Get browser GPS ────────────────────────────────────────────
  const getLocation = () => {
    setLocMsg("Detecting...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocMsg(`📍 ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
      },
      () => setLocMsg("Could not detect — using default location")
    );
  };

  const getRiskBg = (label) => ({
    Low:     "bg-green-100  text-green-700  border-green-200",
    Moderate:"bg-yellow-100 text-yellow-700 border-yellow-200",
    High:    "bg-orange-100 text-orange-700 border-orange-200",
    Extreme: "bg-red-100    text-red-700    border-red-200",
  }[label] || "bg-gray-100 text-gray-700");

  const getRiskEmoji = (label) => ({ Low:"🟢", Moderate:"🟡", High:"🟠", Extreme:"🔴" }[label] || "⚪");

  // ── City prediction ─────────────────────────────────────────────
  const handleCityPredict = async () => {
    if (!city.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`https://wildfire-prediction-nl3m.onrender.com/predict-city/${encodeURIComponent(city.trim())}`);
      if (!res.ok) throw new Error((await res.json()).detail || "City not found");
      setResult({ ...(await res.json()), mode: "city" });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };
  {/* Empty state — city mode only */}
        {!result && !loading && !error && mode === "city" && (
          <div className="text-center py-20 text-gray-300">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-lg">Type a city name above to check wildfire risk</p>
            <p className="text-sm mt-2">Try: Mumbai · Sydney · Cape Town · Amazon</p>
          </div>
        )}

  // ── Simple manual prediction ────────────────────────────────────
  const handleSimplePredict = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("https://wildfire-prediction-nl3m.onrender.com/predict-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lat: coords.lat, lon: coords.lon }),
      });
      if (!res.ok) throw new Error("Prediction failed");
      setResult({ ...(await res.json()), mode: "manual" });
    } catch (e) { setError(e.message || "Cannot connect to API."); }
    setLoading(false);
  };

  const handleChange = (key, val) => setForm(p => ({ ...p, [key]: parseFloat(val) }));

  const switchMode = (m) => { setMode(m); setResult(null); setError(null); };

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
          <button onClick={() => switchMode("city")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === "city" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            🌍 Search by City
          </button>
          <button onClick={() => switchMode("manual")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === "manual" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            ✏️ Enter Manually
          </button>
        </div>

        {/* ── CITY MODE ── */}
        {mode === "city" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-3">
              Type any city — live weather is fetched automatically
            </p>
            <div className="flex gap-3">
              <input
                type="text" value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCityPredict()}
                placeholder="e.g. Mumbai, Sydney, Cape Town, London..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm
                           text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button onClick={handleCityPredict} disabled={loading || !city.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium
                           px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {loading ? "Fetching..." : "Check Risk"}
              </button>
            </div>
            {error && (
              <div className="mt-3">
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 border border-red-100 mb-2">
                  ⚠️ {error} — location not recognised
                </p>
                <p className="text-sm text-gray-500">
                  Can't find your location?{" "}
                  <button onClick={() => switchMode("manual")}
                    className="text-orange-500 underline font-medium">
                    Enter weather manually instead →
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── MANUAL MODE — only 5 simple inputs ── */}
        {mode === "manual" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-5">
              Enter basic weather conditions — everything else is calculated automatically
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { key: "temp",     label: "Temperature",  unit: "°C",   icon: "🌡️", min: -50, max: 60  },
                { key: "humidity", label: "Humidity",     unit: "%",    icon: "💧", min: 0,   max: 100 },
                { key: "wind",     label: "Wind Speed",   unit: "km/h", icon: "💨", min: 0,   max: 150 },
                { key: "cloud",    label: "Cloud Cover",  unit: "%",    icon: "☁️", min: 0,   max: 100 },
              ].map(({ key, label, unit, icon, min, max }) => (
                <div key={key} className="bg-gray-50 rounded-xl p-3">
                  <label className="block text-xs text-gray-400 mb-1">{icon} {label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" value={form[key]} min={min} max={max} step="0.5"
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full bg-transparent text-lg font-semibold text-gray-800
                                 focus:outline-none border-b border-gray-200 pb-0.5"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>
                  </div>
                  {/* Slider */}
                  <input type="range" min={min} max={max} step="0.5" value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full mt-2 accent-orange-500" />
                </div>
              ))}
            </div>

            {/* Location row */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-2">📍 Your location (for regional context)</p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-700 font-medium">{locMsg}</p>
                <button onClick={getLocation}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white
                             px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                  Use My Location
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Or set manually → Lat:
                <input type="number" value={coords.lat} step="1"
                  onChange={(e) => setCoords(p => ({ ...p, lat: parseFloat(e.target.value) }))}
                  className="w-16 mx-1 border-b border-gray-300 text-center bg-transparent text-xs focus:outline-none" />
                Lon:
                <input type="number" value={coords.lon} step="1"
                  onChange={(e) => setCoords(p => ({ ...p, lon: parseFloat(e.target.value) }))}
                  className="w-16 mx-1 border-b border-gray-300 text-center bg-transparent text-xs focus:outline-none" />
              </p>
            </div>

            <button onClick={handleSimplePredict} disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium
                         py-3 rounded-xl transition-colors disabled:opacity-50">
              {loading ? "Predicting..." : "Predict Fire Risk"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">⚠️ {error}</p>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Risk card */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {result.mode === "city" && result.weather?.name ? (
                      <>
                        <p className="text-sm text-gray-400">Current wildfire risk in</p>
                        <h2 className="text-2xl font-semibold text-gray-900">
                          {result.weather.name}, {result.weather.country}
                        </h2>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400">Wildfire risk for</p>
                        <h2 className="text-xl font-semibold text-gray-900">Your Location</h2>
                      </>
                    )}
                  </div>
                  <span className="text-5xl">{getRiskEmoji(result.risk_label)}</span>
                </div>

                <div className={`inline-flex items-center px-4 py-2 rounded-full border
                                text-sm font-semibold mb-4 ${getRiskBg(result.risk_label)}`}>
                  {result.risk_label} Risk
                </div>

                <div className="text-6xl font-bold text-gray-900 mb-1">{result.fire_probability}%</div>
                <p className="text-sm text-gray-400 mb-4">probability of fire occurrence</p>

                <div className="bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result.fire_probability}%`, backgroundColor: result.risk_color }} />
                </div>
              </div>

              {/* Weather used */}
              {result.weather && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Weather Data Used</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Temperature",         value: `${result.weather.temp}°C`,    icon: "🌡️" },
                      { label: "Humidity",             value: `${result.weather.humidity}%`, icon: "💧" },
                      { label: "Wind Speed",           value: `${result.weather.wind} km/h`, icon: "💨" },
                      { label: "Cloud Cover",          value: `${result.weather.clouds}%`,   icon: "☁️" },
                      { label: "Dew Point",            value: `${result.weather.dewpoint}°C`,icon: "🌫️" },
                      { label: "Fire Weather Index",   value: result.weather.fwi,            icon: "🔥" },
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
                  is the biggest driver of this prediction
                  {result.shap_values[0]?.value > 0 ? " — pushing risk higher 🔺" : " — pushing risk lower 🔻"}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}