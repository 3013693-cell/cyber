const STORAGE_KEY = "intentMirrorReports";

function setBandStyle(scoreEl, bandEl, score) {
  if (score >= 75) {
    scoreEl.style.color = "#ef4444";
    bandEl.textContent = "High manipulation risk";
  } else if (score >= 45) {
    scoreEl.style.color = "#f59e0b";
    bandEl.textContent = "Moderate manipulation risk";
  } else {
    scoreEl.style.color = "#22c55e";
    bandEl.textContent = "Low manipulation risk";
  }
}

function renderReport(report) {
  const scoreEl = document.getElementById("score");
  const bandEl = document.getElementById("band");
  const categoriesEl = document.getElementById("categories");
  const explanationEl = document.getElementById("explanation");

  if (!report) {
    scoreEl.textContent = "--";
    bandEl.textContent = "No report for this tab yet";
    categoriesEl.innerHTML = "<li>None</li>";
    explanationEl.textContent = "Visit/reload a page so IntentMirror can analyze it.";
    return;
  }

  scoreEl.textContent = String(report.score);
  setBandStyle(scoreEl, bandEl, report.score);

  categoriesEl.innerHTML = "";
  if (!report.categories?.length) {
    categoriesEl.innerHTML = "<li>No vectors detected</li>";
  } else {
    report.categories.forEach((cat) => {
      const li = document.createElement("li");
      li.textContent = cat;
      categoriesEl.appendChild(li);
    });
  }

  explanationEl.textContent = report.explanation || "No explanation available.";
}

function init() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const active = tabs[0];
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const reports = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      const report = reports.find((r) => active?.url && r.url === active.url) || data.intentMirrorLatest;
      renderReport(report);
    });
  });

  document.getElementById("open-dashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });
}

init();
