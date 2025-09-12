import Papa from "papaparse";

/**
 * parseTimesheetsCsv(file: File) -> Promise<rows[]>
 */
export function parseTimesheetsCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (res) => resolve(res.data),
      error: reject,
    });
  });
}

/**
 * aggregateForPdf(rows) -> { throughputByWeek, estimationPlanned, estimationActual, positiveScores, estVarianceByTeam, heatmap }
 * rows: [{ date, team, activity, planned_hours, actual_hours, status, started_on_time, qa_pass, handoff_count }]
 */
export function aggregateForPdf(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  // Normalise date & week keys
  const toWeekKey = (d) => {
    const dt = new Date(d);
    // ISO week-ish label
    const onejan = new Date(dt.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((dt - onejan) / 86400000 + onejan.getDay() + 1) / 7
    );
    return `${dt.getFullYear()}-W${String(week).padStart(2, "0")}`;
  };

  // Grouping helpers
  const byWeek = new Map();
  const estByActivity = new Map(); // activity -> { planned: sum, actual: sum }
  const byTeam = new Map(); // team -> { planned: sum, actual: sum, count: n }
  let onTime = 0,
    totalStarted = 0,
    qaPass = 0,
    totalQa = 0,
    handoffs = 0;

  rows.forEach((r) => {
    if (!r.date) return;
    const wk = toWeekKey(r.date);
    byWeek.set(wk, (byWeek.get(wk) || 0) + (r.status === "Done" ? 1 : 0));

    // Estimation per activity
    const key = r.activity || "Activity";
    const cur = estByActivity.get(key) || { planned: 0, actual: 0 };
    cur.planned += Number(r.planned_hours || 0);
    cur.actual += Number(r.actual_hours || 0);
    estByActivity.set(key, cur);

    // Team variance
    const t = r.team || "Team";
    const tv = byTeam.get(t) || { planned: 0, actual: 0, count: 0 };
    tv.planned += Number(r.planned_hours || 0);
    tv.actual += Number(r.actual_hours || 0);
    tv.count += 1;
    byTeam.set(t, tv);

    // Scores
    if (r.started_on_time !== undefined) {
      totalStarted += 1;
      if (r.started_on_time) onTime += 1;
    }
    if (r.qa_pass !== undefined) {
      totalQa += 1;
      if (r.qa_pass) qaPass += 1;
    }
    handoffs += Number(r.handoff_count || 0);
  });

  // Throughput by chronological weeks (limit 8 for the chart)
  const weekKeys = Array.from(byWeek.keys()).sort();
  const throughputByWeek = weekKeys.slice(-8).map((k) => byWeek.get(k));

  // Estimation accuracy: take top 5 activities by planned sum
  const estArr = Array.from(estByActivity.entries())
    .map(([activity, v]) => ({ activity, ...v }))
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 5);
  const estimationLabels = estArr.map((x) => x.activity);
  const estimationPlanned = estArr.map((x) => Math.round(x.planned));
  const estimationActual = estArr.map((x) => Math.round(x.actual));

  // Positive scores (0–100). Velocity = scaled throughput vs median.
  const velMedian = median(throughputByWeek);
  const velLast = throughputByWeek[throughputByWeek.length - 1] || 0;
  const velocityScore = clamp(
    Math.round((velLast / (velMedian || 1)) * 80 + 20),
    0,
    100
  );

  const onTimeScore = clamp(
    Math.round((onTime / (totalStarted || 1)) * 100),
    0,
    100
  );
  const qaScore = clamp(Math.round((qaPass / (totalQa || 1)) * 100), 0, 100);
  const handoffScore = clamp(
    100 - Math.round((handoffs / (rows.length || 1)) * 50),
    0,
    100
  );

  const positiveScores = [
    { label: "Velocity", score: velocityScore },
    { label: "On-time start", score: onTimeScore },
    { label: "Handoffs", score: handoffScore },
    { label: "QA pass", score: qaScore },
  ];

  // Estimation variance by team (%)
  const estVarianceByTeam = Array.from(byTeam.entries())
    .map(([team, v]) => {
      const planned = v.planned || 0,
        actual = v.actual || 0;
      const variance =
        planned === 0 ? 0 : Math.abs(((actual - planned) / planned) * 100);
      return { team, variance: Math.round(variance) };
    })
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 4);

  // Heatmap: rows=teams, cols=last 8 weeks, value = normalised load (actual hours)
  const teamNames = Array.from(byTeam.keys()).slice(0, 6);
  const weeks8 = weekKeys.slice(-8);
  const heatValues = [];
  const maxLoad = Math.max(1, ...rows.map((r) => Number(r.actual_hours || 0)));
  teamNames.forEach((t) => {
    weeks8.forEach((wk) => {
      const load = rows
        .filter((r) => (r.team || "Team") === t && toWeekKey(r.date) === wk)
        .reduce((sum, r) => sum + Number(r.actual_hours || 0), 0);
      heatValues.push(clamp(load / maxLoad, 0, 1));
    });
  });

  return {
    throughputByWeek,
    estimationLabels,
    estimationPlanned,
    estimationActual,
    positiveScores,
    estVarianceByTeam,
    heatmap: { rows: teamNames, cols: weeks8.length || 8, values: heatValues },
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
