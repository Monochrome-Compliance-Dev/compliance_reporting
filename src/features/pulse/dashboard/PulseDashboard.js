import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { Link } from "react-router";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { pulseService } from "../../../services/pulse/pulse";
import { useAlert } from "../../../context";
import { LoadingSpinner } from "../../../components/ui";

// --- Layout constants ---
const CARD_HEIGHT = 280; // total card height
const CHART_HEIGHT = 200; // common chart area height
const DONUT_SIZE = 200; // width/height for donut charts

// --- Loading / Empty helpers (reusable) ---
const LoadingBox = ({ message = "Loading…", height = CHART_HEIGHT }) => (
  <Box
    sx={{
      width: "100%",
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <LoadingSpinner message={message} />
  </Box>
);

const NoDataBox = ({ message = "No data" }) => (
  <Box
    sx={{
      width: "100%",
      height: CHART_HEIGHT,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// --- Recharts custom legend helper ---
const renderColorLegend = (props) => {
  const payload = Array.isArray(props?.payload) ? props.payload : [];
  if (payload.length === 0) return null;
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        justifyContent: "center",
        px: 1,
        py: 0.5,
      }}
    >
      {payload.map((entry, i) => (
        <Box
          key={`legend-${entry?.value ?? i}`}
          sx={{ display: "flex", alignItems: "center", mr: 1 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: 1,
              bgcolor: entry?.color || "#90a4ae",
              mr: 0.75,
              flex: "0 0 auto",
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: entry?.color || "text.secondary", lineHeight: 1.2 }}
          >
            {String(entry?.value || "")}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// --- Mock Data (inline for MVP demo) ---
const mockEngagements = [
  {
    id: "E-001",
    name: "Q3 Statutory Audit – Acme",
    budget: 120000,
    spend: 78000,
    status: "In Progress",
    weeklyBurn: [8, 12, 16, 14, 18, 20, 22, 24, 25, 27],
  },
  {
    id: "E-002",
    name: "Internal Controls Review – BetaCo",
    budget: 80000,
    spend: 92000,
    status: "Delayed",
    weeklyBurn: [5, 7, 9, 10, 12, 15, 18, 21, 23, 26],
  },
  {
    id: "E-003",
    name: "IFRS Advisory – Coremin",
    budget: 65000,
    spend: 41000,
    status: "In Progress",
    weeklyBurn: [3, 4, 6, 8, 9, 10, 12, 13, 15, 16],
  },
  {
    id: "E-004",
    name: "Year-End Close – Delta Rail",
    budget: 50000,
    spend: 32000,
    status: "Planning",
    weeklyBurn: [0, 0, 0, 2, 3, 4, 6, 8, 10, 12],
  },
  {
    id: "E-005",
    name: "Quarterly Review – Eclipse Pty",
    budget: 30000,
    spend: 36000,
    status: "In Progress",
    weeklyBurn: [2, 3, 4, 5, 5, 6, 7, 8, 9, 10],
  },
];

const mockResources = [
  {
    id: "R-01",
    name: "M. Khan",
    capacityHrs: 40,
    allocatedHrs: 46,
    billablePct: 0.88,
  },
  {
    id: "R-02",
    name: "S. Taylor",
    capacityHrs: 40,
    allocatedHrs: 32,
    billablePct: 0.74,
  },
  {
    id: "R-03",
    name: "L. Nguyen",
    capacityHrs: 40,
    allocatedHrs: 40,
    billablePct: 0.91,
  },
  {
    id: "R-04",
    name: "A. Chen",
    capacityHrs: 30,
    allocatedHrs: 18,
    billablePct: 0.62,
  },
  {
    id: "R-05",
    name: "J. Patel",
    capacityHrs: 20,
    allocatedHrs: 26,
    billablePct: 0.57,
  },
];

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const mockTotals = {
  budget: mockEngagements.reduce((a, e) => a + e.budget, 0),
  spend: mockEngagements.reduce((a, e) => a + e.spend, 0),
};
const spendPct = Math.min(
  100,
  Math.round((mockTotals.spend / mockTotals.budget) * 100)
);

const statusCounts = mockEngagements.reduce((acc, e) => {
  acc[e.status] = (acc[e.status] || 0) + 1;
  return acc;
}, {});
const statusPalette = ["#66bb6a", "#42a5f5", "#ffa726", "#ef5350", "#ab47bc"]; // planning/in progress/complete/delayed/other
const statusEntries = Object.entries(statusCounts);
const statusTotal = statusEntries.reduce((a, [, v]) => a + v, 0);

// --- Engagement Status color helpers ---
const STATUS_ORDER = [
  "Planning",
  "In Progress",
  "Complete",
  "Delayed",
  "Cancelled",
  "On Hold",
  "Other",
];
const statusColorMap = {
  Planning: "#66bb6a",
  "In Progress": "#42a5f5",
  Complete: "#66bb6a",
  Delayed: "#ffa726",
  Cancelled: "#ef5350",
  "On Hold": "#ab47bc",
  Other: "#90a4ae",
};
const getStatusColor = (name, idx = 0) => {
  const key = String(name || "")
    .replace(/_/g, " ")
    .trim();
  if (statusColorMap[key]) return statusColorMap[key];
  // Fallback to palette but keep deterministic color
  return statusPalette[idx % statusPalette.length] || "#90a4ae";
};

const overruns = [...mockEngagements]
  .map((e) => ({ ...e, variance: e.spend - e.budget }))
  .sort((a, b) => b.variance - a.variance)
  .slice(0, 5);

const weeklyMax = Math.max(...mockEngagements.flatMap((e) => e.weeklyBurn));
const sparkPoints = mockEngagements[0].weeklyBurn
  .map((v, i, arr) => {
    const x = (i / (arr.length - 1)) * 220; // width
    const y = 60 - (v / weeklyMax) * 50; // height
    return `${x},${y}`;
  })
  .join(" ");

// --- Derived data for Recharts ---
const spendData = [
  { name: "Spend", value: Math.min(mockTotals.spend, mockTotals.budget) },
  {
    name: "Remaining",
    value: Math.max(mockTotals.budget - mockTotals.spend, 0),
  },
];

const allocStackData = mockResources.map((r) => {
  const inCap = Math.max(0, Math.min(r.allocatedHrs, r.capacityHrs));
  const over = Math.max(0, r.allocatedHrs - r.capacityHrs);
  return { name: r.name, inCap, over };
});

const burnSeries = mockEngagements[0].weeklyBurn.map((v, i) => ({
  week: i + 1,
  burn: v,
}));

// --- Roadmap derived datasets ---
// Resource Utilisation % per resource
const utilisationData = mockResources.map((r) => ({
  name: r.name,
  util: Math.round((r.allocatedHrs / (r.capacityHrs || 1)) * 100),
}));

// Billable vs Non-Billable (hours)
const totalBillableHours = mockResources.reduce(
  (a, r) => a + r.allocatedHrs * r.billablePct,
  0
);
const totalNonBillableHours = mockResources.reduce(
  (a, r) => a + r.allocatedHrs * (1 - r.billablePct),
  0
);
const billablePie = [
  { name: "Billable", value: Math.round(totalBillableHours) },
  { name: "Non-Billable", value: Math.round(totalNonBillableHours) },
];

// Revenue Potential vs Realised (single row with two bars)
const revenuePotential = Math.round(
  mockResources.reduce((a, r) => a + r.capacityHrs, 0) * 200 * 0.8
);
const revenueRealised = Math.round(totalBillableHours * 200);
const revenueBars = [
  { name: "Total", Potential: revenuePotential, Realised: revenueRealised },
];

// Resource Demand Forecast (next 6 sprints)
const teamCapacity = mockResources.reduce((a, r) => a + r.capacityHrs, 0);
const currentRequired = mockResources.reduce((a, r) => a + r.allocatedHrs, 0);
const demandForecast = Array.from({ length: 6 }).map((_, i) => ({
  sprint: i + 1,
  capacity: teamCapacity,
  required: Math.round(currentRequired * (1 + 0.05 * i)),
}));

// On-time vs Delayed Assignments
const onTimeDelayed = [
  { name: "On-time", value: statusTotal - (statusCounts["Delayed"] || 0) },
  { name: "Delayed", value: statusCounts["Delayed"] || 0 },
];

// Average Turnaround per Engagement (weeks) + average reference
const turnaroundData = mockEngagements.map((e) => ({
  name: e.id,
  weeks: e.weeklyBurn.length,
}));
const turnaroundAvgWeeks = Math.round(
  turnaroundData.reduce((a, e) => a + e.weeks, 0) / (turnaroundData.length || 1)
);

// --- Live data wiring for Budget Burn‑down Over Time ---
const PulseWeeklyBurn = () => {
  const { showAlert } = useAlert();
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await pulseService.dashboard.weeklyBurn("current");
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.log("[Pulse] weekly burn payload:", res);
        setPayload(res);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        showAlert(`Failed to load weekly burn: ${String(err)}`, "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  // Normalise into [{ week, burn }]
  const burnSeriesLive = useMemo(() => {
    if (!payload) return [];
    // Case 1: simple array of numbers
    if (
      Array.isArray(payload) &&
      payload.every((n) => Number.isFinite(Number(n)))
    ) {
      return payload.map((v, i, arr) => ({ week: i + 1, burn: Number(v) }));
    }
    // Case 2: array of objects with flexible keys
    if (Array.isArray(payload)) {
      return payload
        .map((row, i) => {
          if (!row || typeof row !== "object") return null;
          const burn = [row.burn, row.value, row.amount, row.spend, row.total]
            .map((x) => (x == null ? NaN : Number(x)))
            .find((x) => Number.isFinite(x));

          // Prefer explicit "week"; otherwise derive from index; otherwise try to parse date to an ordinal week bucket
          let weekNum = Number(row.week);
          if (!Number.isFinite(weekNum)) {
            const d = row.date || row.period || row.weekStart || row.week_start;
            if (d && typeof d === "string") {
              const dt = new Date(d);
              if (!isNaN(dt.getTime())) {
                // Convert to ISO week number-ish (rough): 1..53
                const jan1 = new Date(dt.getFullYear(), 0, 1);
                const diff = Math.floor((dt - jan1) / (1000 * 60 * 60 * 24));
                weekNum = Math.max(1, Math.floor(diff / 7) + 1);
              }
            }
          }
          if (!Number.isFinite(weekNum)) weekNum = i + 1;
          return Number.isFinite(burn) ? { week: weekNum, burn } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.week - b.week);
    }
    // Case 3: object map { week: value }
    if (payload && typeof payload === "object") {
      return Object.entries(payload)
        .map(([k, v]) => ({ week: Number(k), burn: Number(v) }))
        .filter((r) => Number.isFinite(r.week) && Number.isFinite(r.burn))
        .sort((a, b) => a.week - b.week);
    }
    return [];
  }, [payload]);

  return { burnSeriesLive, isLoadingBurn: isLoading };
};
// --- Live data wiring for Resource Allocation vs Capacity ---
const PulseUtilisation = () => {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await pulseService.dashboard.utilisation("current");
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.log("[Pulse] utilisation payload:", res);
        setRows(res);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        showAlert(`Failed to load utilisation: ${String(err)}`, "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  const allocStackDataLive = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return allocStackData; // fallback to mock
    return rows.map((r) => {
      const name = r.name ?? r.resource_name ?? r.resource_id ?? "?";
      const capacity = Number(r.capacity ?? r.capacityHoursPerWeek ?? 0);
      const allocated = Number(r.allocated ?? r.allocatedHoursPerWeek ?? 0);
      const inCap = Math.max(0, Math.min(allocated, capacity));
      const over = Math.max(0, allocated - capacity);
      return { name, inCap, over };
    });
  }, [rows]);

  // Also log the derived series so we can confirm the shape the chart receives
  useEffect(() => {
    if (!rows) return;
    const derived = (Array.isArray(rows) ? rows : []).map((r) => {
      const capacity = Number(r.capacity ?? 0);
      const allocated = Number(r.allocated ?? 0);
      return {
        name: r.name,
        inCap: Math.max(0, Math.min(allocated, capacity)),
        over: Math.max(0, allocated - capacity),
      };
    });
    // eslint-disable-next-line no-console
    console.log("[Pulse] utilisation derived allocStackData:", derived);
  }, [rows]);

  return { allocStackDataLive, isLoadingUtil: isLoading };
};
// --- Live data wiring for Engagement Status Breakdown ---
const PulseEngagementStatus = () => {
  const { showAlert } = useAlert();
  const [statusPayload, setStatusPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Try a few likely service shapes; the service should implement one of these.
        const res = await pulseService.dashboard.status("current");
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.log("[Pulse] engagement status payload:", res);
        setStatusPayload(res);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        // eslint-disable-next-line no-console
        console.warn(
          "[Pulse] engagement status fetch failed; falling back to mock. Error:",
          err
        );
        // Keep payload null so we fall back to mock below
        showAlert?.(
          `Failed to load engagement status: ${String(err)}`,
          "warning"
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  // Derive a normalized breakdown in the form: [{ name, value }]
  const statusBreakdown = useMemo(() => {
    if (!statusPayload) return null;

    // Case 1: Array of engagements with a `status` field
    if (Array.isArray(statusPayload)) {
      const counts = statusPayload.reduce((acc, item) => {
        const s = String(
          item?.status ?? item?.engagement_status ?? item?.state ?? ""
        ).trim();
        if (!s) return acc;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    // Case 2: Object with a `breakdown` map or direct map of status->count
    const map =
      (statusPayload && typeof statusPayload.breakdown === "object"
        ? statusPayload.breakdown
        : statusPayload) || {};
    const entries = Object.entries(map)
      .filter(([, v]) => Number.isFinite(Number(v)))
      .map(([k, v]) => ({ name: k, value: Number(v) }));

    if (entries.length > 0) return entries;

    return null;
  }, [statusPayload]);

  // Helpful totals
  const statusTotalLive = useMemo(() => {
    return Array.isArray(statusBreakdown)
      ? statusBreakdown.reduce((a, e) => a + (Number(e.value) || 0), 0)
      : 0;
  }, [statusBreakdown]);

  return {
    statusBreakdown,
    statusTotalLive,
    isLoadingStatus: isLoading,
  };
};
// --- Live data wiring for Spend vs Budget ---
const PulseSpendTotals = () => {
  const { showAlert } = useAlert();
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await pulseService.dashboard.totals("current");
        if (!alive) return;
        // Log the raw payload and our derived structure for verification during hookup
        const b = Number(res?.total_budget ?? 0);
        const s = Number(res?.total_spend ?? 0);
        const derived = {
          budget: b,
          spend: s,
          spendPct: b ? Math.min(100, Math.round((s / b) * 100)) : 0,
          spendData: [
            { name: "Spend", value: Math.min(s, b) },
            { name: "Remaining", value: Math.max(b - s, 0) },
          ],
        };
        // eslint-disable-next-line no-console
        console.log("[Pulse] totals payload & derived:", res, derived);
        setTotals(res);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        showAlert(`Failed to load totals: ${String(err)}`, "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  const liveTotals = useMemo(() => {
    if (!totals) return null;
    return {
      budget: Number(totals.total_budget ?? 0),
      spend: Number(totals.total_spend ?? 0),
    };
  }, [totals]);

  const spendDataLive = useMemo(() => {
    if (!liveTotals) return [];
    const b = Number(liveTotals.budget || 0);
    const s = Number(liveTotals.spend || 0);
    return [
      { name: "Spend", value: Math.min(s, b) },
      { name: "Remaining", value: Math.max(b - s, 0) },
    ];
  }, [liveTotals]);

  const spendPctLive = useMemo(() => {
    if (!liveTotals) return 0;
    const b = Number(liveTotals.budget || 0);
    const s = Number(liveTotals.spend || 0);
    return b ? Math.min(100, Math.round((s / b) * 100)) : 0;
  }, [liveTotals]);

  return {
    liveTotals,
    spendDataLive,
    spendPctLive,
    isLoadingTotals: isLoading,
  };
};

const PulseDashboard = () => {
  const { liveTotals, spendDataLive, spendPctLive, isLoadingTotals } =
    PulseSpendTotals();
  const { allocStackDataLive, isLoadingUtil } = PulseUtilisation();
  const { statusBreakdown, statusTotalLive, isLoadingStatus } =
    PulseEngagementStatus();
  const { burnSeriesLive, isLoadingBurn } = PulseWeeklyBurn();
  const [pageIdx, setPageIdx] = useState(0);
  const [pageSize, setPageSize] = useState(8); // number of bars shown at once
  const [showAll, setShowAll] = useState(true); // show all records by default
  return (
    <Container>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
        mb={2}
      >
        <Typography variant="h4">Pulse Dashboard</Typography>
        <Button component={Link} to="/pulse-solution/admin" variant="outlined">
          Open Admin Console
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* MVP Charts */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Spend vs Budget
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {isLoadingTotals ? (
                <Box
                  sx={{
                    width: DONUT_SIZE,
                    height: DONUT_SIZE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LoadingSpinner message="Loading totals…" />
                </Box>
              ) : (
                <Box position="relative" width={DONUT_SIZE} height={DONUT_SIZE}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendDataLive}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        outerRadius="80%"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        {spendDataLive.map((d, i) => (
                          <Cell
                            key={d.name}
                            fill={i === 0 ? "#66bb6a" : "#e0e0e0"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [
                          `$${Number(v).toLocaleString()}`,
                          n,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h6">{spendPctLive}%</Typography>
                  </Box>
                </Box>
              )}
              {!isLoadingTotals && liveTotals && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Budget: ${liveTotals.budget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spend: ${liveTotals.spend.toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Health:{" "}
                    {spendPctLive <= 85
                      ? "On Track"
                      : spendPctLive <= 100
                        ? "Watch"
                        : "Over"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Resource Allocation vs Capacity
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                {(() => {
                  let data = (
                    Array.isArray(allocStackDataLive) ? allocStackDataLive : []
                  )
                    .filter((d) => d && typeof d.name === "string")
                    .map((d) => ({
                      name: d.name,
                      inCap: Number.isFinite(d.inCap)
                        ? d.inCap
                        : Number(d.inCap ?? 0) || 0,
                      over: Number.isFinite(d.over)
                        ? d.over
                        : Number(d.over ?? 0) || 0,
                    }));
                  const categories = data
                    .map((d) => d.name)
                    .filter((n) => typeof n === "string" && n.length > 0);
                  if (categories.length !== data.length) {
                    data = data.filter(
                      (d) => typeof d.name === "string" && d.name.length > 0
                    );
                  }
                  // Ensure category names are unique to avoid Recharts scale/domain bugs
                  const seen = new Map();
                  data = data.map((d) => {
                    const count = (seen.get(d.name) || 0) + 1;
                    seen.set(d.name, count);
                    // Only suffix duplicates; first occurrence stays clean
                    return count > 1
                      ? { ...d, name: `${d.name} (${count})` }
                      : d;
                  });
                  const total = data.length;
                  const pages =
                    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
                  const safePage = showAll
                    ? 0
                    : Math.min(Math.max(0, pageIdx), pages - 1);
                  const start = showAll ? 0 : safePage * pageSize;
                  const end = showAll
                    ? total
                    : Math.min(total, start + pageSize);
                  return showAll
                    ? "Showing all resources"
                    : `Showing resources ${start + 1}-${end} of ${Array.isArray(data) ? data.length : 0}`;
                })()}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {!showAll && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPageIdx((i) => i + 1)}
                    >
                      Next
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowAll((s) => !s)}
                >
                  {showAll ? "Show Paged" : "Show All"}
                </Button>
              </Box>
            </Box>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {isLoadingUtil ? (
                <LoadingSpinner message="Loading resources…" />
              ) : (
                (() => {
                  // existing IIFE body unchanged
                  let data = (
                    Array.isArray(allocStackDataLive) ? allocStackDataLive : []
                  )
                    .filter((d) => d && typeof d.name === "string")
                    .map((d) => ({
                      name: d.name,
                      inCap: Number.isFinite(d.inCap)
                        ? d.inCap
                        : Number(d.inCap ?? 0) || 0,
                      over: Number.isFinite(d.over)
                        ? d.over
                        : Number(d.over ?? 0) || 0,
                    }));
                  const categories = data
                    .map((d) => d.name)
                    .filter((n) => typeof n === "string" && n.length > 0);
                  console.table([
                    "[Pulse][utilisation] categories",
                    ...categories,
                  ]);
                  if (categories.length !== data.length) {
                    data = data.filter(
                      (d) => typeof d.name === "string" && d.name.length > 0
                    );
                  }
                  const seen = new Map();
                  data = data.map((d) => {
                    const count = (seen.get(d.name) || 0) + 1;
                    seen.set(d.name, count);
                    return count > 1
                      ? { ...d, name: `${d.name} (${count})` }
                      : d;
                  });
                  console.log(
                    "[Pulse][utilisation] all rows & lengths:",
                    data,
                    "len=",
                    data.length
                  );
                  const total = data.length;
                  const pages =
                    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
                  const safePage = showAll
                    ? 0
                    : Math.min(Math.max(0, pageIdx), pages - 1);
                  const start = showAll ? 0 : safePage * pageSize;
                  const end = showAll
                    ? total
                    : Math.min(total, start + pageSize);
                  const pageData = data.slice(start, end);
                  console.log("[Pulse][utilisation] page info:", {
                    total,
                    pageSize,
                    pages,
                    pageIdx: safePage,
                    range: [start, end],
                  });
                  const maxY = Math.max(
                    0,
                    ...pageData.map(
                      (d) => (Number(d.inCap) || 0) + (Number(d.over) || 0)
                    )
                  );
                  const safeMaxY =
                    Number.isFinite(maxY) && maxY > 0
                      ? Math.ceil(maxY * 1.1)
                      : 1;
                  const chartKey = `alloc-${categories.length}-${start}-${end}-${safeMaxY}-${showAll ? "all" : "page"}`;
                  if (
                    !Array.isArray(pageData) ||
                    pageData.length === 0 ||
                    !Number.isFinite(safeMaxY)
                  ) {
                    return (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                      >
                        <Typography variant="body2" color="text.secondary">
                          No utilisation data
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <Box
                      display="flex"
                      alignItems="stretch"
                      justifyContent="center"
                      sx={{ width: "100%", height: "100%" }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height={CHART_HEIGHT - 8}
                      >
                        <BarChart
                          key={chartKey}
                          data={pageData}
                          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            height={40}
                            allowDuplicatedCategory={true}
                          />
                          <YAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            domain={[0, safeMaxY]}
                            allowDecimals
                          />
                          <Tooltip />
                          <Legend
                            content={renderColorLegend}
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                          />
                          <Bar
                            dataKey="inCap"
                            stackId="a"
                            name="Allocated (within capacity)"
                            isAnimationActive={false}
                          />
                          <Bar
                            dataKey="over"
                            stackId="a"
                            name="Over-allocation"
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  );
                })()
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Engagement Status Breakdown
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {isLoadingStatus ? (
                <LoadingBox
                  message="Loading engagement status…"
                  height={DONUT_SIZE}
                />
              ) : (
                (() => {
                  // Prefer live breakdown; fall back to mock if unavailable or empty
                  const live = Array.isArray(statusBreakdown)
                    ? statusBreakdown.filter((d) => d && Number(d.value) > 0)
                    : [];
                  const fallback = statusEntries.map(([label, value]) => ({
                    name: label,
                    value: Number(value) || 0,
                  }));
                  const raw = live.length > 0 ? live : fallback;

                  // Normalize names and attach colors deterministically
                  const statusData = raw.map((d, idx) => {
                    const name = String(d.name || d.status || "Other")
                      .replace(/_/g, " ")
                      .trim();
                    return {
                      name,
                      value: Number(d.value) || 0,
                      color: getStatusColor(name, idx),
                      _order: STATUS_ORDER.indexOf(name),
                    };
                  });

                  if (!statusData || statusData.length === 0) {
                    return <NoDataBox message="No engagement data" />;
                  }

                  // Compute center label as % In Progress
                  const total = statusData.reduce(
                    (a, e) => a + (Number(e.value) || 0),
                    0
                  );
                  const inProg =
                    statusData.find(
                      (e) => e.name.toLowerCase() === "in progress"
                    )?.value || 0;
                  const centreLabel = total
                    ? Math.round((Number(inProg) / total) * 100)
                    : 0;

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: DONUT_SIZE,
                        }}
                      >
                        <Box
                          position="relative"
                          width={DONUT_SIZE}
                          height={DONUT_SIZE}
                        >
                          <PieChart width={DONUT_SIZE} height={DONUT_SIZE}>
                            <Pie
                              data={statusData}
                              dataKey="value"
                              nameKey="name"
                              cx={DONUT_SIZE / 2}
                              cy={DONUT_SIZE / 2}
                              innerRadius={50}
                              outerRadius={70}
                              startAngle={90}
                              endAngle={-270}
                              isAnimationActive={false}
                            >
                              {statusData.map((entry, i) => (
                                <Cell
                                  key={`cell-${entry.name}-${i}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v, n) => [String(v), n]} />
                          </PieChart>
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Typography variant="h6">{centreLabel}%</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ width: "100%", mt: 1 }}>
                          {renderColorLegend({
                            payload: statusData.map((e) => ({
                              value: e.name,
                              color: e.color,
                            })),
                          })}
                        </Box>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary">
                          Breakdown of engagement statuses.
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()
              )}
            </Box>
            <Box sx={{ mt: 1, maxHeight: CARD_HEIGHT - 210, overflow: "auto" }}>
              <Grid container spacing={1}>
                {(() => {
                  const live = Array.isArray(statusBreakdown)
                    ? statusBreakdown.filter((d) => d && Number(d.value) > 0)
                    : [];
                  const fallback = statusEntries.map(([label, value]) => ({
                    name: label,
                    value: Number(value) || 0,
                  }));
                  const raw = live.length > 0 ? live : fallback;
                  const items = raw
                    .map((d, idx) => {
                      const name = String(d.name || d.status || "Other")
                        .replace(/_/g, " ")
                        .trim();
                      return {
                        name,
                        value: Number(d.value) || 0,
                        color: getStatusColor(name, idx),
                        _order: STATUS_ORDER.indexOf(name),
                      };
                    })
                    .sort((a, b) => {
                      const ao = a._order < 0 ? 999 : a._order;
                      const bo = b._order < 0 ? 999 : b._order;
                      return ao - bo || a.name.localeCompare(b.name);
                    });

                  return items.map((item) => (
                    <Grid item xs={6} md={6} key={item.name}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={10}
                          height={10}
                          borderRadius={1}
                          bgcolor={item.color}
                        />
                        <Typography variant="body2">
                          {item.name}: {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ));
                })()}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Budget Burn-down Over Time
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {isLoadingBurn ? (
                <LoadingBox message="Loading burn series…" />
              ) : burnSeriesLive && burnSeriesLive.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={burnSeriesLive}
                    margin={{ top: 8, right: 16, left: -10, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [String(v), "Burn"]} />
                    <Line
                      type="monotone"
                      dataKey="burn"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : burnSeries && burnSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={burnSeries}
                    margin={{ top: 8, right: 16, left: -10, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="burn"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <NoDataBox message="No burn data" />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top 5 Budget Over-runs (Bar)
            </Typography>
            {false ? (
              <LoadingBox message="Loading over‑runs…" />
            ) : overruns && overruns.length > 0 ? (
              <Box sx={{ height: CHART_HEIGHT, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Engagement</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Spend</TableCell>
                      <TableCell align="right">Variance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overruns.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.name}</TableCell>
                        <TableCell align="right">
                          ${e.budget.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${e.spend.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{
                            color: e.variance > 0 ? "#d32f2f" : undefined,
                          }}
                        >
                          {e.variance >= 0 ? "+" : ""}$
                          {e.variance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <NoDataBox message="No variance data" />
            )}
          </Paper>
        </Grid>

        {/* Roadmap Charts */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Resource Utilisation (Under/Over)
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {false ? (
                <LoadingBox message="Loading utilisation…" />
              ) : utilisationData && utilisationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={utilisationData}
                    margin={{ top: 8, right: 16, left: -20, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, "Utilisation"]} />
                    <Legend
                      content={renderColorLegend}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    <Bar dataKey="util" name="Utilisation %">
                      {utilisationData.map((d, i) => (
                        <Cell
                          key={`util-${d.name}-${i}`}
                          fill={d.util > 100 ? "#d32f2f" : "#66bb6a"}
                        />
                      ))}
                    </Bar>
                    <ReferenceLine
                      y={100}
                      stroke="#d32f2f"
                      strokeDasharray="4 4"
                      label={{
                        value: "100% cap",
                        position: "right",
                        fontSize: 12,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataBox message="No utilisation data" />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Billable vs Non-Billable Time
            </Typography>
            {false ? (
              <LoadingBox message="Loading hours…" height={DONUT_SIZE} />
            ) : billablePie && billablePie.length > 0 ? (
              <Box display="flex" alignItems="center" gap={2}>
                <Box position="relative" width={DONUT_SIZE} height={DONUT_SIZE}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={billablePie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        outerRadius="80%"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        {billablePie.map((d, i) => (
                          <Cell
                            key={d.name}
                            fill={i === 0 ? "#66bb6a" : "#90a4ae"}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} hrs`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h6">
                      {Math.round(
                        (billablePie[0].value /
                          (billablePie[0].value + billablePie[1].value || 1)) *
                          100
                      )}
                      %
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Billable vs non‑billable hours (demo).
                  </Typography>
                </Box>
              </Box>
            ) : (
              <NoDataBox message="No hours data" />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Revenue Potential vs Realised
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {false ? (
                <LoadingBox message="Loading revenue…" />
              ) : revenueBars && revenueBars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueBars}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip
                      formatter={(v, n) => [
                        `$${Number(v).toLocaleString()}`,
                        n,
                      ]}
                    />
                    <Legend
                      content={renderColorLegend}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    <Bar dataKey="Potential" fill="#90caf9" />
                    <Bar dataKey="Realised" fill="#66bb6a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataBox message="No revenue data" />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Resource Demand Forecast
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {false ? (
                <LoadingBox message="Loading forecast…" />
              ) : demandForecast && demandForecast.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={demandForecast}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend
                      content={renderColorLegend}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      name="Capacity"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="required"
                      name="Required"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <NoDataBox message="No forecast data" />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              On-time vs Delayed Assignments
            </Typography>
            {false ? (
              <LoadingBox message="Loading assignments…" />
            ) : onTimeDelayed && onTimeDelayed.length > 0 ? (
              <Box sx={{ width: "100%", height: CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={onTimeDelayed}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="50%"
                      outerRadius="70%"
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {onTimeDelayed.map((d) => (
                        <Cell
                          key={d.name}
                          fill={d.name === "Delayed" ? "#ffa726" : "#66bb6a"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      content={renderColorLegend}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <NoDataBox message="No assignment data" />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: CARD_HEIGHT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Average Turnaround per Engagement
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              {false ? (
                <LoadingBox message="Loading turnaround…" />
              ) : turnaroundData && turnaroundData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={turnaroundData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v} weeks`, "Duration"]} />
                    <Bar dataKey="weeks" name="Weeks" fill="#42a5f5" />
                    <ReferenceLine
                      y={turnaroundAvgWeeks}
                      stroke="#ab47bc"
                      strokeDasharray="4 4"
                      label={{
                        value: `Avg ${turnaroundAvgWeeks}w`,
                        position: "right",
                        fontSize: 12,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataBox message="No turnaround data" />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PulseDashboard;
