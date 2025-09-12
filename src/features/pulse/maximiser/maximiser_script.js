/* eslint-disable no-console */
/**
 * Pulse Maximiser — PDF Teaser Generator
 * (Fixed: removed TS generics, disabled animations, destroy charts, SSR guard)
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { chartToPng } from "./utils/chartImage";

// --- Guards -----------------------------------------------------------------

function assertBrowserEnv() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error(
      "PDF generation requires a browser environment (window/document not available)."
    );
  }
}

// --- Helpers (pure; easy to test) -------------------------------------------

const MARGIN = 36;

// Use current jsPDF page size rather than fixed constants
function pageSize(doc) {
  const { width, height } = doc.internal.pageSize;
  return { w: width, h: height };
}

// Prefer Outfit font; gracefully fallback to Helvetica if not registered
function ensureOutfitFont(doc, style = "normal") {
  try {
    // If app injected vfs payloads for Outfit, register on-the-fly
    if (window && window.OUTFIT_PDF && !doc.getFontList()?.Outfit) {
      const vfs = window.OUTFIT_PDF;
      if (vfs?.regular) {
        doc.addFileToVFS("Outfit-Regular.ttf", vfs.regular);
        doc.addFont("Outfit-Regular.ttf", "Outfit", "normal");
      }
      if (vfs?.bold) {
        doc.addFileToVFS("Outfit-Bold.ttf", vfs.bold);
        doc.addFont("Outfit-Bold.ttf", "Outfit", "bold");
      }
    }
    const fonts = doc.getFontList ? doc.getFontList() : {};
    if (fonts?.Outfit || fonts?.outfit) {
      doc.setFont("Outfit", style);
      return "Outfit";
    }
  } catch (_) {}
  doc.setFont("helvetica", style);
  return "helvetica";
}

// Map theme with sensible fallbacks if none passed
function normTheme(t = {}) {
  return {
    mode: t.mode || "light",
    primary: t.primary || "#7c4dff",
    secondary: t.secondary || "#6f7e8c",
    textPrimary: t.textPrimary || (t.mode === "dark" ? "#f0f2f5" : "#1e1e1e"),
    textSecondary:
      t.textSecondary || (t.mode === "dark" ? "#aeb0b5" : "#4d4d4d"),
    bgPaper: t.bgPaper || (t.mode === "dark" ? "#2b2b3c" : "#ffffff"),
    brandBand: t.brandBand || (t.mode === "dark" ? "#1e88e5" : "#7c4dff"),
    legendGrey: t.legendGrey || (t.mode === "dark" ? "#bbb" : "#666"),
    grid: t.grid || (t.mode === "dark" ? "#3a3a4d" : "#e6e8eb"),
  };
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function textBlock(doc, text, x, y, maxWidth, lineHeight = 14, fontSize = 11) {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((ln, i) => doc.text(ln, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

// Sanitize curly quotes/dashes for PDF text blocks
function sanitizeText(s) {
  if (!s) return s;
  return String(s)
    .replace(/[\u2010-\u2015]/g, "-") // hyphen/en dash/em dash variants
    .replace(/[\u2018\u2019]/g, "'") // single quotes
    .replace(/[\u201C\u201D]/g, '"'); // double quotes
}

function chartFontFamily() {
  // Prefer Outfit in canvas; browser will gracefully fall back if not available
  return "Outfit, Helvetica, Arial, sans-serif";
}

function drawHeader(doc, title, brandProduct = "Pulse", theme) {
  const { w } = pageSize(doc);
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(20);
  doc.setTextColor(theme.textPrimary);
  doc.text(title, MARGIN, 48);
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(11);
  doc.setTextColor(theme.textSecondary);
  doc.text(brandProduct, w - MARGIN, 48, { align: "right" });
  doc.setTextColor(theme.textPrimary);
}

function drawFooter(
  doc,
  brandCompany = "Monochrome Compliance",
  urlOrTheme = "monochrome-compliance.com",
  maybeTheme
) {
  // Allow calls like drawFooter(doc, brand, theme) OR drawFooter(doc, brand, url, theme)
  const theme = typeof urlOrTheme === "string" ? maybeTheme : urlOrTheme;
  const url =
    typeof urlOrTheme === "string" ? urlOrTheme : "monochrome-compliance.com";
  const safeTheme = theme || { textSecondary: "#666", textPrimary: "#111" };
  const { w, h } = pageSize(doc);
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(9);
  doc.setTextColor(safeTheme.textSecondary);
  doc.text(`${brandCompany} — ${new Date().getFullYear()}`, MARGIN, h - 18);
  doc.text(url, w - MARGIN, h - 18, { align: "right" });
  doc.setTextColor(safeTheme.textPrimary);
}

// Combined Introduction + Primers (portrait)
async function paintIntroPrimersPortrait(doc, introText, primers, theme) {
  drawBrandBand(doc, theme);
  const { w, h } = pageSize(doc);

  // Title
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(22);
  doc.setTextColor(theme.textPrimary);
  doc.text("Introduction to Pulse", MARGIN, 80);

  // Intro body
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(12);
  const intro = sanitizeText(introText || "No introduction text provided.");
  let y = textBlock(doc, intro, MARGIN, 100, w - MARGIN * 2, 18, 12);

  // Primers
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(18);
  // Add a bit more vertical space between Intro and Primers
  doc.text("Primers", MARGIN, y + 36);
  y += 36;

  // Brief explanation so readers know why Primers exist
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(12);
  const primersPurpose = sanitizeText(
    primers?.purpose ||
      "These primers summarise the scope, audience, drivers and constraints so you interpret findings in the right context."
  );
  y = textBlock(doc, primersPurpose, MARGIN, y + 16, w - MARGIN * 2, 18, 12);

  // Bulleted primer items with richer free text
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(12);

  const bullet = (label, value) => (value ? `• ${label}: ${value}` : null);

  const joinArr = (arr) =>
    Array.isArray(arr) ? arr.filter(Boolean).join("; ") : arr || "";

  const lines = [
    bullet("Sector", primers?.sector || ""),
    bullet("Audience", primers?.audience || ""),
    bullet("Priorities", joinArr(primers?.priorities)),
    bullet("Success Metrics", joinArr(primers?.successMetrics)),
    bullet("Constraints", joinArr(primers?.constraints)),
    bullet("Time Horizon", primers?.timeHorizon || ""),
    bullet("Notes", primers?.notes || ""),
  ].filter(Boolean);

  y = textBlock(
    doc,
    lines.join("\n\n"),
    MARGIN,
    y + 18,
    w - MARGIN * 2,
    18,
    12
  );

  drawFooter(doc, "Monochrome Compliance", "monochrome-compliance.com", theme);
}

// --- Executive Summary ------------------------------------------------------
function buildExecutiveSummaryNarrative(
  insights = {},
  primers = {},
  execPanel = null
) {
  const pick = (arr, n = 3) => (Array.isArray(arr) ? arr.slice(0, n) : []);
  const toSentence = (s) => {
    const t = sanitizeText(String(s || "").trim());
    if (!t) return "";
    return /[.!?]$/.test(t) ? t : `${t}.`;
  };

  const arrify = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  let good = [];
  let attn = [];
  let urg = [];

  if (
    execPanel &&
    (execPanel.positive || execPanel.risks || execPanel.critical)
  ) {
    good = pick(arrify(execPanel.positive)).map((s) => toSentence(s));
    attn = pick(arrify(execPanel.risks)).map((s) => toSentence(s));
    urg = pick(arrify(execPanel.critical)).map((s) => toSentence(s));
  } else {
    good = pick(insights.good).map((i) => toSentence(i?.text ?? i));
    attn = pick(insights.attention).map((i) => toSentence(i?.text ?? i));
    urg = pick(insights.urgent).map((i) => toSentence(i?.text ?? i));
  }

  const sector = primers.sector ? ` in ${primers.sector}` : "";
  const horizon = primers.timeHorizon
    ? ` over the ${primers.timeHorizon.toLowerCase()}`
    : "";

  const intro = `The report provides an AI‑assisted analysis of recent timesheet data${horizon}, highlighting key strengths and areas requiring immediate focus. Pulse Maximiser ingests and interprets raw inputs to provide an executive‑level view of team performance across planning, delivery, and collaboration${sector}.`;

  const positive = good.length
    ? `Positive momentum: ${good.join(" ")}`
    : "Positive momentum: Delivery discipline and cross‑team collaboration show stabilising signals.";

  const risks = attn.length
    ? `Emerging risks: ${attn.join(" ")}`
    : "Emerging risks: Monitor estimation accuracy, velocity signals, and workload balance for early intervention.";

  const critical = urg.length
    ? `Critical concerns: ${urg.join(" ")}`
    : "Critical concerns: No critical risks surfaced by current window; continue close monitoring of blockers and QA.";

  const overall = execPanel?.overall
    ? toSentence(execPanel.overall)
    : `Overall, the data suggests a team with pockets of strength but with pressure points that require targeted intervention. Addressing estimation accuracy, throughput health, and quality gates will be critical to sustaining progress and preventing delivery disruption.`;
  return { intro, positive, risks, critical, overall };
}

async function paintExecutiveSummaryPortrait(doc, narratives, theme) {
  drawBrandBand(doc, theme);
  const { w } = pageSize(doc);

  // Tighter readable measure (limit paragraph width so tracking doesn't look stretched)
  const maxW = Math.min(540, w - MARGIN * 2);
  let y = 80;

  // Title
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(24);
  doc.setTextColor(theme.textPrimary);
  doc.text("Executive Summary", MARGIN, y);
  y += 26; // space under title

  // Intro paragraph
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(12);
  y = textBlock(
    doc,
    sanitizeText(narratives.intro),
    MARGIN,
    y + 8,
    maxW,
    18,
    12
  );

  // spacing before key findings (no divider)
  y += 14;

  // Section header: Key findings
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(13);
  doc.text("Key findings:", MARGIN, y);
  y += 8;

  // Helper to render a bold run‑in label followed by a wrapped body
  const runIn = (label, body) => {
    const labelText = sanitizeText(label);
    const bodyText = sanitizeText(body);
    // Label
    ensureOutfitFont(doc, "bold");
    doc.setFontSize(12);
    doc.text(labelText, MARGIN, y + 18);
    // Body
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(12);
    y = textBlock(doc, bodyText, MARGIN, y + 34, maxW, 18, 12);
    y += 6; // paragraph spacing
  };

  // Positive / Risks / Critical
  runIn(
    "Positive momentum:",
    narratives.positive.replace(/^Positive momentum:\s*/i, "")
  );
  runIn(
    "Emerging risks:",
    narratives.risks.replace(/^Emerging risks:\s*/i, "")
  );
  runIn(
    "Critical concerns:",
    narratives.critical.replace(/^Critical concerns:\s*/i, "")
  );

  // Overall
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(12);
  doc.text("Overall", MARGIN, y + 18);
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(12);
  y = textBlock(
    doc,
    sanitizeText(narratives.overall),
    MARGIN,
    y + 34,
    maxW,
    18,
    12
  );

  drawFooter(doc, "Monochrome Compliance", "monochrome-compliance.com", theme);
}

