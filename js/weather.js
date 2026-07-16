/* ============================================================================
   weather.js — best-effort current weather for the Today chip (Open-Meteo,
   Red Deer AB). Cached per day in localStorage; resolves to null on any
   failure so the app stays fully offline-safe (the chip just hides).
   ============================================================================ */
const RED_DEER = { lat: 52.27, lon: -113.81 };
const KEY = "skate_weather_v1";

// WMO weather codes → { icon, caption }
const WMO = {
  0: ["☀️", "Clear"], 1: ["🌤️", "Mostly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Cloudy"],
  45: ["🌫️", "Fog"], 48: ["🌫️", "Fog"],
  51: ["🌦️", "Drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌦️", "Drizzle"],
  61: ["🌧️", "Rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
  71: ["🌨️", "Snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 77: ["🌨️", "Snow"],
  80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"], 82: ["⛈️", "Showers"],
  85: ["🌨️", "Snow"], 86: ["❄️", "Snow"], 95: ["⛈️", "Storm"], 96: ["⛈️", "Storm"], 99: ["⛈️", "Storm"]
};

export async function getWeather() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || "null");
    if (cached && cached.day === today) return cached.data;
  } catch {}
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${RED_DEER.lat}&longitude=${RED_DEER.lon}&current=temperature_2m,weather_code`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const code = j.current && j.current.weather_code;
    const temp = j.current && Math.round(j.current.temperature_2m);
    if (temp == null || code == null) return null;
    const [icon, caption] = WMO[code] || ["🌡️", "Weather"];
    const data = { icon, caption, temp };
    try { localStorage.setItem(KEY, JSON.stringify({ day: today, data })); } catch {}
    return data;
  } catch { return null; }
}
