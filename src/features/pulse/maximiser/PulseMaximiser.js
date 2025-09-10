// Pulse Maximiser — server-backed page + upload demo + compare teams MVP
// Note: No explicit React import required for modern JSX. Follow project conventions.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack,
  Button,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsIcon from "@mui/icons-material/Groups";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import LinkIcon from "@mui/icons-material/Link";

import PulseMaximiserWidget from "../../pulseLanding/PulseMaximiserWidget";
import { pulseService } from "../../../services/pulse/pulse";
import { useAlert } from "../../../context";
// --- Helpers for human-first labels
function titleCase(s) {
  if (!s) return s;
  return String(s)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function prettySeverity(s) {
  // Map internal severities to people-friendly tags
  const map = {
    success: "Celebrate",
    warning: "Heads-Up",
    error: "At Risk",
  };
  return map[s] || titleCase(s || "");
}

function percent(num, denom) {
  const n = Number(num) || 0;
  const d = Number(denom) || 0;
  return d > 0 ? (100 * n) / d : 0;
}

// Build simple compare insights from teams payload
function buildCompareInsights(teams = []) {
  if (!Array.isArray(teams) || teams.length < 2)
    return { highlights: [], risks: [], kudos: [] };

  const rows = teams.map((t) => {
    const total = Number(t?.hours?.total || 0);
    const afterPct = percent(t?.hours?.afterHours, total);
    const nbPct = percent(t?.hours?.nonBillable, total);
    return {
      id: t.teamId,
      name: t.teamName || t.teamId,
      pred: Number(t?.scores?.predictability ?? 0),
      pace: Number(t?.scores?.pace ?? 0),
      focus: Number(t?.scores?.focus ?? 0),
      valueMix: Number(t?.scores?.valueMix ?? 0),
      afterPct,
      nbPct,
      csr: Number(t?.contextSwitchRate ?? 0),
      streaks: Number(t?.streaksOver10h ?? 0),
      flagsCount: Array.isArray(t?.flags) ? t.flags.length : 0,
    };
  });

  const pickExtremes = (arr, key) => {
    const sorted = [...arr].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      spread: (sorted[0]?.[key] ?? 0) - (sorted[sorted.length - 1]?.[key] ?? 0),
    };
  };

  const fmtTeam = (t) => t?.name ?? t?.id ?? "—";
  const round1 = (n) => Number(n).toFixed(1);

  const highlights = [];
  const risks = [];
  const kudos = [];

  for (const key of ["pred", "pace", "focus", "valueMix"]) {
    const { best, worst, spread } = pickExtremes(rows, key);
    if (!best || !worst) continue;
    if (spread >= 5) {
      highlights.push(
        `${fmtTeam(best)} leads on ${labelForScore(key)} (${Math.round(best[key])} vs ${Math.round(worst[key])})`
      );
    }
  }

  {
    const { best, worst, spread } = pickExtremes(rows, "afterPct");
    if (spread >= 2) {
      if (worst.afterPct <= 1) {
        kudos.push(
          `${fmtTeam(worst)} has almost no after-hours (${round1(worst.afterPct)}%).`
        );
      }
      if (best.afterPct >= 5) {
        risks.push(
          `${fmtTeam(best)} after-hours is elevated at ${round1(best.afterPct)}%.`
        );
      }
    }
  }

  {
    const { best, worst, spread } = pickExtremes(rows, "nbPct");
    if (spread >= 4) {
      if (worst.nbPct <= 5) {
        kudos.push(
          `${fmtTeam(worst)} runs tight on non-billable (${round1(worst.nbPct)}%).`
        );
      }
      if (best.nbPct >= 15) {
        highlights.push(
          `${fmtTeam(best)} spends ${round1(best.nbPct)}% on non-billable — opportunity to trim.`
        );
      }
    }
  }

  {
    const { best, worst, spread } = pickExtremes(rows, "csr");
    if (spread >= 0.4) {
      risks.push(
        `${fmtTeam(best)} sees more context switches (${round1(best.csr)} vs ${round1(worst.csr)} /person-day).`
      );
    }
  }

  {
    const { best } = pickExtremes(rows, "streaks");
    if (best?.streaks >= 2) {
      risks.push(
        `${fmtTeam(best)} had ${best.streaks} days ≥10h recently — watch for burnout.`
      );
    }
  }

  {
    const { best, spread } = pickExtremes(rows, "flagsCount");
    if (best?.flagsCount >= 3 && spread >= 2) {
      risks.push(
        `${fmtTeam(best)} has ${best.flagsCount} active flags — worth a closer look.`
      );
    }
  }

  return { highlights, risks, kudos };
}