// --- Highlights Painters ----------------------------------------------------
async function paintInsightsSection(doc, title, items, data, theme) {
  drawHeader(doc, title, "Pulse", theme);
  const { w } = pageSize(doc);
  let y = 96;
  const perPage = 3;
  const total = Array.isArray(items) ? items.length : 0;
  const pages = Math.ceil(total / perPage) || 1;

  for (let p = 0; p < pages; p++) {
    const slice = (items || []).slice(p * perPage, (p + 1) * perPage);
    if (p > 0) {
      doc.addPage("a4", "landscape");
      drawHeader(doc, title, "Pulse", theme);
      y = 96;
    }
    for (let i = 0; i < slice.length; i += 1) {
      const ins = slice[i] || {};
      const safeText = sanitizeText(String(ins.text || ""));
      const startX = 56;
      const maxWidth = Math.max(0, w - startX - 52);

      ensureOutfitFont(doc, "bold");
      doc.setFontSize(14);
      doc.text("•", 48, y);

      ensureOutfitFont(doc, "normal");
      doc.setFontSize(12);
      y = textBlock(doc, safeText, startX, y - 4, maxWidth, 18, 12);

      // Chart per statement (compact footprint)
      const chartW = Math.min(Math.max(220, w - 200), 480);
      await drawInsightChart(
        doc,
        ins,
        data || {},
        48,
        y + 6,
        chartW,
        74,
        theme || {}
      );
      y += 88 + 14;
    }
    drawFooter(
      doc,
      "Monochrome Compliance",
      "monochrome-compliance.com",
      theme
    );
  }
}

