// Pulse Maximiser — Client-only demo widget (no backend required)
// Purpose: lightweight, interactive hook for the landing page.
// - Users can download a sample CSV, re-upload it (or their own), and see insights
// - All parsing & calculations are done in-browser
// - No React import required for modern JSX

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsIcon from "@mui/icons-material/Groups";

import { generateAiSummaries } from "./aiSummary";

// --- Sample CSV (kept tiny but realistic). Columns are simple & documented below.
// Columns: date,team,role,person,task,estimate_hours,actual_hours,billable
// Notes:
// - Use ISO dates so week grouping is deterministic
// - Mixed teams/people to make the insights interesting
const SAMPLE_CSV = `date,team,role,person,task,estimate_hours,actual_hours,billable
2025-08-18,Core,Developer,Alice,Feature A,6,8,yes
2025-08-18,Core,Developer,Bob,Feature B,5,4,yes
2025-08-19,Core,QA,Sam,Test A,4,5,no
2025-08-20,API,Developer,Jo,Endpoint X,6,9,yes
2025-08-20,API,Developer,Alice,Bugfix C,3,3,yes
2025-08-21,API,Designer,Eve,UI Polish,4,6,no
2025-08-22,Core,Developer,Bob,Refactor D,5,7,yes
2025-08-25,Core,Developer,Alice,Feature E,8,10,yes
2025-08-26,Core,Developer,Bob,Spike F,4,6,no
2025-08-27,API,Developer,Jo,Endpoint Y,6,6,yes
2025-08-28,API,QA,Sam,Load Test,5,7,no
2025-08-29,API,Designer,Eve,Icons,3,4,no`;
// --- Seeded RNG utils (deterministic per seed)
function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function randBetween(rng, min, max) {
  return min + (max - min) * rng();
}
function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function toISODate(d) {
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString().slice(0, 10);
}

// Scenario knobs
const SCENARIOS = {
  cruising: {
    rowsMin: 35,
    rowsMax: 45,
    deltaScale: 1.5,
    deltaBias: -0.4, // slightly under estimate
    nonBillable: 0.14,
    burnoutWeeks: 0,
    burnoutHoursTargets: [],
  },
  mixed: {
    rowsMin: 45,
    rowsMax: 55,
    deltaScale: 3.0,
    deltaBias: -0.3,
    nonBillable: 0.22,
    burnoutWeeks: 1,
    burnoutHoursTargets: [48],
  },
  onfire: {
    rowsMin: 55,
    rowsMax: 70,
    deltaScale: 6.0,
    deltaBias: -0.1,
    nonBillable: 0.3,
    burnoutWeeks: 2,
    burnoutHoursTargets: [52, 58, 62],
  },
};