function labelForScore(k) {
  switch (k) {
    case "pred":
      return "Predictability";
    case "pace":
      return "Pace";
    case "focus":
      return "Focus";
    case "valueMix":
      return "Value mix";
    default:
      return k;
  }
}

// --- Demo defaults so you don't need to re-enter them every time
const DEFAULT_FROM = "2025-09-01";
const DEFAULT_TO = "2025-09-09";
const DEFAULT_TEAMS = ["Ops", "Assurance"]; // add more if you like (e.g. "Tax", "Risk")
const LS_KEY = "maximiser:lastSelection";

// --- Lightweight presentational components to declutter the Compare UI
function MetricLegend() {
  return (
    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        How to read these scores
      </Typography>
      <Typography variant="body2" color="text.secondary" component="div">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <strong>Predictability</strong>: 100 − error vs plan (higher is
            better)
          </li>
          <li>
            <strong>Pace</strong>: penalizes after‑hours & long‑day streaks
            (higher is better)
          </li>
          <li>
            <strong>Focus</strong>: fewer context switches per person‑day
            (higher is better)
          </li>
          <li>
            <strong>Value mix</strong>: less non‑billable time (higher is
            better)
          </li>
        </ul>
      </Typography>
    </Card>
  );
}

// Centralised list so copy & icons are easy to maintain and can be re-used on the landing page.
export const INSIGHT_CARDS = [
  {
    key: "estimation-vs-reality",
    title: "Estimation vs Reality",
    blurb:
      "See how planned effort stacked up against actuals to improve forecasting and avoid hidden overruns.",
    Icon: QueryStatsIcon,
  },
  {
    key: "burnout-radar",
    title: "Burnout Radar",
    blurb:
      "Spot trends in unpaid overtime and sustained over-allocation before they turn into burnout.",
    Icon: BoltIcon,
  },
  {
    key: "team-trends",
    title: "Team Trends",
    blurb:
      "Compare delivery patterns across teams and roles to find where coaching and support will have the biggest impact.",
    Icon: GroupsIcon,
  },
  {
    key: "smarter-retros",
    title: "Smarter Sprint Reviews",
    blurb:
      "Give retros real numbers — see where tasks under- or over-shot and why, week by week.",
    Icon: PlaylistAddCheckIcon,
  },
  {
    key: "continuous-improvement",
    title: "Continuous Improvement",
    blurb:
      "Track the gap between planned and actuals over time to steadily reduce fire drills and deliver with confidence.",
    Icon: InsightsIcon,
  },
  {
    key: "from-spreadsheets-to-pulse",
    title: "From Spreadsheets to Pulse",
    blurb:
      "Upload past timesheets, get instant insights — and when ready, track it live in Pulse with no extra effort.",
    Icon: LinkIcon,
  },
];

