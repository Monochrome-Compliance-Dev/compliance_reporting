// src/features/pulse/maximiser/insight_augmenter.js
// Frontend-only insight augmenter. Consumes FE aggregates and returns
// { good: Insight[], attention: Insight[], urgent: Insight[] }
// Each insight has shape: { text, tag, payload }
// tag ∈ ['throughput','onTime','qa','variance','score']

// src/features/pulse/maximiser/insight_augmenter.js
// Beefed-up, FE-only insight augmenter. Deterministic (no LLM).
// Returns { good, attention, urgent } with narrative statements + chart tags.

//
// ---------- Config (tweak without touching logic) ----------
//
export const INSIGHT_CONFIG = {
  windows: { recent: 3, prior: 3, minPoints: 6 },
  targets: {
    onTime: 85, // %
    qa: 90, // %
    throughputGrowthGood: 8, // % recent vs prior
    throughputDeclineWarn: -6, // %
  },
  varianceBands: {
    attention: 18, // % team variance to flag attention
    urgent: 35, // % team variance to flag urgent
  },
  limits: {
    maxAttentionScores: 2, // pick worst N scores for attention
    maxTeamsVariance: 3, // top-N variant teams to mention
    minSeriesForTrend: 6,
  },
};

//
// ---------- Small helpers ----------
//
function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.reduce((s, n) => s + Number(n || 0), 0) / arr.length;
}

function rollingAvg(series, n, which = "tail") {
  if (!Array.isArray(series) || series.length < n) return 0;
  if (which === "head") return avg(series.slice(0, n));
  if (which === "tail") return avg(series.slice(-n));
  return 0;
}

function pctDelta(curr, base) {
  if (!base) return 0;
  return Math.round(((curr - base) / base) * 100);
}

function clampPct(n) {
  const v = Math.round(Number(n || 0));
  return Math.max(-999, Math.min(999, v));
}

function getScore(positiveScores, labelPart) {
  const l = String(labelPart).toLowerCase();
  const f = (positiveScores || []).find((p) =>
    String(p?.label || "")
      .toLowerCase()
      .includes(l)
  );
  return Number(f?.score) || 0;
}

function topVarianceTeams(estVarianceByTeam, min = 0, max = 3) {
  return (Array.isArray(estVarianceByTeam) ? estVarianceByTeam : [])
    .filter((t) => Number.isFinite(t?.variance) && t.variance >= min)
    .sort((a, b) => b.variance - a.variance)
    .slice(0, max);
}

function overallVariance(estVarianceByTeam) {
  if (!Array.isArray(estVarianceByTeam) || !estVarianceByTeam.length) return 0;
  return avg(estVarianceByTeam.map((t) => Number(t?.variance || 0)));
}

function confidenceFromSamples(series, need) {
  const pts = Array.isArray(series) ? series.length : 0;
  if (pts >= need + 3) return "high";
  if (pts >= need) return "medium";
  return "low";
}

function joinList(items, sep = ", ") {
  return (items || []).filter(Boolean).join(sep);
}

