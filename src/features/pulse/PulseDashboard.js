import {
  Container,
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  CircularProgress,
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

// --- Layout constants ---
const CARD_HEIGHT = 280; // total card height
const CHART_HEIGHT = 200; // common chart area height
const DONUT_SIZE = 200; // width/height for donut charts

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
const totals = {
  budget: mockEngagements.reduce((a, e) => a + e.budget, 0),
  spend: mockEngagements.reduce((a, e) => a + e.spend, 0),
};
const spendPct = Math.min(
  100,
  Math.round((totals.spend / totals.budget) * 100)
);

const statusCounts = mockEngagements.reduce((acc, e) => {
  acc[e.status] = (acc[e.status] || 0) + 1;
  return acc;
}, {});
const statusPalette = ["#66bb6a", "#42a5f5", "#ffa726", "#ef5350", "#ab47bc"]; // planning/in progress/complete/delayed/other
const statusEntries = Object.entries(statusCounts);
const statusTotal = statusEntries.reduce((a, [, v]) => a + v, 0);

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
  { name: "Spend", value: Math.min(totals.spend, totals.budget) },
  { name: "Remaining", value: Math.max(totals.budget - totals.spend, 0) },
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

const PulseDashboard = () => {
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
        <Button component={Link} to="/pulse/admin" variant="outlined">
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
              Spend vs Budget (Dial)
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box position="relative" width={DONUT_SIZE} height={DONUT_SIZE}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="80%"
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {spendData.map((d, i) => (
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
                  <Typography variant="h6">{spendPct}%</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Budget: ${totals.budget.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Spend: ${totals.spend.toLocaleString()}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  Health:{" "}
                  {spendPct <= 85
                    ? "On Track"
                    : spendPct <= 100
                      ? "Watch"
                      : "Over"}
                </Typography>
              </Box>
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
              Resource Allocation vs Capacity (Stacked Bar)
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allocStackData}
                  margin={{ top: 8, right: 16, left: -20, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="inCap"
                    stackId="a"
                    name="Allocated (within capacity)"
                    fill="#90caf9"
                  />
                  <Bar
                    dataKey="over"
                    stackId="a"
                    name="Over-allocation"
                    fill="#d32f2f"
                  />
                </BarChart>
              </ResponsiveContainer>
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
              Engagement Status Breakdown (Donut)
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {(() => {
                const statusData = statusEntries.map(([label, value], idx) => ({
                  name: label,
                  value,
                  color: statusPalette[idx % statusPalette.length],
                }));
                const inProg = statusCounts["In Progress"] || 0;
                const centreLabel = Math.round(
                  (inProg / (statusTotal || 1)) * 100
                );
                return (
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
                );
              })()}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Breakdown of engagement statuses.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1, maxHeight: CARD_HEIGHT - 210, overflow: "auto" }}>
              <Grid container spacing={1}>
                {statusEntries.map(([label, value], idx) => (
                  <Grid item xs={6} md={6} key={label}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        width={10}
                        height={10}
                        borderRadius={1}
                        bgcolor={statusPalette[idx % statusPalette.length]}
                      />
                      <Typography variant="body2">
                        {label}: {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
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
              Budget Burn-down Over Time (Line)
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
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
                  <Legend />
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueBars}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip
                    formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n]}
                  />
                  <Legend />
                  <Bar dataKey="Potential" fill="#90caf9" />
                  <Bar dataKey="Realised" fill="#66bb6a" />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={demandForecast}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
              Average Turnaround per Engagement
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT, flexGrow: 1 }}>
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
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PulseDashboard;
