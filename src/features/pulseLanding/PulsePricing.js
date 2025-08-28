// src/features/pulseLanding/PulsePricing.js
// Pulse pricing page — aligned with the global theme wrapper pattern
// No new deps. Only MUI. Links use hrefs to avoid react-router-dom.

import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  useTheme,
  LinearProgress,
  Card,
} from "@mui/material";

export default function PulsePricing() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: theme.spacing(4),
          maxWidth: 1200,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: theme.spacing(4) }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }} gutterBottom>
            Pulse pricing
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Simple, transparent pricing for mid‑tier audit firms. Early adopters
            help shape the roadmap and get founder‑level rates.
          </Typography>
        </Box>

        {/* Shared features */}
        <Card
          elevation={1}
          sx={{
            position: "relative",
            mb: theme.spacing(4),
            p: { xs: theme.spacing(2.5), md: theme.spacing(3) },
            maxWidth: 900,
            mx: "auto",
            borderRadius: 3,
            boxShadow: 2,
            border: (t) => `1px solid ${t.palette.divider}`,
            background: (t) =>
              `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.action.hover} 100%)`,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: theme.spacing(1), textAlign: "center" }}
          >
            Included in all plans
          </Typography>
          <Grid container spacing={1.5} sx={{ maxWidth: 760, mx: "auto" }}>
            {[
              "Engagement overview (scope, status, milestones)",
              "Resource planning & utilisation",
              "Budget vs spend with burn‑down",
              "Timesheets & approvals (MVP)",
              "Partner‑ready summaries (CSV export)",
            ].map((text) => (
              <Grid item xs={12} md={6} key={text}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      flex: "0 0 auto",
                    }}
                  />
                  <Typography variant="body2">{text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Cards */}
        <Box
          sx={{
            mt: theme.spacing(2),
            mb: theme.spacing(2),
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            background: (t) =>
              `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.action.hover} 100%)`,
          }}
        >
          <Grid container spacing={3} justifyContent="center">
            {/* Early adopter (first 5) */}
            <Grid item xs={12} md={5}>
              <Paper
                variant="outlined"
                sx={{
                  p: theme.spacing(3),
                  height: "100%",
                  position: "relative",
                  backgroundColor: (t) =>
                    t.palette.mode === "dark"
                      ? t.palette.primary.dark
                      : t.palette.primary.lighter || t.palette.action.hover,
                  borderColor: (t) => t.palette.primary.main,
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Chip
                    label="First 5 firms"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: theme.spacing(2),
                      right: theme.spacing(2),
                    }}
                  />
                  <Typography variant="overline" color="text.secondary">
                    Early adopter
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      $500
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / month
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through", ml: 1 }}
                    >
                      $1,000
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="body1">$30</Typography>
                    <Typography variant="body2" color="text.secondary">
                      / user / month
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through", ml: 1 }}
                    >
                      $50
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: theme.spacing(2) }}
                  >
                    Founder pricing for the first five firms. Month‑to‑month.
                    Cancel anytime. Priority onboarding when we open wider.
                  </Typography>
                  <Box sx={{ mt: theme.spacing(1), mb: theme.spacing(2) }}>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ mb: 0.5 }}
                    >
                      3 of 5 early adopter spots filled
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(3 / 5) * 100}
                      sx={{ height: 6, borderRadius: 999 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    href="/contact"
                  >
                    Join early adopters
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Once 5 firms are onboarded, pricing reverts to $1,000/month
                    & $50/user/month.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Standard plan */}
            <Grid item xs={12} md={5}>
              <Paper
                variant="outlined"
                sx={{
                  p: theme.spacing(3),
                  height: "100%",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Standard
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    $1,000
                    <span style={{ fontSize: 16, opacity: 0.7 }}> / month</span>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: theme.spacing(2) }}>
                    $50
                    <span style={{ fontSize: 14, opacity: 0.7 }}>
                      {" "}
                      / user / month
                    </span>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: theme.spacing(3) }}
                  >
                    For firms joining after the early adopter cohort.
                    Month‑to‑month. Cancel anytime.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  href="/contact"
                >
                  Talk to us
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1, visibility: "hidden" }}
                >
                  Once 5 firms are onboarded, pricing reverts to $1,000/month &
                  $50/user/month.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Notes */}
        <Box sx={{ mt: theme.spacing(5), textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Prices in AUD, excluding GST. Fair‑use limits apply during the early
            cohort while we scale.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