async function paintHighlightsGood(doc, insights, data, theme) {
  await paintInsightsSection(
    doc,
    "Highlights — What’s Going Well",
    insights || [],
    data,
    theme
  );
}

async function paintHighlightsAttention(doc, insights, data, theme) {
  await paintInsightsSection(
    doc,
    "Highlights — Areas for Attention",
    insights || [],
    data,
    theme
  );
}

async function paintHighlightsUrgent(doc, insights, data, theme) {
  await paintInsightsSection(
    doc,
    "Highlights — Urgent Focus",
    insights || [],
    data,
    theme
  );
}

async function drawInsightChart(doc, insight, data, x, y, w, h, theme) {
  const {
    throughputByWeek = [],
    positiveScores = [],
    estVarianceByTeam = [],
  } = data || {};

  const AX = {
    left: 46, // y-axis offset from x
    right: 12,
    top: 14,
    bottom: 28,
    grid: theme.mode === "light" ? 230 : 80,
    axis: theme.mode === "light" ? 120 : 180,
    text: theme.textSecondary,
  };

  // compact visual constants
  const CAPTION_H = 14;
  const CAPTION_FS = 8;

  // replace heavy frame with subtle backdrop
  doc.setDrawColor(theme.mode === "light" ? 230 : 70);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, "S"); // light stroke

  // plot rect
  const px = x + AX.left;
  const py = y + AX.top;
  const pw = w - AX.left - AX.right;
  const ph = h - AX.top - AX.bottom;

  // helpers
  const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
  const pct = (n) => `${Math.round(n)}%`;

  // ---------- SCORE BARS (onTime / qa / generic score) ----------
  if (
    insight.tag === "onTime" ||
    insight.tag === "qa" ||
    insight.tag === "score"
  ) {
    // value lookup
    const label = insight?.payload?.label;
    let val = 0;
    if (label) {
      const found = (positiveScores || []).find((p) =>
        String(p?.label || "")
          .toLowerCase()
          .includes(String(label).toLowerCase())
      );
      val = Number(found?.score || 0);
    } else {
      const key = insight.tag === "onTime" ? "on-time" : "qa";
      const found = (positiveScores || []).find((p) =>
        String(p?.label || "")
          .toLowerCase()
          .includes(key)
      );
      val = Number(found?.score || 0);
    }
    val = clamp(val, 0, 100);

    // --- Chart.js fast path via chartToPng (image embed) ---
    try {
      const labelText =
        insight?.payload?.label ||
        (insight.tag === "qa"
          ? "QA"
          : insight.tag === "onTime"
            ? "On-time"
            : "Score");
      const cfg = {
        type: "bar",
        data: {
          labels: [labelText],
          datasets: [{ data: [val], backgroundColor: "#7856ff" }],
        },
        options: {
          indexAxis: "y",
          responsive: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: {
              min: 0,
              max: 100,
              ticks: { callback: (v) => v + "%" },
              grid: { color: theme.grid || "#e6e8eb" },
            },
            y: { grid: { display: false } },
          },
        },
      };
      const url = await chartToPng(
        cfg,
        Math.round(w),
        Math.round(h - CAPTION_H)
      );
      if (url) {
        // draw chart image in box, leaving room for caption
        doc.addImage(url, "PNG", x, y, w, h - CAPTION_H);

        // Overlay target hairline + delta (use same coordinates as manual layout)
        try {
          const cfgT =
            (typeof window !== "undefined" && window.PULSE_INSIGHT_CONFIG) ||
            {};
          const tOn = Number((cfgT.targets && cfgT.targets.onTime) || 85);
          const tQa = Number((cfgT.targets && cfgT.targets.qa) || 90);
          const target =
            insight.tag === "onTime" ? tOn : insight.tag === "qa" ? tQa : null;
          if (Number.isFinite(target)) {
            const tx = px + (clamp(target, 0, 100) / 100) * pw;
            doc.setDrawColor(150);
            doc.setLineWidth(0.8);
            doc.line(tx, py + 3, tx, py + ph - 3);
            ensureOutfitFont(doc, "normal");
            doc.setFontSize(9);
            doc.setTextColor(AX.text);
            doc.text(`Target ${Math.round(target)}%`, tx + 4, py + 9);
            // Δ vs target (percentage points), shown top-right
            const delta = Math.round(val - target);
            const sign = delta > 0 ? "+" : "";
            ensureOutfitFont(doc, "normal");
            doc.setFontSize(10);
            doc.text(`Δ ${sign}${delta}pp`, x + w - 6, y + 12, {
              align: "right",
            });
            doc.setTextColor(theme.textPrimary);
          }
        } catch {}

        // caption
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(CAPTION_FS);
        doc.setTextColor(theme.textSecondary);
        doc.text(`${labelText} vs target (last window)`, x + 4, y + h - 6);
        doc.setTextColor(theme.textPrimary);
        return; // skip manual drawing path
      }
    } catch {}

    // grid (0,25,50,75,100)
    doc.setDrawColor(AX.grid);
    [0, 25, 50, 75, 100].forEach((t) => {
      const gx = px + (t / 100) * pw;
      doc.line(gx, py, gx, py + ph);
    });

    // axes + ticks
    doc.setDrawColor(AX.axis);
    doc.line(px, py + ph, px + pw, py + ph); // x-axis
    [0, 25, 50, 75, 100].forEach((t) => {
      const tx = px + (t / 100) * pw;
      doc.line(tx, py + ph, tx, py + ph + 3);
      ensureOutfitFont(doc, "normal");
      doc.setFontSize(9);
      doc.setTextColor(AX.text);
      doc.text(`${t}%`, tx - 6, py + ph + 10);
      doc.setTextColor(theme.textPrimary);
    });

    // bar
    const barW = (val / 100) * pw;
    doc.setFillColor(120, 86, 255);
    doc.rect(px, py + ph / 2 - 7, barW, 14, "F");
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(10);
    doc.text(pct(val), px + barW + 6, py + ph / 2 + 3);

    // target marker (uses window.PULSE_INSIGHT_CONFIG if present)
    try {
      const cfg =
        (typeof window !== "undefined" && window.PULSE_INSIGHT_CONFIG) || {};
      const tOn = Number((cfg.targets && cfg.targets.onTime) || 85);
      const tQa = Number((cfg.targets && cfg.targets.qa) || 90);
      const target =
        insight.tag === "onTime" ? tOn : insight.tag === "qa" ? tQa : null;
      if (Number.isFinite(target)) {
        const tx = px + (clamp(target, 0, 100) / 100) * pw;
        doc.setDrawColor(150);
        doc.setLineWidth(0.8);
        doc.line(tx, py + 3, tx, py + ph - 3);
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(9);
        doc.setTextColor(AX.text);
        doc.text(`Target ${Math.round(target)}%`, tx + 4, py + 9);
        // Δ vs target (percentage points), shown top-right
        const delta = Math.round(val - target);
        const sign = delta > 0 ? "+" : "";
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(10);
        doc.text(`Δ ${sign}${delta}pp`, px + pw - 6, py + 12, {
          align: "right",
        });
        doc.setTextColor(theme.textPrimary);
      }
    } catch {}

    // caption
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(CAPTION_FS);
    doc.setTextColor(theme.textSecondary);
    const cap =
      insight.tag === "onTime" ||
      insight.tag === "qa" ||
      insight.tag === "score"
        ? `${insight?.payload?.label || "Score"} vs target (last window)`
        : insight.tag === "variance"
          ? "Estimation variance by team"
          : "Throughput trend (last 10 periods)";
    doc.text(cap, x + 4, y + h - 6);
    doc.setTextColor(theme.textPrimary);

    return;
  }

  // ---------- VARIANCE (stack of team bars with tiny legend) ----------
  if (insight.tag === "variance") {
    const teams = (insight?.payload?.teams || []).map((t) => {
      const obj = (estVarianceByTeam || []).find((r) => r.team === t);
      return { team: t, variance: Number(obj?.variance || 0) };
    });
    const rows = teams.length ? teams : (estVarianceByTeam || []).slice(0, 4);
    if (!rows.length) return;

    const maxVal = Math.max(1, ...rows.map((r) => r.variance || 0));
    const maxAxis = Math.min(100, Math.ceil(maxVal / 25) * 25);

    // --- Chart.js fast path via chartToPng (image embed) ---
    try {
      const cfg = {
        type: "bar",
        data: {
          labels: rows.map((r) => r.team),
          datasets: [
            { data: rows.map((r) => r.variance), backgroundColor: "#7856ff" },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: {
              min: 0,
              max: maxAxis,
              ticks: { callback: (v) => v + "%" },
              grid: { color: theme.grid || "#e6e8eb" },
            },
            y: { grid: { display: false } },
          },
        },
      };
      const url = await chartToPng(
        cfg,
        Math.round(w),
        Math.round(h - CAPTION_H)
      );
      if (url) {
        doc.addImage(url, "PNG", x, y, w, h - CAPTION_H);
        // tiny legend (color key) above left inside plot image area for consistency with manual
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(9);
        doc.setDrawColor(0);
        doc.setFillColor(120, 86, 255);
        // caption
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(CAPTION_FS);
        doc.setTextColor(theme.textSecondary);
        doc.text("Estimation variance by team", x + 4, y + h - 6);
        doc.setTextColor(theme.textPrimary);
        return; // skip manual drawing path
      }
    } catch {}

    // grid (25% steps)
    doc.setDrawColor(AX.grid);
    for (let t = 0; t <= maxAxis; t += 25) {
      const gx = px + (t / maxAxis) * pw;
      doc.line(gx, py, gx, py + ph);
    }

    // axes + x ticks
    doc.setDrawColor(AX.axis);
    doc.line(px, py + ph, px + pw, py + ph);
    for (let t = 0; t <= maxAxis; t += 25) {
      const tx = px + (t / maxAxis) * pw;
      doc.line(tx, py + ph, tx, py + ph + 3);
      ensureOutfitFont(doc, "normal");
      doc.setFontSize(9);
      doc.setTextColor(AX.text);
      doc.text(`${t}%`, tx - 6, py + ph + 10);
      doc.setTextColor(theme.textPrimary);
    }

    // bars + y labels
    const rowH = Math.min(22, (ph - 6) / Math.max(1, rows.length));
    rows.forEach((r, i) => {
      const bw = (Math.max(0, Math.min(maxAxis, r.variance)) / maxAxis) * pw;
      const yy = py + 3 + i * rowH;
      // team label
      ensureOutfitFont(doc, "normal");
      doc.setFontSize(10);
      doc.text(`${r.team}`, x + 6, yy + rowH * 0.65);
      // bar
      doc.setFillColor(120, 86, 255);
      doc.rect(px, yy + 4, bw, rowH - 8, "F");
      // value
      doc.setFontSize(9);
      doc.text(pct(r.variance), px + bw + 6, yy + rowH * 0.65);
    });

    // tiny legend
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(9);
    doc.setDrawColor(0);
    doc.setFillColor(120, 86, 255);
    doc.rect(px, py - 8, 10, 4, "F");
    doc.setTextColor(AX.text);
    doc.text("Variance (%)", px + 14, py - 5);
    doc.setTextColor(theme.textPrimary);

    // caption
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(CAPTION_FS);
    doc.setTextColor(theme.textSecondary);
    const cap =
      insight.tag === "onTime" ||
      insight.tag === "qa" ||
      insight.tag === "score"
        ? `${insight?.payload?.label || "Score"} vs target (last window)`
        : insight.tag === "variance"
          ? "Estimation variance by team"
          : "Throughput trend (last 10 periods)";
    doc.text(cap, x + 4, y + h - 6);
    doc.setTextColor(theme.textPrimary);

    return;
  }

  // ---------- THROUGHPUT (mini line chart with ref line) ----------
  if (insight.tag === "throughput") {
    const s = Array.isArray(throughputByWeek)
      ? throughputByWeek.slice(-10)
      : [];
    if (s.length < 2) {
      ensureOutfitFont(doc, "normal");
      doc.setFontSize(10);
      doc.setTextColor(AX.text);
      doc.text("Not enough recent observations to chart.", px, py + ph / 2);
      doc.setTextColor(theme.textPrimary);
      // caption
      ensureOutfitFont(doc, "normal");
      doc.setFontSize(CAPTION_FS);
      doc.setTextColor(theme.textSecondary);
      doc.text("Throughput trend (last 10 periods)", x + 4, y + h - 6);
      doc.setTextColor(theme.textPrimary);
      return;
    }

    const min = Math.min(...s);
    const max = Math.max(...s);
    const rng = max - min || 1;

    // --- Chart.js fast path via chartToPng (image embed) ---
    try {
      const cfg = {
        type: "line",
        data: {
          labels: s.map((_, i) => String(i + 1)),
          datasets: [
            {
              data: s,
              borderColor: "#7856ff",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.2,
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: {
              grid: { color: theme.grid || "#e6e8eb" },
              ticks: { display: false },
            },
            y: {
              min,
              max,
              grid: { color: theme.grid || "#e6e8eb" },
              ticks: { callback: (v) => String(v) },
            },
          },
        },
      };
      const url = await chartToPng(
        cfg,
        Math.round(w),
        Math.round(h - CAPTION_H)
      );
      if (url) {
        // draw chart image in box, leaving room for caption
        doc.addImage(url, "PNG", x, y, w, h - CAPTION_H);

        // Prior-avg overlay (reuse your existing calc)
        const all = Array.isArray(throughputByWeek) ? throughputByWeek : [];
        if (all.length >= 6) {
          const prev = all.slice(-13, -10);
          const priorAvg = prev.length
            ? prev.reduce((a, n) => a + Number(n || 0), 0) / prev.length
            : null;
          if (priorAvg !== null) {
            // draw a subtle reference line at priorAvg using jsPDF so it sits over the image
            const px = x + 46,
              py = y + 14,
              pw = w - 46 - 12,
              ph = h - 14 - CAPTION_H - 14;
            const yRef = py + (ph - ((priorAvg - min) / (rng || 1)) * ph);
            doc.setDrawColor(150);
            doc.setLineWidth(0.8);
            doc.line(px, yRef, px + pw, yRef);

            // trend arrow vs prior
            const last = s[s.length - 1];
            const diffPct = ((last - priorAvg) / (priorAvg || 1)) * 100;
            const arrow = diffPct >= 0 ? "▲" : "▼";
            const txt = `${arrow} ${Math.abs(Math.round(diffPct))}% vs prior`;
            ensureOutfitFont(doc, "normal");
            doc.setFontSize(10);
            doc.text(txt, x + w - 6, y + 12, { align: "right" });
          }
        }

        // caption
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(CAPTION_FS);
        doc.setTextColor(theme.textSecondary);
        doc.text("Throughput trend (last 10 periods)", x + 4, y + h - 6);
        doc.setTextColor(theme.textPrimary);
        return; // skip manual drawing path
      }
    } catch {}

    // grid: 4 bands
    doc.setDrawColor(AX.grid);
    for (let i = 0; i <= 4; i++) {
      const gy = py + (i / 4) * ph;
      doc.line(px, gy, px + pw, gy);
    }

    // y-axis and labels
    doc.setDrawColor(AX.axis);
    doc.line(px, py, px, py + ph);
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(9);
    doc.setTextColor(AX.text);
    doc.text(String(Math.round(max)), x + 6, py + 3);
    doc.text(String(Math.round(min)), x + 6, py + ph);
    doc.setTextColor(theme.textPrimary);

    // sparkline
    doc.setLineWidth(1.2);
    doc.setDrawColor(120, 86, 255);
    let px0 = px,
      py0 = py + ph - ((s[0] - min) / rng) * ph;
    for (let i = 1; i < s.length; i++) {
      const nx = px + (i * pw) / (s.length - 1);
      const ny = py + ph - ((s[i] - min) / rng) * ph;
      doc.line(px0, py0, nx, ny);
      px0 = nx;
      py0 = ny;
    }

    // prior 3‑week average from the broader series if available
    const all = Array.isArray(throughputByWeek) ? throughputByWeek : [];
    if (all.length >= 6) {
      const prev = all.slice(-13, -10);
      const priorAvg = prev.length
        ? prev.reduce((a, n) => a + Number(n || 0), 0) / prev.length
        : null;
      if (priorAvg !== null) {
        const yRef = py + ph - ((priorAvg - min) / rng) * ph;
        doc.setDrawColor(150);
        doc.setLineWidth(0.8);
        doc.line(px, yRef, px + pw, yRef);
        ensureOutfitFont(doc, "normal");
        doc.setFontSize(9);
        doc.setTextColor(AX.text);
        doc.text("Prior avg", px + 4, yRef - 2);
        doc.setTextColor(theme.textPrimary);

        // trend arrow vs prior avg
        const last = s[s.length - 1];
        const diffPct = ((last - priorAvg) / (priorAvg || 1)) * 100;
        const arrow = diffPct >= 0 ? "▲" : "▼";
        const txt = `${arrow} ${Math.abs(Math.round(diffPct))}% vs prior`;
        doc.setFontSize(10);
        doc.text(txt, px + pw - 6, py + 12, { align: "right" });
      }
    }

    // caption
    ensureOutfitFont(doc, "normal");
    doc.setFontSize(CAPTION_FS);
    doc.setTextColor(theme.textSecondary);
    doc.text("Throughput trend (last 10 periods)", x + 4, y + h - 6);
    doc.setTextColor(theme.textPrimary);
    return;
  }
}

