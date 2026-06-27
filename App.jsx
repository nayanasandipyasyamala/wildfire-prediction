import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

// ── Default form values (realistic weather sample) ────────────────
const DEFAULT_VALUES = {
  fire_weather_index: 14.5,
  temp_mean: 28.0,
  humidity_min: 20.0,
  wind_speed_max: 18.0,
  solar_radiation_mean: 260.0,
  cloud_cover_mean: 15.0,
  dewpoint_mean: 8.0,
  evapotranspiration_total: 6.0,
  pressure_mean: 950.0,
  temp_range: 13.0,
  lat_bin: 10.0,
  lon_bin: 20.0,
};

const FIELD_LABELS = {
  fire_weather_index:      "Fire Weather Index",
  temp_mean:               "Temperature Mean (°C)",
  humidity_min:            "Humidity Min (%)",
  wind_speed_max:          "Wind Speed Max (km/h)",
  solar_radiation_mean:    "Solar Radiation Mean",
  cloud_cover_mean:        "Cloud Cover Mean (%)",
  dewpoint_mean:           "Dew Point Mean (°C)",
  evapotranspiration_total:"Evapotranspiration Total",
  pressure_mean:           "Pressure Mean (hPa)",
  temp_range:              "Temperature Range",
  lat_bin:                 "Latitude (grid)",
  lon_bin:                 "Longitude (grid)",
};

export default function App() {
  const [form,    setForm]    = useState(DEFAULT_VALUES);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Send inputs to FastAPI ──────────────────────────────────────
  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Cannot connect to API. Make sure api.py is running.");
    }
    setLoading(false);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  // ── Risk color helper ───────────────────────────────────────────
  const getRiskBg = (label) => ({
    Low:     "bg-green-100  text-green-800",
    Moderate:"bg-yellow-100 text-yellow-800",
    High:    "bg-orange-100 text-orange-800",
    Extreme: "bg-red-100    text-red-800",
  }[label] || "bg-gray-100 text-gray-800");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            🔥 Wildfire Risk Prediction
          </h1>
          <p className="text-gray-500 mt-1">
            Enter weather conditions to predict fire risk
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Weather Conditions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(DEFAULT_VALUES).map((key) => (
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
                               text-sm text-gray-800 focus:outline-none
                               focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600
                         text-white font-medium py-3 rounded-xl
                         transition-colors disabled:opacity-50"
            >
              {loading ? "Predicting..." : "Predict Fire Risk"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50
                            rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Result Panel */}
          <div className="flex flex-col gap-4">
            {result ? (
              <>
                {/* Risk Score Card */}
                <div className="bg-white rounded-2xl shadow-sm
                                border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">
                    Prediction Result
                  </h2>

                  <div className={`inline-block px-4 py-2 rounded-full
                                  text-xl font-semibold mb-4
                                  ${getRiskBg(result.risk_label)}`}>
                    {result.risk_label} Risk
                  </div>

                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {result.fire_probability}%
                  </div>
                  <p className="text-gray-500 text-sm">
                    probability of fire occurrence
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${result.fire_probability}%`,
                        backgroundColor: result.risk_color,
                      }}
                    />
                  </div>
                </div>

                {/* SHAP Chart */}
                <div className="bg-white rounded-2xl shadow-sm
                                border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Why this prediction?
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Positive = increases risk · Negative = decreases risk
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={result.shap_values}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 11 }}
                        width={160}
                      />
                      <Tooltip formatter={(v) => v.toFixed(4)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {result.shap_values.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.value > 0 ? "#ef4444" : "#22c55e"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm
                              border border-gray-100 p-6 flex items-center
                              justify-center h-full min-h-64 text-gray-400">
                Fill in the weather conditions and click Predict
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
