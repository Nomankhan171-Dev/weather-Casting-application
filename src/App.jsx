import React, { useEffect, useMemo, useState } from "react";
import { getWeather, searchCity } from "./api";

const WEATHER = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm", "⛈️"],
  99: ["Severe storm", "⛈️"],
};

function weatherInfo(code) {
  return WEATHER[code] || ["Weather", "🌤️"];
}

function niceDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function shortDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(date));
}

export default function App() {
  const [query, setQuery] = useState("Islamabad");
  const [place, setPlace] = useState("Islamabad, Pakistan");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const current = useMemo(() => {
    if (!weather) return null;
    const [label, icon] = weatherInfo(weather.current.weather_code);
    return { label, icon };
  }, [weather]);

  async function loadCity(city) {
    try {
      setLoading(true);
      setError("");

      const location = await searchCity(city);
      const data = await getWeather(location.latitude, location.longitude);

      setWeather(data);
      setPlace(
        `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}, ${
          location.country
        }`
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentLocation(lat, lon) {
    try {
      setLoading(true);
      setError("");
      const data = await getWeather(lat, lon);
      setWeather(data);
      setPlace("Current location");
    } catch (err) {
      setError(err.message || "Unable to get weather.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCity("Islamabad");
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    if (query.trim()) loadCity(query.trim());
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadCurrentLocation(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => setError("Location permission was denied.")
    );
  }

  const forecast = weather
    ? weather.daily.time.slice(0, 6).map((date, index) => {
        const [label, icon] = weatherInfo(weather.daily.weather_code[index]);
        return {
          date,
          label,
          icon,
          high: weather.daily.temperature_2m_max[index],
          low: weather.daily.temperature_2m_min[index],
          rain: weather.daily.precipitation_probability_max[index],
        };
      })
    : [];

  return (
    <div className="page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="shell">
        <header className="nav">
          <div className="brand">
            <div className="brand-icon">A</div>
            <div>
              <strong>Atmos</strong>
              <span>Weather intelligence</span>
            </div>
          </div>

          <button className="ghost-button" onClick={useLocation}>
            Use my location
          </button>
        </header>

        <section className="intro">
          <div>
            <span className="kicker">LIVE WEATHER EXPERIENCE</span>
            <h1>Weather that feels easy to understand.</h1>
            <p>
              Search any city to view current conditions, rain probability,
              humidity, wind and a six-day forecast using live API data.
            </p>
          </div>

          <form className="search" onSubmit={submitSearch}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city..."
            />
            <button type="submit">Check weather</button>
          </form>

          {error && <div className="error">{error}</div>}
        </section>

        {loading ? (
          <section className="panel loading">Loading live weather...</section>
        ) : weather ? (
          <>
            <section className="dashboard">
              <div className="panel current-panel">
                <div className="current-top">
                  <div>
                    <span className="label">Current conditions</span>
                    <h2>{place}</h2>
                    <p>{niceDate(weather.current.time)}</p>
                  </div>
                  <div className="weather-icon">{current.icon}</div>
                </div>

                <div className="temperature">
                  <strong>{Math.round(weather.current.temperature_2m)}</strong>
                  <span>°C</span>
                </div>

                <div className="condition">
                  <strong>{current.label}</strong>
                  <span>
                    Feels like {Math.round(weather.current.apparent_temperature)}°C
                  </span>
                </div>

                <div className="metrics">
                  <Metric
                    title="Humidity"
                    value={`${weather.current.relative_humidity_2m}%`}
                  />
                  <Metric
                    title="Wind"
                    value={`${Math.round(weather.current.wind_speed_10m)} km/h`}
                  />
                  <Metric
                    title="Rain"
                    value={`${weather.current.precipitation} mm`}
                  />
                  <Metric
                    title="Today"
                    value={`${Math.round(
                      weather.daily.temperature_2m_max[0]
                    )}° / ${Math.round(weather.daily.temperature_2m_min[0])}°`}
                  />
                </div>
              </div>

              <div className="panel sun-panel">
                <span className="label">Daylight</span>
                <h3>Sunrise & sunset</h3>

                <div className="sun-art">
                  <div className="sun">☀</div>
                  <div className="arc" />
                </div>

                <div className="sun-times">
                  <div>
                    <span>Sunrise</span>
                    <strong>{weather.daily.sunrise[0].split("T")[1]}</strong>
                  </div>
                  <div>
                    <span>Sunset</span>
                    <strong>{weather.daily.sunset[0].split("T")[1]}</strong>
                  </div>
                </div>

                <p className="api-copy">
                  Weather data is loaded from the Open-Meteo API. No API key is
                  required for this project.
                </p>
              </div>
            </section>

            <section className="panel forecast-panel">
              <div className="section-title">
                <div>
                  <span className="label">Forecast</span>
                  <h3>Next 6 days</h3>
                </div>
                <span className="live-pill">Live API</span>
              </div>

              <div className="forecast-grid">
                {forecast.map((day) => (
                  <article className="forecast-card" key={day.date}>
                    <span className="forecast-day">{shortDay(day.date)}</span>
                    <span className="forecast-icon">{day.icon}</span>
                    <strong>{day.label}</strong>
                    <div className="forecast-temp">
                      <b>{Math.round(day.high)}°</b>
                      <span>{Math.round(day.low)}°</span>
                    </div>
                    <small>{day.rain ?? 0}% rain</small>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <footer>
          <span>React JS</span>
          <span>CSS</span>
          <span>REST API</span>
          <span>Responsive UI</span>
        </footer>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