// Generate rows shaped exactly like the CSV parser would produce
function generateMockRows(scenario = "cruising", seed = Date.now()) {
  const cfg = SCENARIOS[scenario] || SCENARIOS.cruising;
  const rng = mulberry32((seed >>> 0) & 0xffffffff);

  const teams = ["Core", "API", "Design"];
  const roles = ["Developer", "QA", "Designer"];
  const people = {
    Core: ["Alice", "Bob", "Sam"],
    API: ["Jo", "Kai"],
    Design: ["Eve"],
  };

  // Use the last two weeks as a window
  const today = new Date();
  const start = addDays(today, -13);

  const totalRows =
    Math.floor(randBetween(rng, cfg.rowsMin, cfg.rowsMax + 1)) | 0;

  const rows = [];
  // Spread rows across ~10 working days
  for (let i = 0; i < totalRows; i++) {
    // pick a day in the last 14 days, bias toward weekdays
    let dayOffset = Math.floor(rng() * 14);
    let d = addDays(start, dayOffset);
    // ensure weekday (Mon-Fri); if weekend, nudge to nearest weekday
    const wd = d.getDay();
    if (wd === 0) d = addDays(d, 1);
    if (wd === 6) d = addDays(d, -1);

    const team = pick(rng, teams);
    const role = pick(rng, roles);
    const person = pick(rng, people[team]);
    const estimate = Math.max(1, Math.round(randBetween(rng, 2, 8)));
    const delta = (rng() + cfg.deltaBias) * cfg.deltaScale; // negative bias makes some under
    const actual = Math.max(0.5, estimate + delta);
    const billable = rng() < cfg.nonBillable;

    rows.push({
      date: toISODate(d),
      team,
      role,
      person,
      task: `${team} work ${Math.floor(rng() * 900 + 100)}`,
      estimate_hours: estimate.toFixed(2),
      actual_hours: actual.toFixed(2),
      billable: billable ? "yes" : "no",
    });
  }

  // Sprinkle burnout by inflating totals for selected person-weeks
  if (cfg.burnoutWeeks > 0) {
    // pick some (person, week) targets and push them over the threshold by adding "Catch-up" rows
    const burnoutCandidates = [];
    teams.forEach((t) => {
      people[t].forEach((p) => burnoutCandidates.push({ team: t, person: p }));
    });
    const chosen = new Set();
    let attempts = 0;
    while (chosen.size < cfg.burnoutWeeks && attempts < 10) {
      chosen.add(pick(rng, burnoutCandidates).person + "|" + pick(rng, teams));
      attempts++;
    }
    const targets = cfg.burnoutHoursTargets.length
      ? cfg.burnoutHoursTargets
      : [48];

    const weekKey = (iso) => getWeekKey(iso);

    // compute hours by person-week
    const hoursByPW = new Map();
    for (const r of rows) {
      const key = `${r.person}|${weekKey(r.date)}`;
      hoursByPW.set(key, (hoursByPW.get(key) || 0) + Number(r.actual_hours));
    }

    let tIdx = 0;
    chosen.forEach((combo) => {
      const [person] = combo.split("|");
      // choose a random existing week for this person
      const weeks = Array.from(
        new Set(
          rows.filter((r) => r.person === person).map((r) => weekKey(r.date))
        )
      );
      if (!weeks.length) return;
      const w = pick(rng, weeks);
      const key = `${person}|${w}`;
      const current = hoursByPW.get(key) || 0;
      const target = targets[tIdx % targets.length];
      tIdx++;
      if (current < target) {
        const needed = target - current;
        // add one or two catch-up entries to reach target
        const bump1 = Math.min(
          needed,
          randBetween(rng, 2.5, Math.min(6, needed))
        );
        const bump2 = needed - bump1;
        const anyRow = rows.find((r) => r.person === person);
        if (anyRow) {
          const d = anyRow.date;
          rows.push({
            date: d,
            team: anyRow.team,
            role: anyRow.role,
            person,
            task: "Catch-up work",
            estimate_hours: "0.50",
            actual_hours: bump1.toFixed(2),
            billable: "yes",
          });
          if (bump2 > 0.25) {
            rows.push({
              date: d,
              team: anyRow.team,
              role: anyRow.role,
              person,
              task: "Urgent support",
              estimate_hours: "0.25",
              actual_hours: bump2.toFixed(2),
              billable: "no",
            });
          }
        }
      }
    });
  }

  return rows;
}

