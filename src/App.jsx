import { useEffect, useState } from "react";
import "./App.css";

const PRODUCTIVE = ["github.com", "stackoverflow.com"];
const DISTRACTING = ["youtube.com", "instagram.com"];

const LIMITS = {
  "youtube.com": 30 * 60 * 1000,
  "instagram.com": 20 * 60 * 1000,
  "github.com": 4 * 60 * 60 * 1000
};

const normalize = (value) =>
  typeof value === "number"
    ? { time: value, lastVisited: null, sessions: 1 }
    : value;

export default function App() {
  const [sites, setSites] = useState({});
  const [activeSite, setActiveSite] = useState("—");

  useEffect(() => {
    // ✅ SAFETY CHECK
    if (typeof chrome === "undefined") {
      console.warn("Chrome APIs not available");
      return;
    }

    // Load stored data
    chrome.storage?.local?.get(null, (data) => {
      if (data) setSites(data);
    });

    // Get active tab
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.url) {
        try {
          setActiveSite(new URL(tabs[0].url).hostname);
        } catch {
          setActiveSite("Unknown");
        }
      }
    });
  }, []);

  const normalizedSites = Object.fromEntries(
    Object.entries(sites).map(([k, v]) => [k, normalize(v)])
  );

  const totalTime = Object.values(normalizedSites)
    .reduce((a, b) => a + b.time, 0);

  const focusTime = Object.entries(normalizedSites)
    .filter(([s]) => PRODUCTIVE.includes(s))
    .reduce((a, [, d]) => a + d.time, 0);

  const distractTime = Object.entries(normalizedSites)
    .filter(([s]) => DISTRACTING.includes(s))
    .reduce((a, [, d]) => a + d.time, 0);

  const productivityScore = totalTime
    ? Math.round((focusTime / totalTime) * 100)
    : 0;

  const mostUsed = Object.entries(normalizedSites)
    .sort((a, b) => b[1].time - a[1].time)[0];

  const overLimitSites = Object.entries(normalizedSites)
    .filter(([site, data]) => LIMITS[site] && data.time > LIMITS[site]);

  const format = (ms) => `${(ms / 60000).toFixed(1)} min`;
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString() : "—";

  return (
    <div className="app">

      <section className="section highlight">
        <h3>🌐 Current Website</h3>
        <p className="big">{activeSite}</p>
      </section>

      <section className="section">
        <h3>📊 Today’s Summary</h3>
        <div className="row">
          <span>Total Time</span>
          <b>{format(totalTime)}</b>
        </div>
        <div className="row">
          <span>Focus Time</span>
          <b className="green">{format(focusTime)}</b>
        </div>
        <div className="row">
          <span>Distraction Time</span>
          <b className="red">{format(distractTime)}</b>
        </div>
      </section>

      <section className="section score">
        <h3>🎯 Productivity Score</h3>
        <div className="score-circle">{productivityScore}%</div>
      </section>

      <section className="section highlight">
        <h3>🔥 Most Used Website</h3>
        {mostUsed ? (
          <>
            <p className="big">{mostUsed[0]}</p>
            <span>{format(mostUsed[1].time)}</span>
          </>
        ) : (
          <span className="hint">No data yet</span>
        )}
      </section>

      <section className="section alert">
        <h3>🚨 Time Limit Exceeded</h3>
        {overLimitSites.length === 0 && (
          <p className="hint">No limits exceeded 🎉</p>
        )}
        {overLimitSites.map(([site, data]) => (
          <div className="site-row danger" key={site}>
            <span>{site}</span>
            <span>{format(data.time)} / {format(LIMITS[site])}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <h3>🧾 Website Breakdown</h3>

        {Object.entries(normalizedSites).length === 0 && (
          <p className="hint">Start browsing to see data</p>
        )}

        {Object.entries(normalizedSites).map(([site, data]) => (
          <div className="site-card" key={site}>
            <div className="row">
              <b>{site}</b>
              <span>{format(data.time)}</span>
            </div>
            <div className="meta">
              <span>🕒 Last Opened: {formatTime(data.lastVisited)}</span>
              <span>🔁 Sessions: {data.sessions}</span>
            </div>
          </div>
        ))}
      </section>

      <button
        className="clear"
        onClick={() => {
          if (chrome?.storage?.local) {
            chrome.storage.local.clear();
            setSites({});
          }
        }}
      >
        Clear Today’s Data
      </button>

    </div>
  );
}
