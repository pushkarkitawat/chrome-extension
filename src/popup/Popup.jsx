import React, { useEffect, useState } from "react";

const productiveSites = ["github.com", "stackoverflow.com"];
const distractingSites = ["youtube.com", "instagram.com"];

export default function Popup() {
  const [sites, setSites] = useState({});

  useEffect(() => {
    chrome.storage.local.get(null, (data) => {
      setSites(data);
    });
  }, []);

  const totalTime = Object.values(sites).reduce((a, b) => a + b, 0);

  const getColor = (site) => {
    if (productiveSites.includes(site)) return "green";
    if (distractingSites.includes(site)) return "red";
    return "#444";
  };

  return (
    <div className="popup">
      <header>
        <h2>⏱ Time Tracker</h2>
        <p>Today’s Usage</p>
      </header>

      <div className="list">
        {Object.entries(sites)
          .sort((a, b) => b[1] - a[1])
          .map(([site, time]) => {
            const percent = ((time / totalTime) * 100).toFixed(1);
            return (
              <div key={site} className="card">
                <div className="row">
                  <span className="site">{site}</span>
                  <span className="time">
                    {(time / 60000).toFixed(1)} min
                  </span>
                </div>

                <div className="progress">
                  <div
                    className="bar"
                    style={{
                      width: `${percent}%`,
                      background: getColor(site)
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
      </div>

      <button
        className="clear"
        onClick={() => {
          chrome.storage.local.clear();
          setSites({});
        }}
      >
        Clear Data
      </button>
    </div>
  );
}