//
// ---------- Main augmenter ----------
//
export function buildInsights(aggregates = {}) {
  const C = INSIGHT_CONFIG;
  const {
    throughputByWeek = [],
    positiveScores = [],
    estVarianceByTeam = [],
    estimationLabels = [],
    estimationPlanned = [],
    estimationActual = [],
  } = aggregates || {};

  const insights = { good: [], attention: [], urgent: [] };

  // ---- Throughput trend (Good/Attention) ----
  const haveTrend =
    (throughputByWeek || []).length >= C.limits.minSeriesForTrend;
  if (haveTrend) {
    const recent = rollingAvg(throughputByWeek, C.windows.recent, "tail");
    const prior = rollingAvg(throughputByWeek, C.windows.prior, "head");
    const g = clampPct(pctDelta(recent, prior));
    const conf = confidenceFromSamples(
      throughputByWeek,
      C.limits.minSeriesForTrend
    );

    if (g >= C.targets.throughputGrowthGood) {
      insights.good.push({
        text:
          `Delivery velocity has strengthened over the last ${C.windows.recent}–${C.windows.recent + C.windows.prior} weeks ` +
          `(trend up ~${g}%). ` +
          `This momentum will help schedule adherence and capacity forecasts. ` +
          note(conf),
        tag: "throughput",
      });
    } else if (g <= C.targets.throughputDeclineWarn) {
      insights.attention.push({
        text:
          `Delivery velocity has eased in the recent window (change ~${g}%). ` +
          `Stabilise flow by removing blockers and confirming priorities. ` +
          note(conf),
        tag: "throughput",
      });
    }
  }

  // ---- Scores (On-time / QA / other) ----
  const onTime = getScore(positiveScores, "on-time");
  const qa = getScore(positiveScores, "qa");

  // Good: recognise the strongest score >= target
  const topPos = (positiveScores || [])
    .slice()
    .sort((a, b) => b.score - a.score)[0];
  if (topPos && Number.isFinite(topPos.score) && topPos.score >= 70) {
    const lbl = topPos.label;
    insights.good.push({
      text:
        `${lbl} is performing strongly (~${Math.round(topPos.score)}%). ` +
        implicationFor(lbl, true),
      tag: tagForScore(lbl),
      payload: { label: lbl },
    });
  }

  // Attention: the two weakest scores (below targets)
  const weakest = (positiveScores || [])
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, C.limits.maxAttentionScores);

  weakest.forEach((s) => {
    if (!Number.isFinite(s?.score)) return;
    const tgt = targetForLabel(s.label, C.targets);
    if (tgt && s.score < tgt) {
      const deltaToTarget = clampPct(s.score - tgt);
      insights.attention.push({
        text:
          `${s.label} is below target (${Math.round(s.score)}% vs target ${tgt}%). ` +
          improvementCue(s.label, deltaToTarget),
        tag: tagForScore(s.label),
        payload: { label: s.label },
      });
    }
  });

  // Urgent: very low on-time / QA
  if (onTime && onTime < Math.min(60, C.targets.onTime - 25)) {
    insights.urgent.push({
      text:
        `On‑time start is critically low (~${Math.round(onTime)}%). ` +
        `Re-check intake readiness, dependencies and gatekeeping before commencing work.`,
      tag: "onTime",
    });
  }
  if (qa && qa < Math.min(65, C.targets.qa - 20)) {
    insights.urgent.push({
      text:
        `QA pass rate is critically low (~${Math.round(qa)}%). ` +
        `Focus on coverage, defect triage and release criteria before pushing volume.`,
      tag: "qa",
    });
  }

  // ---- Estimation variance (Attention/Urgent + comparatives) ----
  const overallVar = overallVariance(estVarianceByTeam);
  const urgentTeams = topVarianceTeams(
    estVarianceByTeam,
    C.varianceBands.urgent,
    C.limits.maxTeamsVariance
  );
  const attnTeams = topVarianceTeams(
    estVarianceByTeam,
    C.varianceBands.attention,
    C.limits.maxTeamsVariance
  ).filter((t) => !urgentTeams.find((u) => u.team === t.team));

  if (urgentTeams.length) {
    const list = urgentTeams
      .map((t) => `${t.team} (~${Math.round(t.variance)}%)`)
      .join(", ");
    insights.urgent.push({
      text:
        `Extreme estimation variance in ${list} (overall ~${Math.round(overallVar)}%). ` +
        `Re‑estimate remaining scope and reset plan alignment.`,
      tag: "variance",
      payload: { teams: urgentTeams.map((t) => t.team) },
    });
  }
  if (attnTeams.length) {
    const list = attnTeams
      .map((t) => `${t.team} (~${Math.round(t.variance)}%)`)
      .join(", ");
    insights.attention.push({
      text:
        `High estimation variance observed in ${list} (overall ~${Math.round(overallVar)}%). ` +
        `Tighten backlog refinement and estimation cadence.`,
      tag: "variance",
      payload: { teams: attnTeams.map((t) => t.team) },
    });
  }

  return insights;

  //
  // ----- Local phrasing helpers (tiny NLG) -----
  //
  function note(conf) {
    if (conf === "low") return " (limited recent data).";
    if (conf === "medium") return " (moderate evidence).";
    return ""; // high
  }

  function tagForScore(label) {
    const l = String(label).toLowerCase();
    if (l.includes("on-time")) return "onTime";
    if (l.includes("qa")) return "qa";
    return "score";
  }

  function targetForLabel(label, targets) {
    const l = String(label).toLowerCase();
    if (l.includes("on-time")) return targets.onTime;
    if (l.includes("qa")) return targets.qa;
    return null; // other positiveScores have no strict target here
  }

  function implicationFor(label, positive) {
    const l = String(label).toLowerCase();
    if (l.includes("on-time")) {
      return positive
        ? "Stable start discipline reduces downstream rework and protects timelines."
        : "Raising start discipline will reduce downstream rework.";
    }
    if (l.includes("qa")) {
      return positive
        ? "Strong QA keeps defect carry‑over low and protects customer experience."
        : "Strengthening QA will lower defect carry‑over.";
    }
    return positive
      ? "This supports predictable delivery and clearer stakeholder communication."
      : "Improvement here will make delivery more predictable.";
  }

  function improvementCue(label, delta) {
    const l = String(label).toLowerCase();
    const up = delta < 0 ? Math.abs(delta) : 0;
    if (l.includes("on-time")) {
      return up
        ? `Raise on‑time start by ~${up}% through clearer ready‑to‑start criteria and dependency checks.`
        : `Focus on ready‑to‑start criteria and dependency checks.`;
    }
    if (l.includes("qa")) {
      return up
        ? `Lift QA by ~${up}% via coverage gates, code review and defect triage.`
        : `Lift QA via coverage gates, code review and defect triage.`;
    }
    return "Address root causes and define clear, testable acceptance criteria.";
  }
}