// --- Minimal CSV parser that supports quoted fields and commas within quotes
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      // Toggle inQuotes or escape double quote inside quotes
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur !== "" || row.length) {
        row.push(cur);
        rows.push(row);
      }
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  // Convert to objects using header row
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.length && r.some((c) => String(c).trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
      return obj;
    });
}

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pulse-maximiser-sample.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getWeekKey(isoDate) {
  // Returns YYYY-Www (ISO week-ish grouping; good enough for demo)
  const d = new Date(isoDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "unknown";
  const year = d.getUTCFullYear();
  const oneJan = new Date(Date.UTC(year, 0, 1));
  const dayMs = 24 * 60 * 60 * 1000;
  const week =
    Math.floor(((d - oneJan) / dayMs + oneJan.getUTCDay() + 6) / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// --- Insight calculations
function computeInsights(rows) {
  if (!rows || !rows.length) return null;

  // Normalize and coerce numbers
  const items = rows.map((r) => ({
    date: r.date,
    team: r.team || "—",
    role: r.role || "—",
    person: r.person || "—",
    task: r.task || "—",
    estimate: Number(r.estimate_hours || 0),
    actual: Number(r.actual_hours || 0),
    billable: String(r.billable || "").toLowerCase() === "yes",
    week: getWeekKey(r.date),
  }));

  const valid = items.filter(
    (x) => Number.isFinite(x.estimate) && Number.isFinite(x.actual)
  );
  if (!valid.length) return null;

  // Estimation vs Reality
  const perTask = valid.map((x) => ({
    overrun: x.actual - x.estimate, // +ve means took longer
    absPctErr:
      x.estimate > 0 ? Math.abs(x.actual - x.estimate) / x.estimate : 0,
  }));
  const overrunPct =
    (perTask.filter((t) => t.overrun > 0).length / perTask.length) * 100;
  const mape =
    (perTask.reduce((s, t) => s + t.absPctErr, 0) / perTask.length) * 100;

  // Burnout Radar (very simple heuristic): weekly hours per person > 45
  const hoursByPersonWeek = new Map();
  for (const x of valid) {
    const key = `${x.person}|${x.week}`;
    hoursByPersonWeek.set(key, (hoursByPersonWeek.get(key) || 0) + x.actual);
  }
  const burnoutFlags = Array.from(hoursByPersonWeek.entries())
    .filter(([, hrs]) => hrs > 45)
    .map(([k, hrs]) => ({
      person: k.split("|")[0],
      week: k.split("|")[1],
      hours: hrs,
    }));

  // Team Trends: avg overrun hours by team
  const teamAgg = new Map();
  for (const x of valid) {
    const entry = teamAgg.get(x.team) || { count: 0, sumOverrun: 0 };
    entry.count += 1;
    entry.sumOverrun += x.actual - x.estimate;
    teamAgg.set(x.team, entry);
  }
  const teamTrend = Array.from(teamAgg.entries())
    .map(([team, v]) => ({ team, avgOverrun: v.sumOverrun / v.count }))
    .sort((a, b) => b.avgOverrun - a.avgOverrun);

  return {
    totals: {
      rows: valid.length,
    },
    estimation: {
      overrunPct,
      mape,
    },
    burnout: {
      flags: burnoutFlags, // array of { person, week, hours }
    },
    teamTrend,
  };
}

function Stat({ label, value, suffix }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">
        {value}
        {suffix || ""}
      </Typography>
    </Stack>
  );
}

function CountUp({
  to = 0,
  duration = 800,
  decimals = 0,
  reduceMotion = false,
}) {
  const [val, setVal] = useState(reduceMotion ? to : 0);
  useEffect(() => {
    if (reduceMotion) {
      setVal(to);
      return;
    }
    let startTs;
    let raf;
    const d = Math.max(200, duration);
    const from = 0;
    const diff = to - from;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / d);
      setVal(from + diff * p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [to, duration, reduceMotion]);
  return (
    <>{Number.isFinite(val) ? val.toFixed(decimals) : (0).toFixed(decimals)}</>
  );
}

function Kpi({ label, value, suffix, decimals = 0, reduceMotion = false }) {
  const target = Number(value) || 0;
  return (
    <Stack spacing={0.5} sx={{ minWidth: 140 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        <CountUp to={target} decimals={decimals} reduceMotion={reduceMotion} />
        {suffix || ""}
      </Typography>
    </Stack>
  );
}

function TrendBar({ value, max, reduceMotion = false }) {
  const pct =
    max > 0 ? Math.min(100, Math.round((Math.abs(value) / max) * 100)) : 0;
  const positive = value >= 0;
  return (
    <Box
      sx={{
        position: "relative",
        height: 10,
        bgcolor: "action.hover",
        borderRadius: 9999,
        overflow: "hidden",
        minWidth: 120,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          bgcolor: positive ? "error.main" : "success.main",
          transition: reduceMotion ? "none" : "width 700ms ease",
        }}
      />
    </Box>
  );
}

function InsightCard({ icon: Icon, title, children, highlight = false }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        transition: "box-shadow 300ms, transform 300ms, border-color 300ms",
        borderColor: highlight ? "primary.main" : "divider",
        boxShadow: highlight ? 6 : 0,
        transform: highlight ? "translateY(-2px)" : "none",
      }}
    >
      <CardHeader
        avatar={<Icon aria-hidden />}
        title={<Typography variant="h6">{title}</Typography>}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TypewriterLine({ text, start, speed = 42, onDone }) {
  const [shown, setShown] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!start) return;
    // reset state for a fresh run
    setShown(0);
    setFinished(false);

    const tick = () => {
      setShown((prev) => {
        if (prev >= text.length) {
          if (!finished) setFinished(true);
          return prev;
        }
        return prev + 1;
      });
      // schedule next tick only if not finished yet
      timerRef.current = setTimeout(tick, speed);
    };

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // IMPORTANT: do not include `finished` in deps to avoid a reset flicker when it flips true
  }, [text, start, speed]);

  useEffect(() => {
    if (finished && typeof onDone === "function") {
      onDone();
    }
  }, [finished, onDone]);

  const showCaret = !finished;

  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        color: "#eef2ff",
        fontSize: "0.95rem",
        lineHeight: 1.6,
      }}
    >
      {text.slice(0, shown)}
      {showCaret && (
        <Box
          component="span"
          sx={{
            ml: 0.5,
            display: "inline-block",
            width: "0.6ch",
            borderBottom: "2px solid currentColor",
            animation: "blink 1s step-end infinite",
            "@keyframes blink": {
              "0%, 50%": { opacity: 1 },
              "50.01%, 100%": { opacity: 0 },
            },
          }}
        />
      )}
    </Typography>
  );
}

