# IntentMirror

IntentMirror is a **behavioral cybersecurity MVP**: a Chrome extension + dashboard that detects attempts to manipulate user decision-making (urgency, authority pressure, dark patterns), not just traditional malware/phishing signals.

## What it does

- Calculates a **Decision Hijack Score (0–100)** for the active page.
- Labels manipulation vectors (e.g., Panic Triggering, Authority Impersonation, Forced Consent).
- Shows **plain-English explanations** and safer next steps.
- Adds a **Pause Layer** before risky clicks when manipulation pressure is high.
- Stores scan reports locally and visualizes them in a dashboard.

## Project structure

- `extension/` – Chrome extension (Manifest V3).
  - `manifest.json`
  - `content.js` – on-page analysis + pause layer.
  - `popup.html/js/css` – quick score view.
  - `dashboard.html/js/css` – saved report analytics.
- `docs/`
  - `TAXONOMY.md` – behavioral attack surface taxonomy used by the MVP.

## How to run this program (step-by-step)

### Requirements

- Google Chrome (or any Chromium browser that supports Manifest V3 extensions).

### Start the extension

1. Clone or download this repository.
2. Open Chrome and go to: `chrome://extensions`.
3. Turn on **Developer mode** (toggle in the top-right).
4. Click **Load unpacked**.
5. Select the repository folder: `.../cyber/extension`.
6. You should now see **IntentMirror** in your installed extensions list.

### Use IntentMirror

1. Open any webpage you want to analyze.
2. Click the IntentMirror extension icon.
3. The popup will show:
   - Decision Hijack Score,
   - risk band (Low / Moderate / High),
   - detected manipulation vectors,
   - plain-English explanation.
4. Click **Open Dashboard** to view saved scan history and vector trends.

### Test with a local sample page (optional)

If you want a quick, controlled demo, open `docs/sample-manipulative-page.html` in Chrome and then open the IntentMirror popup.

### Reset local history

- Open Dashboard and click **Clear history**.
- This removes saved reports from `chrome.storage.local`.

### Troubleshooting

- **No score appears in popup**: refresh the target webpage once after loading the extension.
- **Extension not loading**: confirm you selected the `extension/` folder (not repo root) in **Load unpacked**.
- **Changes not updating**: after editing files, click the **Reload** button on the extension card in `chrome://extensions`.

## MVP scoring model

The current engine is rules-based and explainable:

- Urgency phrase detection ("final warning", "verify now", etc.)
- Fear/coercion lexicon checks
- Authority/identity pressure cues
- Scarcity/reward pressure cues
- Countdown timer text patterns
- Brand/domain mismatch heuristics
- Button asymmetry (dominant action vs passive decline)
- Forced consent patterns (preselected checkbox language)
- Cognitive overload indicators (many warnings/exclamation clusters)

Each signal contributes weighted points. Score is clamped to 0–100.

## Privacy

- Runs locally in the browser.
- Uses `chrome.storage.local` only.
- No external API calls in MVP.

## Future upgrades

- Message/email paste-in analysis mode.
- Counterfactual rewrite (neutral rephrase of manipulative text).
- Shared, anonymized dataset export pipeline.
- Optional ML classifier to complement heuristic layer.
