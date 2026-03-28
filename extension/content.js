(() => {
  const STORAGE_KEY = "intentMirrorReports";
  const MAX_REPORTS = 300;

  const SIGNALS = {
    urgency: {
      weight: 12,
      category: "Panic Triggering",
      patterns: [
        /act now/i,
        /final warning/i,
        /immediate action/i,
        /verify now/i,
        /expires? (today|soon|in)/i,
        /account (suspended|locked)/i,
        /last chance/i,
        /urgent/i
      ]
    },
    fear: {
      weight: 10,
      category: "Panic Triggering",
      patterns: [
        /security alert/i,
        /fraud detected/i,
        /risk of (loss|closure)/i,
        /unauthorized/i,
        /legal action/i,
        /penalty/i
      ]
    },
    authority: {
      weight: 10,
      category: "Authority Impersonation",
      patterns: [
        /government/i,
        /irs/i,
        /bank/i,
        /university/i,
        /financial office/i,
        /official notice/i,
        /compliance required/i
      ]
    },
    scarcity: {
      weight: 8,
      category: "Scarcity Engineering",
      patterns: [
        /only \d+ left/i,
        /limited time/i,
        /exclusive offer/i,
        /flash sale/i,
        /ending tonight/i,
        /while supplies last/i
      ]
    },
    rewardBait: {
      weight: 7,
      category: "Trust Laundering",
      patterns: [
        /claim your reward/i,
        /free gift/i,
        /you['’]?ve won/i,
        /bonus expires/i,
        /guaranteed approval/i
      ]
    },
    forcedConsent: {
      weight: 9,
      category: "Forced Consent",
      patterns: [
        /by continuing you agree/i,
        /pre-checked/i,
        /auto[- ]renew/i,
        /no thanks,? i (don['’]t|do not) like/i
      ]
    },
    overload: {
      weight: 6,
      category: "Confusion Architecture",
      patterns: [
        /!!!+/,
        /warning/gi,
        /important notice/gi
      ]
    }
  };

  const KNOWN_BRANDS = [
    "paypal",
    "apple",
    "microsoft",
    "google",
    "chase",
    "bank of america",
    "wells fargo",
    "amazon",
    "netflix",
    "fedex",
    "ups",
    "irs",
    "usps"
  ];

  function getVisibleText() {
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    const chunks = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      if (text) chunks.push(text);
      if (chunks.length > 2500) break;
    }
    return chunks.join(" ").slice(0, 70000);
  }

  function detectCountdown(text) {
    const countdownPattern = /\b(\d{1,2}:\d{2}(:\d{2})?)\b|\b(\d+\s?(minutes?|seconds?)\s?left)\b/i;
    return countdownPattern.test(text);
  }

  function detectBrandMismatch(text) {
    const host = location.hostname.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      if (text.toLowerCase().includes(brand) && !host.includes(brand.replace(/\s+/g, "")) && !host.includes(brand.split(" ")[0])) {
        return brand;
      }
    }
    return null;
  }

  function detectButtonAsymmetry() {
    const buttons = Array.from(document.querySelectorAll("button, a, input[type='button'], input[type='submit']"));
    if (!buttons.length) return null;

    let dominantAction = null;
    let passiveAction = null;

    for (const el of buttons.slice(0, 40)) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const area = Math.max(rect.width, 1) * Math.max(rect.height, 1);
      const bg = style.backgroundColor || "";
      const text = (el.textContent || el.value || "").trim().toLowerCase();

      const isPassive = /(cancel|decline|no thanks|skip|later|unsubscribe)/i.test(text);
      const isAction = /(continue|verify|pay|confirm|accept|get started|submit)/i.test(text);

      if (isAction && (!dominantAction || area > dominantAction.area)) {
        dominantAction = { area, text, bg };
      }
      if (isPassive && (!passiveAction || area < passiveAction.area)) {
        passiveAction = { area, text, bg };
      }
    }

    if (dominantAction && passiveAction && dominantAction.area / passiveAction.area > 1.8) {
      return { dominantAction, passiveAction };
    }

    return null;
  }

  function evaluateSignals(text) {
    let score = 0;
    const categories = new Set();
    const evidence = [];

    Object.entries(SIGNALS).forEach(([key, cfg]) => {
      let matched = 0;
      for (const pattern of cfg.patterns) {
        const hit = text.match(pattern);
        if (hit) {
          matched += 1;
          if (evidence.length < 10) {
            evidence.push({ signal: key, snippet: hit[0] });
          }
        }
      }
      if (matched > 0) {
        const contribution = Math.min(cfg.weight + (matched - 1) * 2, cfg.weight + 8);
        score += contribution;
        categories.add(cfg.category);
      }
    });

    if (detectCountdown(text)) {
      score += 9;
      categories.add("Panic Triggering");
      evidence.push({ signal: "countdown", snippet: "Countdown-like timing language detected" });
    }

    const brandMismatch = detectBrandMismatch(text);
    if (brandMismatch) {
      score += 14;
      categories.add("Authority Impersonation");
      categories.add("Narrative Inconsistency");
      evidence.push({ signal: "brandMismatch", snippet: `Mentions ${brandMismatch} but domain is ${location.hostname}` });
    }

    const asymmetry = detectButtonAsymmetry();
    if (asymmetry) {
      score += 12;
      categories.add("Forced Consent");
      evidence.push({
        signal: "buttonAsymmetry",
        snippet: `Primary action (${asymmetry.dominantAction.text || "unknown"}) visually dominates passive action (${asymmetry.passiveAction.text || "unknown"})`
      });
    }

    const finalScore = Math.max(0, Math.min(100, score));
    return {
      score: finalScore,
      categories: Array.from(categories),
      evidence
    };
  }

  function riskBand(score) {
    if (score >= 75) return "High";
    if (score >= 45) return "Moderate";
    return "Low";
  }

  function buildExplanation(result) {
    const band = riskBand(result.score);
    if (band === "Low") {
      return "This page shows limited manipulation pressure. Stay alert for unexpected requests, and verify before sharing sensitive information.";
    }

    const tacticText = result.categories.length
      ? `Detected tactics: ${result.categories.join(", ")}.`
      : "Detected multiple manipulation cues.";

    const nextStep = "Safer next step: pause 20 seconds, verify sender/domain independently, and avoid clicking urgency-driven prompts.";
    return `This page appears to apply decision pressure (${band} risk). ${tacticText} ${nextStep}`;
  }

  function saveReport(report) {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const current = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      const filtered = current.filter((r) => r.url !== report.url || Date.now() - r.timestamp > 120000);
      filtered.unshift(report);
      chrome.storage.local.set({ [STORAGE_KEY]: filtered.slice(0, MAX_REPORTS), intentMirrorLatest: report });
    });
  }

  function installPauseLayer(report) {
    if (report.score < 70) return;

    const clickHandler = (event) => {
      const target = event.target?.closest?.("a,button,input[type='submit']");
      if (!target) return;

      const text = (target.textContent || target.value || "").toLowerCase();
      const riskyAction = /(verify|confirm|pay|submit|continue|accept|transfer|buy)/i.test(text);
      if (!riskyAction) return;

      const proceed = window.confirm(
        "IntentMirror Pause Layer:\n\nThis content may be trying to influence your decision through urgency/pressure tactics.\n\nTake 20 seconds to verify sender identity and destination URL. Continue anyway?"
      );

      if (!proceed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", clickHandler, true);
  }

  function analyzePage() {
    const text = getVisibleText();
    const analysis = evaluateSignals(text);
    const report = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: location.href,
      host: location.hostname,
      title: document.title || "Untitled page",
      score: analysis.score,
      riskBand: riskBand(analysis.score),
      categories: analysis.categories,
      evidence: analysis.evidence,
      explanation: buildExplanation(analysis),
      timestamp: Date.now()
    };

    saveReport(report);
    installPauseLayer(report);
  }

  analyzePage();
})();