function MockTimesheetTable({ rows }) {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [showRightFade, setShowRightFade] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  // --- Scroll hint state
  const [showHScrollHint, setShowHScrollHint] = useState(true);
  useEffect(() => {
    const el = containerRef.current;
    const sc = scrollerRef.current;
    if (!el || !sc) return;

    let hideTimer;

    const update = () => {
      setContentWidth(el.scrollWidth);
      // right-edge fade logic
      const canScroll = el.scrollWidth > el.clientWidth + 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setShowRightFade(canScroll && !atEnd);
      // keep scroller position in sync
      if (sc.scrollLeft !== el.scrollLeft) sc.scrollLeft = el.scrollLeft;
    };

    const onElScroll = () => {
      if (sc && sc.scrollLeft !== el.scrollLeft) sc.scrollLeft = el.scrollLeft;
      update();
      if (showHScrollHint) setShowHScrollHint(false);
    };
    const onScScroll = () => {
      if (el && el.scrollLeft !== sc.scrollLeft) el.scrollLeft = sc.scrollLeft;
      if (showHScrollHint) setShowHScrollHint(false);
    };

    update();
    el.addEventListener("scroll", onElScroll);
    sc.addEventListener("scroll", onScScroll);
    window.addEventListener("resize", update);
    // Hide the scroll hint after timeout as fallback
    hideTimer = setTimeout(() => setShowHScrollHint(false), 4000);
    return () => {
      el.removeEventListener("scroll", onElScroll);
      sc.removeEventListener("scroll", onScScroll);
      window.removeEventListener("resize", update);
      clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHScrollHint]);
  if (!rows || !rows.length) return null;
  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        height: 260,
        maxHeight: 260,
        overflow: "hidden", // prevent parent scroll so bottom scroller is always visible
        position: "relative",
      }}
    >
      <TableContainer
        ref={containerRef}
        sx={{ maxHeight: 246, overflowX: "auto", position: "relative" }}
      >
        <Table
          size="small"
          stickyHeader
          aria-label="Mock timesheet"
          sx={{ minWidth: 980 }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Person</TableCell>
              <TableCell>Task</TableCell>
              <TableCell align="right">Estimate (h)</TableCell>
              <TableCell align="right">Actual (h)</TableCell>
              <TableCell align="center">Billable</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 25).map((r, idx) => (
              <TableRow key={`${r.date}-${idx}`}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.team}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>{r.person}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 280,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.task}
                </TableCell>
                <TableCell align="right">
                  {Number(r.estimate_hours).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {Number(r.actual_hours).toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={
                      String(r.billable).toLowerCase() === "yes" ? "Yes" : "No"
                    }
                    color={
                      String(r.billable).toLowerCase() === "yes"
                        ? "success"
                        : "default"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Always-visible bottom scrollbar synced with the table */}
      <Box
        ref={scrollerRef}
        sx={{
          height: 12,
          overflowX: "scroll",
          overflowY: "hidden",
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "transparent",
        }}
      >
        <Box sx={{ width: contentWidth, height: 1 }} />
      </Box>
      {/* Subtle "Scroll →" helper; auto-hides after first horizontal scroll */}
      <Box
        sx={{
          position: "absolute",
          right: 8,
          bottom: 20,
          px: 1,
          py: 0.25,
          fontSize: 12,
          borderRadius: 999,
          bgcolor: "rgba(0,0,0,0.4)",
          color: "white",
          backdropFilter: "blur(2px)",
          display: showRightFade && showHScrollHint ? "inline-flex" : "none",
          alignItems: "center",
          gap: 0.5,
          pointerEvents: "none",
          transition: "opacity 0.4s",
          opacity: showHScrollHint ? 1 : 0,
        }}
      >
        <span style={{ opacity: 0.9 }}>Scroll</span>
        <span aria-hidden>→</span>
      </Box>
      {/* Right-edge fade to hint horizontal scroll */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 28,
          height: "100%",
          pointerEvents: "none",
          display: showRightFade ? "block" : "none",
          background: (theme) =>
            `linear-gradient(to right, rgba(${theme.palette.mode === "dark" ? "17,24,39" : "255,255,255"}, 0), ${theme.palette.background.paper} 60%)`,
        }}
      />
    </Paper>
  );
}

