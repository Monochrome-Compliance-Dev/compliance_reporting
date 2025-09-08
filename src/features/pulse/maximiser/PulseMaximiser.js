// Pulse Maximiser — server-backed page + upload demo
// Note: No explicit React import required for modern JSX. Follow project conventions.

import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsIcon from "@mui/icons-material/Groups";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import LinkIcon from "@mui/icons-material/Link";

import PulseMaximiserWidget from "../../pulseLanding/PulseMaximiserWidget";
import { pulseService } from "../../../services/pulse/pulse";
import { useAlert } from "../../../context/AlertContext";

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

// Page wrapper for the dedicated Pulse Maximiser route
export default function PulseMaximiser() {
  const { pushAlert } = useAlert?.() || { pushAlert: () => {} };

  const [tab, setTab] = useState(0); // 0 = My Pulse data, 1 = Upload CSV
  const [loading, setLoading] = useState(false);
  const [overruns, setOverruns] = useState([]);
  const [utilisation, setUtilisation] = useState([]);
  const [weeklyBurn, setWeeklyBurn] = useState([]);

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
          pushAlert({
            severity: "error",
            message: "Couldn’t load Pulse data.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pushAlert]);

  const keyStats = useMemo(() => {
    const overrunsCount = Array.isArray(overruns) ? overruns.length : 0;
    const avgUtil =
      Array.isArray(utilisation) && utilisation.length
        ? Math.round(
            utilisation.reduce((s, r) => s + (Number(r.utilPct) || 0), 0) /
              utilisation.length
          )
        : 0;
    const recentBurn =
      Array.isArray(weeklyBurn) && weeklyBurn.length
        ? weeklyBurn[weeklyBurn.length - 1]
        : null;
    const recentBurnVal =
      recentBurn && Number(recentBurn?.hours)
        ? Number(recentBurn.hours).toFixed(0)
        : 0;

    return { overrunsCount, avgUtil, recentBurnVal };
  }, [overruns, utilisation, weeklyBurn]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Use my Pulse data" />
          <Tab label="Upload a CSV" />
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

              <Divider sx={{ my: 4 }} />

              <InsightCards />
            </>
          )}
        </Box>
      )}

      {/* Tab 1 — Public upload demo widget (client-only) */}
      {tab === 1 && <PulseMaximiserWidget />}
    </Container>
  );
}
