let activeSite = null;
let lastTick = Date.now();

// Create alarm on install/startup
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

function init() {
  chrome.alarms.create("tick", { periodInMinutes: 1 / 60 });
  getActiveTab();
}

// Track tab change
chrome.tabs.onActivated.addListener(getActiveTab);

// Track URL change
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete") {
    getActiveTab();
  }
});

// Alarm fires every second
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tick") {
    trackTime();
  }
});

function getActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.url || !tabs[0].url.startsWith("http")) {
      activeSite = null;
      return;
    }
    activeSite = new URL(tabs[0].url).hostname;
  });
}

function trackTime() {
  if (!activeSite) return;

  const now = Date.now();
  const diff = now - lastTick;
  lastTick = now;

  console.log("Tick:", activeSite, diff); // ✅ now safe

  chrome.storage.local.get([activeSite], (data) => {
    const old = data[activeSite] || {
      time: 0,
      sessions: 0,
      lastVisited: null
    };

    chrome.storage.local.set({
      [activeSite]: {
        time: old.time + diff,
        sessions: old.sessions + 1,
        lastVisited: now
      }
    });
  });
}