// Reusable grid of insight cards — can be embedded on any page (e.g., public landing page)
export function InsightCards({ items = INSIGHT_CARDS }) {
  return (
    <Grid container spacing={3}>
      {items.map(({ key, title, blurb, Icon }) => (
        <Grid item key={key} xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardHeader
              avatar={<Icon aria-hidden />}
              title={<Typography variant="h6">{title}</Typography>}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {blurb}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function ServerInsight({ title, value, suffix, help }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader title={<Typography variant="h6">{title}</Typography>} />
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {value}
            {suffix || ""}
          </Typography>
          {help && (
            <Typography variant="body2" color="text.secondary">
              {help}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ExecutiveSummary({ stats }) {
  if (!stats) return null;
  const { overrunsCount = 0, avgUtil = 0, recentBurnVal = 0 } = stats;

  const lines = [];
  if (overrunsCount > 0) {
    lines.push(
      `${overrunsCount} engagement${overrunsCount > 1 ? "s are" : " is"} currently over plan — prioritise triage to contain spread.`
    );
  } else {
    lines.push("No active overruns detected — delivery looks on track.");
  }

  if (avgUtil >= 85) {
    lines.push(
      `Average utilisation is ${avgUtil}% — monitor after-hours and context switching.`
    );
  } else if (avgUtil >= 65) {
    lines.push(
      `Average utilisation sits at ${avgUtil}% — healthy range for most teams.`
    );
  } else {
    lines.push(
      `Average utilisation is ${avgUtil}% — consider load balancing or demand shaping.`
    );
  }

  lines.push(`Last week logged ${recentBurnVal} hours across the portfolio.`);

  const actions = [];
  if (overrunsCount > 0)
    actions.push("Open the Overruns list and assign owners.");
  if (avgUtil > 85)
    actions.push("Scan for after-hours hotspots in Compare → Pace.");
  if (avgUtil < 60)
    actions.push("Rebalance allocation from under-utilised teams.");
  if (actions.length === 0)
    actions.push("Review team trends for early signals.");

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardHeader title="Executive summary" />
          <CardContent>
            <Stack spacing={0.75}>
              {lines.map((t, i) => (
                <Typography key={i} variant="body1">
                  • {t}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardHeader title="Next best actions" />
          <CardContent>
            <Stack spacing={0.75}>
              {actions.map((t, i) => (
                <Typography key={i} variant="body2">
                  • {t}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function ComparisonMatrix({
  teams,
  diffOnly = false,
  sortBySpread = false,
  minSpreadPct = 3,
}) {
  if (!Array.isArray(teams) || teams.length === 0) return null;

  const cols = teams.map((t) => ({
    id: t.teamId,
    name: t.teamName || t.teamId,
    t,
  }));

  const pct = (n) => {
    const v = Number(n);
    if (!isFinite(v)) return "0%";
    return `${Math.max(0, Math.min(100, Math.round(v)))}%`;
  };

  const rows = [
    {
      key: "predictability",
      label: "Predictability (↑ better)",
      get: (t) => t?.scores?.predictability ?? 0,
      spreadPct: true,
      format: (v) => pct(v),
    },
    {
      key: "pace",
      label: "Pace (↑ better)",
      get: (t) => t?.scores?.pace ?? 0,
      spreadPct: true,
      format: (v, t) => {
        const total = Number(t?.hours?.total || 0);
        const after = Number(t?.hours?.afterHours || 0);
        const streaks = Number(t?.streaksOver10h || 0);
        const afterPct = total > 0 ? (after / total) * 100 : 0;
        return `${pct(v)}  — after-hours ${afterPct.toFixed(1)}% • ${streaks} ≥10h`;
      },
    },
    {
      key: "focus",
      label: "Focus (↑ better)",
      get: (t) => t?.scores?.focus ?? 0,
      spreadPct: true,
      format: (v, t) => {
        const csr = Number(t?.contextSwitchRate || 0);
        return `${pct(v)}  — ${csr.toFixed(1)} switches/person-day`;
      },
    },
    {
      key: "valueMix",
      label: "Value mix (↑ better)",
      get: (t) => t?.scores?.valueMix ?? 0,
      spreadPct: true,
      format: (v, t) => {
        const total = Number(t?.hours?.total || 0);
        const nonBillable = Number(t?.hours?.nonBillable || 0);
        const nbPct = total > 0 ? (nonBillable / total) * 100 : 0;
        return `${pct(v)}  — non-billable ${nbPct.toFixed(1)}%`;
      },
    },
    {
      key: "afterHours",
      label: "After-hours %",
      get: (t) => {
        const total = Number(t?.hours?.total || 0);
        const after = Number(t?.hours?.afterHours || 0);
        return total > 0 ? (after / total) * 100 : 0;
      },
      spreadPct: true,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      key: "nonBillable",
      label: "Non-billable %",
      get: (t) => {
        const total = Number(t?.hours?.total || 0);
        const nb = Number(t?.hours?.nonBillable || 0);
        return total > 0 ? (nb / total) * 100 : 0;
      },
      spreadPct: true,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      key: "csr",
      label: "Context switches / person-day",
      get: (t) => Number(t?.contextSwitchRate || 0),
      spreadPct: false,
      format: (v) => v.toFixed(1),
    },
    {
      key: "streaks",
      label: "Streaks ≥10h (count)",
      get: (t) => Number(t?.streaksOver10h || 0),
      spreadPct: false,
      format: (v) => String(v),
    },
    {
      key: "flags",
      label: "Flags (count)",
      get: (t) => (Array.isArray(t?.flags) ? t.flags.length : 0),
      spreadPct: false,
      format: (v) => String(v),
    },
  ];

  // compute per-row spread (max-min)
  const withSpread = rows.map((r) => {
    const values = cols.map((c) => Number(r.get(c.t)) || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = max - min;
    return { ...r, _spread: spread };
  });

  let finalRows = withSpread;
  if (diffOnly) {
    finalRows = finalRows.filter(
      (r) => r._spread >= (r.spreadPct ? minSpreadPct : 0.3)
    );
  }
  if (sortBySpread) {
    finalRows = [...finalRows].sort((a, b) => b._spread - a._spread);
  }

  return (
    <Card variant="outlined">
      <CardHeader title="Comparison matrix" />
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              {cols.map((c) => (
                <TableCell key={c.id}>{c.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {finalRows.map((r) => (
              <TableRow key={r.key}>
                <TableCell sx={{ fontWeight: 600 }}>{r.label}</TableCell>
                {cols.map((c) => {
                  const raw = r.get(c.t);
                  return (
                    <TableCell key={`${r.key}-${c.id}`}>
                      {r.format ? r.format(raw, c.t) : String(raw)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Page wrapper for the dedicated Pulse Maximiser route
export default function PulseMaximiser() {
  const { showAlert } = useAlert();

  const [tab, setTab] = useState(0); // 0 = Pulse Insights, 1 = Upload CSV, 2 = Compare teams
  const [loading, setLoading] = useState(false);
  const [overruns, setOverruns] = useState([]);
  const [utilisation, setUtilisation] = useState([]);
  const [weeklyBurn, setWeeklyBurn] = useState([]);

  // Compare tab state
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(DEFAULT_TEAMS);
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [includeNonBillable, setIncludeNonBillable] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [diffOnly, setDiffOnly] = useState(true);
  const [sortBySpread, setSortBySpread] = useState(true);

  // persist last selection between refreshes for convenience
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.teamIds)) setSelectedTeams(parsed.teamIds);
        if (parsed.from) setFrom(parsed.from);
        if (parsed.to) setTo(parsed.to);
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  // Fetch a lightweight set of metrics from the BE using pulseService
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [ovr, util, burn] = await Promise.all([
          pulseService.dashboard.overruns().catch(() => []),
          pulseService.dashboard.utilisation().catch(() => []),
          pulseService.dashboard.weeklyBurn().catch(() => []),
        ]);
        if (!cancelled) {
          setOverruns(Array.isArray(ovr) ? ovr : []);
          setUtilisation(Array.isArray(util) ? util : []);
          setWeeklyBurn(Array.isArray(burn) ? burn : []);
        }
      } catch (err) {
        if (!cancelled) {
          showAlert("Couldn’t load Pulse data.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [showAlert]);

  // Teams for compare tab
  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      try {
        const rows = await pulseService.maximiser.teams();
        // DEBUG: shape of teams payload
        // eslint-disable-next-line no-console
        console.log("[Maximiser] teams() →", rows);
        if (!cancelled) setTeams(rows);
      } catch (e) {
        if (!cancelled) {
          showAlert("Couldn’t load teams for comparison.", "error");
        }
      }
    }
    loadTeams();
    return () => {
      cancelled = true;
    };
  }, [showAlert]);

  const keyStats = useMemo(() => {
    // Count overruns (count all rows returned by the API)
    const overrunsCount = Array.isArray(overruns) ? overruns.length : 0;

    // --- Utilisation ---
    // Prefer % provided by API (snake/camel). If missing, derive from billable/capacity.
    const utilVals = Array.isArray(utilisation)
      ? utilisation.map((r) => {
          const pctFromApi = Number(
            r.utilisation_pct ?? // snake_case (per logs)
              r.utilisationPct ?? // camelCase
              r.utilPct ??
              r.utilisation ??
              r.util ??
              r.pct
          );
          if (Number.isFinite(pctFromApi) && pctFromApi > 0) return pctFromApi;

          const bill = Number(r.billable_hours ?? r.billableHours ?? 0);
          const cap = Number(r.capacity_hours ?? r.capacityHours ?? 0);
          return cap > 0 ? (bill / cap) * 100 : 0;
        })
      : [];
    const utilClean = utilVals.filter((n) => Number.isFinite(n));
    const avgUtil = utilClean.length
      ? Math.round(utilClean.reduce((s, n) => s + n, 0) / utilClean.length)
      : 0;

    // --- Weekly burn ---
    // Accept snake/camel keys; choose the last *non-zero* bucket if the last is empty.
    const burnBuckets = Array.isArray(weeklyBurn) ? weeklyBurn : [];
    const getHours = (b) =>
      Number(
        b?.total_hours ?? // snake_case (per logs)
          b?.totalHours ?? // camelCase
          b?.total ?? // generic total
          b?.hours ?? // generic hours
          b?.h ??
          0
      );
    const lastNonZero =
      [...burnBuckets].reverse().find((b) => getHours(b) > 0) ??
      burnBuckets.at(-1);
    const recentBurnVal = lastNonZero ? Math.round(getHours(lastNonZero)) : 0;

    return { overrunsCount, avgUtil, recentBurnVal };
  }, [overruns, utilisation, weeklyBurn]);

  const handleRunCompare = useCallback(
    async (overrides) => {
      const teamIds = overrides?.teamIds || selectedTeams;
      const fromVal = overrides?.from ?? from;
      const toVal = overrides?.to ?? to;
      const incNB = overrides?.includeNonBillable ?? includeNonBillable;

      if (!teamIds || teamIds.length < 2) {
        showAlert("Select at least two teams to compare.", "warning");
        return;
      }
      setCompareLoading(true);
      setCompareData(null);
      // DEBUG: parameters going to compare endpoint
      // eslint-disable-next-line no-console
      console.log("[Maximiser] compare params →", {
        teamIds,
        from: fromVal || undefined,
        to: toVal || undefined,
        includeNonBillable: incNB,
      });
      try {
        const data = await pulseService.maximiser.compare({
          teamIds,
          from: fromVal || undefined,
          to: toVal || undefined,
          includeNonBillable: incNB,
        });
        // save last selection
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({ teamIds, from: fromVal, to: toVal })
          );
        } catch (_) {
          /* ignore */
        }
        // DEBUG: raw compare payload
        // eslint-disable-next-line no-console
        console.log("[Maximiser] compare result (raw) →", data);
        if (Array.isArray(data?.teams)) {
          const summary = data.teams.map((t) => ({
            teamId: t.teamId,
            teamName: t.teamName,
            pred: t?.scores?.predictability,
            pace: t?.scores?.pace,
            focus: t?.scores?.focus,
            valueMix: t?.scores?.valueMix,
            total: t?.hours?.total,
            nonBillable: t?.hours?.nonBillable,
            afterHours: t?.hours?.afterHours,
            csr: t?.contextSwitchRate,
            streaks: t?.streaksOver10h,
            flags: Array.isArray(t?.flags) ? t.flags.length : 0,
          }));
          // eslint-disable-next-line no-console
          console.table(summary);
        }
        setCompareData(data);
      } catch (e) {
        showAlert("Compare failed. Please try again.", "error");
      } finally {
        setCompareLoading(false);
      }
    },
    [selectedTeams, from, to, includeNonBillable, showAlert]
  );

  // Auto-run once after teams load using defaults (no more repeated typing)
  useEffect(() => {
    if (!Array.isArray(teams) || teams.length === 0) return;
    const present = DEFAULT_TEAMS.filter((id) =>
      teams.some((t) => t.teamId === id)
    );
    if (present.length >= 2 && !compareData && !compareLoading) {
      handleRunCompare({
        teamIds: present,
        from: from,
        to: to,
        includeNonBillable,
      });
    }
  }, [
    teams,
    compareData,
    compareLoading,
    from,
    to,
    includeNonBillable,
    handleRunCompare,
  ]);

  const isComparing = compareLoading && !compareData;
  const hasCompare = !!compareData;

  // DEBUG: snapshot whenever compareData updates (helps confirm FE processing)
  useEffect(() => {
    if (!compareData) return;
    // eslint-disable-next-line no-console
    console.log("[Maximiser] compareData snapshot →", compareData);
    if (Array.isArray(compareData?.teams)) {
      const compact = compareData.teams.map((t) => ({
        teamId: t.teamId,
        scores: t.scores,
        hours: t.hours,
        csr: t.contextSwitchRate,
        streaks: t.streaksOver10h,
        flags: t.flags?.length || 0,
      }));
      // eslint-disable-next-line no-console
      console.table(compact);
    }
  }, [compareData]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[Maximiser] dashboard payloads →", {
      overruns,
      utilisation,
      weeklyBurn,
    });
  }, [overruns, utilisation, weeklyBurn]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Pulse Insights" />
          <Tab label="Upload a CSV" />
          <Tab label="Compare Teams" />
        </Tabs>
      </Box>

      {/* Tab 0 — Server-backed quick view using dashboard endpoints */}
      {tab === 0 && (
        <Box>
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography
                  variant="overline"
                  component="div"
                  color="text.secondary"
                >
                  Pulse Maximiser
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, mb: 1 }}>
                  AI insights from your live data
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  We analyse your recent timesheets and delivery to surface
                  overruns, utilisation drift and burn — then map you to the
                  right charts.
                </Typography>
              </Box>

              <ExecutiveSummary stats={keyStats} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <ServerInsight
                    title="Active overruns"
                    value={keyStats.overrunsCount}
                    help="Engagements currently flagged for delivery over plan."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ServerInsight
                    title="Average utilisation"
                    value={keyStats.avgUtil}
                    suffix="%"
                    help="Average utilisation across your people (recent period)."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ServerInsight
                    title="Last week’s burn"
                    value={keyStats.recentBurnVal}
                    suffix="h"
                    help="Total hours logged in the most recent week."
                  />
                </Grid>
              </Grid>

              <InsightCards />
            </>
          )}
        </Box>
      )}

      {/* Tab 1 — Public upload demo widget (client-only) */}
      {tab === 1 && <PulseMaximiserWidget />}

      {/* Tab 2 — Compare teams */}
      {tab === 2 && (
        <Box>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Compare teams
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select two or more teams and a date range. We’ll compute
              transparent scores and flags.
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Teams" />
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {teams.map((t) => {
                      const active = selectedTeams.includes(t.teamId);
                      return (
                        <Chip
                          key={t.teamId}
                          label={t.teamName || t.teamId}
                          color={active ? "primary" : "default"}
                          variant={active ? "filled" : "outlined"}
                          onClick={() => {
                            setSelectedTeams((prev) =>
                              prev.includes(t.teamId)
                                ? prev.filter((x) => x !== t.teamId)
                                : [...prev, t.teamId]
                            );
                          }}
                          sx={{ mb: 1 }}
                        />
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Window & options" />
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="From"
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="To"
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeNonBillable}
                          onChange={(e) =>
                            setIncludeNonBillable(e.target.checked)
                          }
                        />
                      }
                      label="Include non-billable"
                    />
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap" }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedTeams(["Ops", "Assurance"]);
                          setFrom(DEFAULT_FROM);
                          setTo(DEFAULT_TO);
                        }}
                      >
                        Ops vs Assurance
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedTeams(["Ops", "Assurance", "Tax", "Risk"]);
                          setFrom(DEFAULT_FROM);
                          setTo(DEFAULT_TO);
                        }}
                      >
                        All demo teams
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          handleRunCompare({
                            teamIds: selectedTeams,
                            from,
                            to,
                            includeNonBillable,
                          })
                        }
                      >
                        Run demo
                      </Button>
                    </Stack>
                    <Box>
                      <Button variant="contained" onClick={handleRunCompare}>
                        Compare
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Loading cards → flip to action buttons when compareData arrives */}
          {!hasCompare && isComparing && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Analysing timesheets
                  </Typography>
                  <CircularProgress />
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Building comparisons
                  </Typography>
                  <CircularProgress />
                </Card>
              </Grid>
            </Grid>
          )}

          {hasCompare && (
            <Box>
              <Divider sx={{ my: 4 }} />

              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader title="Key insights" />
                <CardContent>
                  {(() => {
                    const { highlights, risks, kudos } = buildCompareInsights(
                      compareData?.teams || []
                    );
                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="overline">Highlights</Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {(highlights.length
                              ? highlights
                              : ["No stand-out differences this window."]
                            ).map((t, i) => (
                              <Typography key={i} variant="body2">
                                • {t}
                              </Typography>
                            ))}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="overline">Risks</Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {(risks.length
                              ? risks
                              : ["No immediate risk signals."]
                            ).map((t, i) => (
                              <Typography key={i} variant="body2">
                                • {t}
                              </Typography>
                            ))}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="overline">Kudos</Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {(kudos.length
                              ? kudos
                              : ["Nothing to celebrate… yet."]
                            ).map((t, i) => (
                              <Typography key={i} variant="body2">
                                • {t}
                              </Typography>
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </CardContent>
              </Card>

              <Divider sx={{ my: 4 }} />

              <Stack
                direction="row"
                spacing={2}
                sx={{ mb: 1, alignItems: "center" }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={diffOnly}
                      onChange={(e) => setDiffOnly(e.target.checked)}
                    />
                  }
                  label="Show differences only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={sortBySpread}
                      onChange={(e) => setSortBySpread(e.target.checked)}
                    />
                  }
                  label="Sort rows by biggest spread"
                />
              </Stack>

              <ComparisonMatrix
                teams={compareData?.teams || []}
                diffOnly={diffOnly}
                sortBySpread={sortBySpread}
              />
              <br />

              <MetricLegend />

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Opportunities & Kudos
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compareData?.teams?.flatMap((t) =>
                    (t.flags || []).map((f, idx) => (
                      <TableRow key={`${t.teamId}-${f.key}-${idx}`}>
                        <TableCell>{t.teamName || t.teamId}</TableCell>
                        <TableCell>{prettySeverity(f.severity)}</TableCell>
                        <TableCell>{f.message}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}