// --- Default placeholder data (used if no real data passed) -----------------

function normaliseData(data) {
  // Strict passthrough: ensure arrays/objects exist, but do not fabricate any placeholder data.
  const d = { ...(data || {}) };
  if (!Array.isArray(d.throughputByWeek)) d.throughputByWeek = [];
  if (!Array.isArray(d.estimationPlanned)) d.estimationPlanned = [];
  if (!Array.isArray(d.estimationActual)) d.estimationActual = [];
  if (!Array.isArray(d.estimationLabels)) d.estimationLabels = [];
  if (!Array.isArray(d.positiveScores)) d.positiveScores = [];
  if (!Array.isArray(d.estVarianceByTeam)) d.estVarianceByTeam = [];
  d.heatmap = d.heatmap || { rows: [], cols: 0, values: [] };
  return d;
}

function formatDateAU(d = new Date()) {
  // Keep it simple and local; no extra libs.
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function drawBrandBand(doc, theme) {
  const { w, h } = pageSize(doc);
  const rgb = hexToRgb(theme.brandBand);
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, 0, w, 24, "F");
  doc.setDrawColor(theme.mode === "dark" ? 70 : 230);
  doc.line(MARGIN, h - 30, w - MARGIN, h - 30);
}

function drawSampleWatermark(doc, theme) {
  const txt = "SAMPLE";
  const { w, h } = pageSize(doc);
  try {
    if (doc.GState) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.08 }));
    }
  } catch (_) {}
  doc.setFont("helvetica", "bold");
  doc.setFontSize(120);
  const rgb = hexToRgb(theme.textSecondary || "#999");
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(txt, w / 2, h / 2, { angle: 315, align: "center" });
  try {
    doc.restoreGraphicsState && doc.restoreGraphicsState();
  } catch (_) {}
}