export default function PulseMaximiserWidget() {
  const theme = useTheme();
  const chartsRef = useRef(null);
  const summaryTopRef = useRef(null);
  const [highlightFirst, setHighlightFirst] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState([]);

  // Scenario teaser state
  const [scenario, setScenario] = useState(null); // 'cruising' | 'mixed' | 'onfire' | null
  const [seed, setSeed] = useState(() => Date.now());
  const [previewRows, setPreviewRows] = useState([]);

  const insights = useMemo(() => computeInsights(rows), [rows]);
  const summaries = useMemo(() => generateAiSummaries(insights), [insights]);

  const [currentLine, setCurrentLine] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // --- Two-card thinking flow and progress dial state ---
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [ready, setReady] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // Detect reduced motion preference once
  useEffect(() => {
    const prefers =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(Boolean(prefers));
  }, []);

  // Generate preview rows for the selected scenario
  useEffect(() => {
    if (!scenario) {
      setPreviewRows([]);
      return;
    }
    const mock = generateMockRows(scenario, seed);
    setPreviewRows(mock);
  }, [scenario, seed]);

  // Reset progression when new summaries arrive
  useEffect(() => {
    if (summaries && summaries.length) {
      setCurrentLine(reduceMotion ? summaries.length : 0);
    } else {
      setCurrentLine(0);
    }
  }, [summaries, reduceMotion]);

  const [showSummaryBox, setShowSummaryBox] = useState(false);
  useEffect(() => {
    if (summaries && summaries.length) {
      setShowSummaryBox(false);
      const t = setTimeout(
        () => setShowSummaryBox(true),
        reduceMotion ? 0 : 600
      );
      return () => clearTimeout(t);
    } else {
      setShowSummaryBox(false);
    }
  }, [summaries, reduceMotion]);

  // --- Kick off the faux AI thinking progress when rows arrive
  useEffect(() => {
    if (rows && rows.length) {
      setThinking(true);
      setReady(false);
      setProgress(reduceMotion ? 100 : 0);
      setShowSummary(false);
      setShowCharts(false);
    } else {
      setThinking(false);
      setReady(false);
      setProgress(0);
      setShowSummary(false);
      setShowCharts(false);
    }
  }, [rows, reduceMotion]);

  // --- Animate the progress dial to 100% and then mark ready
  useEffect(() => {
    if (!thinking) return;
    if (reduceMotion) {
      const t = setTimeout(() => {
        setReady(true);
        setThinking(false);
      }, 120);
      return () => clearTimeout(t);
    }
    let start = Date.now();
    const duration = 2200; // ms faux processing
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setProgress(Math.round(t * 100));
      if (t >= 1) {
        clearInterval(id);
        setReady(true);
        setThinking(false);
      }
    }, 50);
    return () => clearInterval(id);
  }, [thinking, reduceMotion]);

  // Auto-reveal summary when ready
  useEffect(() => {
    if (ready) setShowSummary(true);
  }, [ready]);

  // --- Reveal summary and charts handlers (reset typing, etc)
  const revealSummary = () => {
    setShowSummary(true);
    setCurrentLine(0);
    setTimeout(() => setShowSummaryBox(true), 50);
  };
  const revealCharts = () => {
    setShowCharts(true);
    setTimeout(() => goToCharts(), 50);
  };

  const doneTyping = currentLine >= (summaries?.length || 0);

  const goToCharts = () => {
    chartsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightFirst(true);
    setTimeout(() => setHighlightFirst(false), 1200);
  };

  return (
    <Box component="section" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ textAlign: { xs: "center", md: "left" }, mb: 2 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", md: "2rem" } }}
            >
              Try Pulse Maximiser — right here on the page
            </Typography>
            <Button
              href="/pulse/join"
              variant="contained"
              size="medium"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                textTransform: "none",
              }}
            >
              Join early access
            </Button>
          </Stack>
          <Typography
            color="text.secondary"
            sx={{
              maxWidth: { xs: "60ch", md: "80ch" },
              mx: { xs: "auto", md: 0 },
            }}
          >
            No signup. No servers. Pick a scenario, see a realistic timesheet,
            and watch Pulse Maximiser turn it into practical insights — included
            with every Pulse plan.
          </Typography>
          {/* Mobile CTA */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <Button
              href="/pulse/join"
              fullWidth
              size="large"
              variant="contained"
              sx={{ mt: 1.5, textTransform: "none" }}
            >
              Join early access
            </Button>
          </Box>
        </Stack>

        {/* Persistent scenario bar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: { xs: "stretch", md: "center" },
            mb: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Typography variant="body2" color="text.secondary">
              Scenario:
            </Typography>
            <Chip
              label="Cruising"
              color={scenario === "cruising" ? "primary" : "default"}
              onClick={() => {
                setScenario("cruising");
                setSeed(Date.now());
              }}
              clickable
            />
            <Chip
              label="Mixed"
              color={scenario === "mixed" ? "primary" : "default"}
              onClick={() => {
                setScenario("mixed");
                setSeed(Date.now());
              }}
              clickable
            />
            <Chip
              label="On fire 🔥"
              color={scenario === "onfire" ? "primary" : "default"}
              onClick={() => {
                setScenario("onfire");
                setSeed(Date.now());
              }}
              clickable
            />
            <Button
              size="small"
              variant="text"
              onClick={() => setSeed(Date.now())}
              sx={{ textTransform: "none" }}
            >
              Regenerate
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              variant="contained"
              size="large"
              disabled={!previewRows.length}
              onClick={() => {
                setRows(previewRows);
                // On small screens, scroll the summary into view
                if (
                  typeof window !== "undefined" &&
                  window.matchMedia &&
                  window.matchMedia("(max-width: 900px)").matches
                ) {
                  setTimeout(() => {
                    summaryTopRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 50);
                }
              }}
              sx={{ textTransform: "none" }}
            >
              Try Maximiser
            </Button>
            <Button
              onClick={downloadSampleCsv}
              startIcon={<DownloadIcon />}
              variant="text"
              size="medium"
              sx={{ textTransform: "none" }}
            >
              Prefer CSV? Download sample
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          {/* LEFT: Mock table */}
          <Grid item xs={12} md={6}>
            {previewRows.length > 0 && (
              <MockTimesheetTable
                key={`${scenario}-${seed}`}
                rows={previewRows}
              />
            )}
          </Grid>

          {/* RIGHT: Sticky panel for CTA -> AI cards */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ position: { md: "sticky" }, top: { md: 96 } }}
            ref={summaryTopRef}
          >
            {rows &&
              rows.length > 0 &&
              showSummary &&
              summaries &&
              summaries.length > 0 && (
                <Paper
                  variant="outlined"
                  role="status"
                  aria-live="polite"
                  sx={{
                    p: 0,
                    mb: 2,
                    overflow: "hidden",
                    bgcolor: "#0a0f1f",
                    color: "#e6edff",
                    borderColor: "rgba(99, 102, 241, 0.35)",
                    boxShadow:
                      "0 0 0 1px rgba(99,102,241,0.35), 0 12px 32px rgba(2,6,23,0.6)",
                    transition:
                      "opacity 400ms ease, transform 400ms ease, max-height 400ms ease",
                    opacity: showSummaryBox ? 1 : 0,
                    transform: showSummaryBox
                      ? "translateY(0)"
                      : "translateY(6px)",
                    position: "relative",
                    height: 260,
                    maxHeight: 260,
                    display: "flex",
                    flexDirection: "column",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "repeating-linear-gradient(180deg, transparent 0, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)",
                      pointerEvents: "none",
                    },
                  }}
                >
                  {/* Monitor header bar */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      bgcolor: "#0d1328",
                      borderBottom: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#ff5f56",
                      }}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#ffbd2e",
                      }}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#27c93f",
                      }}
                    />
                    <Typography
                      variant="overline"
                      sx={{ ml: 1, color: "#c7d2fe", letterSpacing: 1 }}
                    >
                      AI summary
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                  </Box>
                  {/* Monitor body */}
                  <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
                    <Stack spacing={0.5}>
                      {summaries.map((line, i) => {
                        const label = `Insight ${i + 1}: ${line}`;
                        if (i < currentLine) {
                          return (
                            <Typography
                              key={i}
                              variant="body2"
                              sx={{
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                                color: "#eef2ff",
                                fontSize: "0.95rem",
                                lineHeight: 1.6,
                              }}
                            >
                              {label}
                            </Typography>
                          );
                        }
                        if (i === currentLine) {
                          return (
                            <TypewriterLine
                              key={i}
                              text={label}
                              start={showSummaryBox && !reduceMotion}
                              speed={40}
                              onDone={() =>
                                setTimeout(
                                  () =>
                                    setCurrentLine((n) =>
                                      Math.min(n + 1, summaries.length)
                                    ),
                                  300
                                )
                              }
                            />
                          );
                        }
                        return <Box key={i} />;
                      })}
                    </Stack>
                  </Box>
                  {/* Action buttons row at bottom */}
                  <Box
                    sx={{
                      mt: "auto",
                      px: 2,
                      py: 1.5,
                      borderTop: "1px solid rgba(99,102,241,0.25)",
                      bgcolor: "#0d1328",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      {doneTyping && (
                        <Button
                          onClick={revealCharts}
                          size="small"
                          variant="contained"
                          sx={{ textTransform: "none" }}
                        >
                          See the charts
                        </Button>
                      )}
                      {(reduceMotion || currentLine >= summaries.length) && (
                        <Button
                          href="/pulse/join"
                          size="small"
                          variant="contained"
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: "0 6px 16px rgba(99,102,241,0.35)",
                          }}
                        >
                          Love this? Get Pulse — Maximiser included
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              )}
          </Grid>
        </Grid>

        {/* Charts (full width, below table + summary) */}
        {showCharts && insights && (
          <Box ref={chartsRef} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <InsightCard
                  icon={QueryStatsIcon}
                  title="Estimation vs Reality"
                  highlight={highlightFirst}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={3}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Kpi
                        label="Tasks analysed"
                        value={insights.totals.rows}
                        reduceMotion={reduceMotion}
                      />
                      <Kpi
                        label="Tasks overrun"
                        value={insights.estimation.overrunPct}
                        suffix="%"
                        reduceMotion={reduceMotion}
                      />
                      <Kpi
                        label="Avg error (MAPE)"
                        value={insights.estimation.mape}
                        suffix="%"
                        reduceMotion={reduceMotion}
                      />
                    </Stack>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Overrun rate
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(
                          0,
                          Math.min(100, insights.estimation.overrunPct)
                        )}
                        sx={{
                          height: 8,
                          borderRadius: 9999,
                          "& .MuiLinearProgress-bar": {
                            transition: reduceMotion
                              ? "none"
                              : "transform 800ms ease",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </InsightCard>
              </Grid>
              {/* Burnout Radar Card */}
              <Grid item xs={12}>
                <InsightCard icon={BoltIcon} title="Burnout Radar">
                  {insights.burnout.flags.length ? (
                    <Stack spacing={1.5}>
                      <Alert
                        severity="warning"
                        icon={false}
                        sx={{ fontWeight: 600 }}
                      >
                        {
                          new Set(insights.burnout.flags.map((f) => f.person))
                            .size
                        }{" "}
                        people flagged for weeks over 45h
                      </Alert>
                      <Typography variant="body2" color="text.secondary">
                        Most recent signals
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {insights.burnout.flags.slice(0, 8).map((f, idx) => (
                          <Chip
                            key={`${f.person}-${idx}`}
                            label={`${f.person} • ${f.week} • ${f.hours.toFixed(0)}h`}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ) : (
                    <Alert severity="success" icon={false}>
                      No weeks over 45 hours detected — looking good.
                    </Alert>
                  )}
                </InsightCard>
              </Grid>
              {/* Team Trends Card */}
              <Grid item xs={12}>
                <InsightCard icon={GroupsIcon} title="Team Trends">
                  {insights.teamTrend.length ? (
                    <Stack spacing={1.25}>
                      {(() => {
                        const maxMag = Math.max(
                          ...insights.teamTrend.map((t) =>
                            Math.abs(t.avgOverrun)
                          ),
                          0
                        );
                        return insights.teamTrend.map((t) => (
                          <Stack
                            key={t.team}
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                          >
                            <Typography sx={{ minWidth: 80 }}>
                              {t.team}
                            </Typography>
                            <TrendBar
                              value={t.avgOverrun}
                              max={maxMag || 1}
                              reduceMotion={reduceMotion}
                            />
                            <Typography
                              sx={{ minWidth: 140, textAlign: "right" }}
                              color={
                                t.avgOverrun > 0 ? "error.main" : "success.main"
                              }
                            >
                              {t.avgOverrun > 0 ? "+" : ""}
                              {t.avgOverrun.toFixed(1)}h avg overrun
                            </Typography>
                          </Stack>
                        ));
                      })()}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      No team data found in this CSV.
                    </Typography>
                  )}
                </InsightCard>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        <Stack spacing={1} sx={{ textAlign: "center" }}>
          <Typography variant="subtitle1">
            Want this every week without uploads?
          </Typography>
          <Button href="/pulse/join" size="large" variant="contained">
            Join early access — Maximiser included
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
