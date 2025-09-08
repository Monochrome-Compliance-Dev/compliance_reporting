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
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  LinearProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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

export default function PulseMaximiserWidget() {
  const theme = useTheme();
  const chartsRef = useRef(null);
  const [highlightFirst, setHighlightFirst] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

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

  function handleFileChange(e) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = parseCsv(text);
        setRows(parsed);
      } catch (err) {
        setError(
          "Could not read that file. Please check the format and try again."
        );
      }
    };
    reader.onerror = () => setError("File read error. Please try again.");
    reader.readAsText(file);
  }

  return (
    <Box component="section" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ textAlign: { xs: "center", md: "left" }, mb: 2 }}
        >
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", md: "2rem" } }}
          >
            Try Pulse Maximiser — right here on the page
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              maxWidth: { xs: "60ch", md: "80ch" },
              mx: { xs: "auto", md: 0 },
            }}
          >
            No signup. No servers. Download a small sample file, upload it (or
            your own CSV), and see how Pulse Maximiser turns past timesheets
            into practical insights — included with every Pulse plan.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "center", mb: 3 }}
        >
          <Button
            onClick={downloadSampleCsv}
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="large"
          >
            Download sample CSV
          </Button>

          <Button
            component="label"
            startIcon={<UploadFileIcon />}
            variant="contained"
            size="large"
          >
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Stack>

        {error && (
          <Typography color="error" sx={{ textAlign: "center", mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Thinking cards: Summary & Charts side-by-side, stack on mobile */}
        {rows.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title={<Typography variant="h6">AI Summary</Typography>}
                />
                <CardContent>
                  {!ready ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                      <CircularProgress
                        variant={reduceMotion ? "indeterminate" : "determinate"}
                        value={progress}
                        size={48}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {reduceMotion
                          ? "Analyzing…"
                          : `Analyzing… ${progress}%`}
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack
                      alignItems={{ xs: "stretch", sm: "center" }}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flex: 1 }}
                      >
                        Your AI summary is ready.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={revealSummary}
                        sx={{ textTransform: "none" }}
                      >
                        View summary
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title={<Typography variant="h6">Charts</Typography>}
                />
                <CardContent>
                  {!ready ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                      <CircularProgress
                        variant={reduceMotion ? "indeterminate" : "determinate"}
                        value={progress}
                        size={48}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {reduceMotion
                          ? "Preparing…"
                          : `Preparing… ${progress}%`}
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack
                      alignItems={{ xs: "stretch", sm: "center" }}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flex: 1 }}
                      >
                        Charts are ready to explore.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={revealCharts}
                        sx={{ textTransform: "none" }}
                      >
                        View charts
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Grid container spacing={3} alignItems="flex-start">
          {/* LEFT: AI monitor */}
          <Grid item xs={12} md={5}>
            {showSummary && summaries && summaries.length > 0 && (
              <Paper
                variant="outlined"
                role="status"
                aria-live="polite"
                sx={{
                  p: 0,
                  mb: 3,
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
                  maxHeight: collapsed ? 220 : "none",
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
                  {doneTyping && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={() => setCollapsed((v) => !v)}
                        size="small"
                        variant="text"
                        sx={{ color: "#c7d2fe", textTransform: "none" }}
                      >
                        {collapsed ? "Show all" : "Collapse"}
                      </Button>
                      <Button
                        onClick={goToCharts}
                        size="small"
                        variant="contained"
                        sx={{ textTransform: "none" }}
                      >
                        See the charts
                      </Button>
                    </Stack>
                  )}
                </Box>

                {/* Monitor body */}
                <Box sx={{ p: 2 }}>
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

                    {(reduceMotion || currentLine >= summaries.length) && (
                      <Box
                        sx={{ mt: 1.5, textAlign: { xs: "left", sm: "right" } }}
                      >
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
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Paper>
            )}
          </Grid>

          {/* RIGHT: Charts (hidden until data available) */}
          {showCharts && insights && (
            <Grid item xs={12} md={7} ref={chartsRef}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
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

                <Grid item xs={12} md={12}>
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

                <Grid item xs={12} md={12}>
                  <InsightCard icon={GroupsIcon} title="Team Trends">
                    {insights.teamTrend.length ? (
                      <Stack spacing={1.25}>
                        {(() => {
                          const maxMag = Math.max(
                            ...insights.teamTrend.map((t) =>
                              Math.abs(t.avgOverrun)
                            )
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
                                max={maxMag}
                                reduceMotion={reduceMotion}
                              />
                              <Typography
                                sx={{ minWidth: 120, textAlign: "right" }}
                                color={
                                  t.avgOverrun > 0
                                    ? "error.main"
                                    : "success.main"
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
            </Grid>
          )}
        </Grid>

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