async function paintCoverPage(doc, cover, primer, brand, theme) {
  // Top brand band
  drawBrandBand(doc, theme);
  const { w, h } = pageSize(doc);
  const wantsSample = Boolean(cover && cover.watermarkSample);

  // Title (centered)
  ensureOutfitFont(doc, "bold");
  doc.setFontSize(36);
  doc.setTextColor(theme.textPrimary);
  const titleText = (() => {
    const t = (cover && cover.title) || "Pulse Team Performance Insights";
    return wantsSample && !/\(Sample\)/i.test(t) ? `${t} (Sample)` : t;
  })();
  doc.text(titleText, w / 2, h * 0.35, { align: "center" });

  // Subtitle (centered, wrapped)
  ensureOutfitFont(doc, "normal");
  doc.setFontSize(14);
  doc.setTextColor(theme.textSecondary);
  const tagline =
    (cover && cover.subtitle) ||
    "From spreadsheets to clarity. AI-driven analysis of team timesheets for executive insight.";
  const wrap = doc.splitTextToSize(tagline, Math.min(460, w - MARGIN * 2));
  doc.text(wrap, w / 2, h * 0.41, { align: "center" });

  // Metadata line [ Sector | Audience | Time horizon ] (centered)
  const parts = [
    cover?.chips?.sector || primer?.sector
      ? `Sector: ${cover?.chips?.sector || primer?.sector}`
      : null,
    cover?.chips?.audience || primer?.audience
      ? `Audience: ${cover?.chips?.audience || primer?.audience}`
      : null,
    cover?.chips?.horizon || primer?.timeHorizon
      ? `Time horizon: ${cover?.chips?.horizon || primer?.timeHorizon}`
      : null,
  ].filter(Boolean);
  if (parts.length) {
    doc.setFontSize(11);
    const chipsLine = `[ ${parts.join(" | ")} ]`;
    doc.text(chipsLine, w / 2, h * 0.48, { align: "center" });
  }

  if (wantsSample) {
    drawSampleWatermark(doc, theme);
  }

  // Bottom-right stamp (product, company, date)
  doc.setFontSize(11);
  doc.setTextColor(theme.textSecondary);
  const dateStr = formatDateAU();
  doc.text(`${brand?.product || "Pulse"}`, w - MARGIN, h - 54, {
    align: "right",
  });
  doc.text(`${brand?.company || "Monochrome Compliance"}`, w - MARGIN, h - 40, {
    align: "right",
  });
  doc.text(`${dateStr}`, w - MARGIN, h - 26, { align: "right" });
  doc.setTextColor(theme.textPrimary);
}

