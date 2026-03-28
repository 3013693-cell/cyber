const STORAGE_KEY = "intentMirrorReports";

function formatDate(ts) {
  return new Date(ts).toLocaleString();
}

function classForScore(score) {
  if (score >= 75) return "score-high";
  if (score >= 45) return "score-moderate";
  return "score-low";
}

function renderSummary(reports) {
  const total = reports.length;
  const avg = total ? (reports.reduce((a, b) => a + b.score, 0) / total).toFixed(1) : 0;
  const high = reports.filter((r) => r.score >= 75).length;

  document.getElementById("total-scans").textContent = String(total);
  document.getElementById("avg-score").textContent = String(avg);
  document.getElementById("high-risk").textContent = String(high);
}

function renderVectors(reports) {
  const counts = new Map();
  reports.forEach((r) => {
    (r.categories || []).forEach((cat) => {
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
  });

  const list = document.getElementById("vector-list");
  list.innerHTML = "";
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) {
    list.innerHTML = "<li>No vectors logged yet.</li>";
    return;
  }

  sorted.slice(0, 8).forEach(([vector, count]) => {
    const li = document.createElement("li");
    li.textContent = `${vector} — ${count}`;
    list.appendChild(li);
  });
}

function renderReports(reports) {
  const body = document.getElementById("reports-body");
  body.innerHTML = "";

  if (!reports.length) {
    body.innerHTML = "<tr><td colspan='5'>No reports yet.</td></tr>";
    return;
  }

  reports.slice(0, 100).forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(r.timestamp)}<div class="small">${r.title || "Untitled"}</div></td>
      <td>${r.host || "unknown"}</td>
      <td class="${classForScore(r.score)}"><strong>${r.score}</strong></td>
      <td>${(r.categories || []).join(", ") || "None"}</td>
      <td>${r.explanation || "No explanation"}</td>
    `;
    body.appendChild(tr);
  });
}

function refresh() {
  chrome.storage.local.get([STORAGE_KEY], (data) => {
    const reports = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    renderSummary(reports);
    renderVectors(reports);
    renderReports(reports);
  });
}

document.getElementById("clear-reports").addEventListener("click", () => {
  const confirmed = window.confirm("Clear all IntentMirror scan history?");
  if (!confirmed) return;
  chrome.storage.local.set({ [STORAGE_KEY]: [], intentMirrorLatest: null }, refresh);
});

refresh();