async function paintAboutPage(doc, registrationUrl, brand, theme) {
  drawHeader(doc, "About Pulse", brand?.product, theme);

  ensureOutfitFont(doc, "normal");

  // About text (narrative, no icon bullets)
  doc.setFont("helvetica", "normal");
  const aboutIntro = [
    "Pulse replaces the reliance on static spreadsheets with a single, intelligent source of truth for engagements, resources, and budgets.",
    "By combining real‑time utilisation data with AI‑driven analysis, it gives leaders immediate visibility into what is working well and where intervention is required.",
  ].join("\n\n");
  let y = textBlock(doc, sanitizeText(aboutIntro), MARGIN, 96, 520, 18, 12);

  const aboutFeatures = [
    "What you can expect:",
    "• Clear executive summaries focused on outcomes and risks.",
    "• Early warning signals drawn from blockers, capacity and estimation trends.",
    "• Lightweight timesheets that feed planning accuracy, not paperwork.",
  ].join("\n\n");
  y = textBlock(doc, sanitizeText(aboutFeatures), MARGIN, y + 18, 520, 18, 12);

  // CTA paragraph
  const cta =
    "From spreadsheets to clarity. Join Pulse for a live view of your team’s reality — and the next best action.";
  y = textBlock(doc, sanitizeText(cta), MARGIN, y + 24, 520);

  // Registration + QR on the right
  doc.setFontSize(10);
  doc.text("Registration:", 600, 96);
  doc.text(
    registrationUrl || "https://www.monochrome-compliance.com/pulse/join",
    600,
    110
  );
  const qrDataUrl = await QRCode.toDataURL(
    registrationUrl || "https://www.monochrome-compliance.com/pulse/join"
  );
  doc.addImage(qrDataUrl, "PNG", 600, 140, 160, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Scan to Join", 680, 310, { align: "center" });

  drawFooter(doc, brand?.company, "monochrome-compliance.com", theme);
}

// --- Public API --------------------------------------------------------------

export async function buildPulseInsightsPdf(options = {}) {
  assertBrowserEnv();

  const {
    cover = {},
    primer = {},
    data: rawData,
    registrationUrl = "https://www.monochrome-compliance.com/pulse/join",
    brand = { product: "Pulse", company: "Monochrome Compliance" },
    theme: themeOpt = {},
    includeAbout = true,
  } = options;

  const theme = normTheme(themeOpt); // <-- NEW: normalise with fallbacks
  const data = normaliseData(rawData);

  // Guard: block export if no timesheet-derived data present
  const hasAnyData =
    (Array.isArray(data.throughputByWeek) &&
      data.throughputByWeek.length > 0) ||
    (Array.isArray(data.estimationPlanned) &&
      data.estimationPlanned.length > 0) ||
    (Array.isArray(data.estimationActual) &&
      data.estimationActual.length > 0) ||
    (Array.isArray(data.estimationLabels) &&
      data.estimationLabels.length > 0) ||
    (Array.isArray(data.positiveScores) && data.positiveScores.length > 0) ||
    (Array.isArray(data.estVarianceByTeam) &&
      data.estVarianceByTeam.length > 0) ||
    (Array.isArray(data.urgent) && data.urgent.length > 0) ||
    (data.heatmap &&
      Array.isArray(data.heatmap.rows) &&
      data.heatmap.rows.length > 0 &&
      Number.isFinite(data.heatmap.cols) &&
      data.heatmap.cols > 0);
  if (!hasAnyData) {
    throw new Error(
      "No timesheet-derived metrics found. Upload a file and run analysis before exporting."
    );
  }

  const normCover = {
    title: (cover && cover.title) || "Pulse Team Performance Insights",
    subtitle:
      (cover && cover.subtitle) ||
      "AI-driven analysis of team timesheets for executive insight.",
    chips: {
      sector: primer.sector || "",
      audience: primer.audience || "",
      horizon: primer.timeHorizon || "",
    },
    watermarkSample: Boolean(cover && cover.watermarkSample),
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  // Cover
  await paintCoverPage(doc, normCover, primer, brand, theme);

  // Intro + Primers combined (portrait)
  doc.addPage("a4", "portrait");
  await paintIntroPrimersPortrait(doc, options.introduction, primer, theme);

  // Executive Summary (portrait) — collates Good/Attention/Urgent into short narrative
  const narratives = buildExecutiveSummaryNarrative(
    options.insights || {},
    primer,
    options.execSummary || null
  );

  doc.addPage("a4", "portrait");
  await paintExecutiveSummaryPortrait(doc, narratives, theme);

  // Highlights sections (landscape), each with charts per statement
  const ins = options.insights || { good: [], attention: [], urgent: [] };
  if ((ins.good || []).length) {
    doc.addPage("a4", "landscape");
    await paintHighlightsGood(doc, ins.good, data, theme);
  }
  if ((ins.attention || []).length) {
    doc.addPage("a4", "landscape");
    await paintHighlightsAttention(doc, ins.attention, data, theme);
  }
  if ((ins.urgent || []).length) {
    doc.addPage("a4", "landscape");
    await paintHighlightsUrgent(doc, ins.urgent, data, theme);
  }

  if (includeAbout) {
    doc.addPage("a4", "landscape");
    await paintAboutPage(doc, registrationUrl, brand, theme);
  }

  return doc.output("blob");
}

export async function downloadPulseInsightsPdf(opts = {}) {
  const blob = await buildPulseInsightsPdf(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Pulse_Team_Insights.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function getPulseInsightsPdfBlobUrl(opts = {}) {
  assertBrowserEnv();
  const blob = await buildPulseInsightsPdf(opts); // already returns a Blob
  return URL.createObjectURL(blob); // iframe-friendly URL
}

export function revokePdfBlobUrl(url) {
  try {
    URL.revokeObjectURL(url);
  } catch {}
}
