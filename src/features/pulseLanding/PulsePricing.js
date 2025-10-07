// src/features/pulseLanding/PulsePricing.js
// Pulse pricing page — aligned with the global theme wrapper pattern
// No new deps. Only MUI. Links use hrefs to avoid react-router-dom.

import { useEffect } from "react";
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
  Container,
  Stack,
} from "@mui/material";

export default function PulsePricing() {
  const theme = useTheme();

  useEffect(() => {
    const title =
      "Pulse Pricing — Launch Offer $50→$200 | Monochrome Compliance";
    const description =
      "Launch pricing: $50/month for your first 3 months, then $200/month (20 users included). Limited launch cohort.";
    const pageUrl = `${window.location.origin}/pulse/pricing`;
    const imageUrl = `${window.location.origin}/images/pulse/dashboard1.png`;

    function upsertMeta(selectorKey, selectorValue, attrs) {
      let element = document.head.querySelector(
        `meta[${selectorKey}="${selectorValue}"]`
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(selectorKey, selectorValue);
        document.head.appendChild(element);
      }
      for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
      }
    }

    document.title = title;

    upsertMeta("name", "description", { content: description });
    upsertMeta("property", "og:type", { content: "website" });
    upsertMeta("property", "og:title", { content: title });
    upsertMeta("property", "og:description", { content: description });
    upsertMeta("property", "og:url", { content: pageUrl });
    upsertMeta("property", "og:image", { content: imageUrl });
    upsertMeta("name", "twitter:card", { content: "summary_large_image" });
    upsertMeta("name", "twitter:title", { content: title });
    upsertMeta("name", "twitter:description", { content: description });
    upsertMeta("name", "twitter:image", { content: imageUrl });
  }, []);

  const totalFounderSlots = 50;
  const claimedFounderSlots = 1; // TODO: wire from backend later
  const remainingFounderSlots = Math.max(
    totalFounderSlots - claimedFounderSlots,
    0
  );
  const isStandardEnabled = remainingFounderSlots === 0;

  return (
    <>
      {/* FULL-WIDTH BANNER: scrolling scarcity notice (same style as landing) */}
      <Box
        sx={{
          width: "100%",
          overflow: "hidden",
          bgcolor: "warning.main",
          color: "warning.contrastText",
          fontWeight: 700,
          py: 1,
          textAlign: "center",
          mb: 2,
          position: "sticky",
          top: { xs: 88, sm: 96 },
          zIndex: 1000,
          "& .scrolling": {
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scroll-left 15s linear infinite",
          },
          "@keyframes scroll-left": {
            "0%": { transform: "translateX(100%)" },
            "100%": { transform: "translateX(-100%)" },
          },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            {/* Scrolling message (left) */}
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Box className="scrolling">
                ⚡ Only {remainingFounderSlots} of {totalFounderSlots}{" "}
                launch‑cohort spots left — $50/m for 3 months, then $200/m (20
                users included). ⚡
              </Box>
            </Box>
            {/* Static CTA (right) — hidden on xs */}
            <Button
              variant="contained"
              size="small"
              href="/pulse/join"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                boxShadow: "none",
              }}
            >
              Join early adopters
            </Button>
          </Stack>
        </Container>
      </Box>
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
              Simple, transparent pricing for professional service businesses.
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
              sx={{
                fontWeight: 700,
                mb: theme.spacing(1),
                textAlign: "center",
              }}
            >
              Included in all plans
            </Typography>
            <Grid container spacing={1.5} sx={{ maxWidth: 760, mx: "auto" }}>
              {[
                "Engagement overview (scope, status, milestones)",
                "Resource planning & utilisation",
                "Budget vs spend with burn‑down",
                "Timesheets & approvals (MVP)",
                "Partner‑ready summaries (coming soon)",
              ].map((text) => (
                <Grid item xs={12} md={6} key={text}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                  >
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
              {/* Launch cohort */}
              <Grid item xs={12} md={4}>
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
                      label="First 50 firms"
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: theme.spacing(2),
                        right: theme.spacing(2),
                      }}
                    />
                    <Typography variant="overline" color="text.secondary">
                      Launch cohort
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        $50
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / month for your first 3 months
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      then $200 / month ongoing
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      <strong>20 users included</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: theme.spacing(2) }}
                    >
                      Launch pricing for the first fifty businesses.
                      Month‑to‑month. Cancel anytime. Priority onboarding.
                    </Typography>
                    <Box sx={{ mt: theme.spacing(1), mb: theme.spacing(2) }}>
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ mb: 0.5 }}
                      >
                        {claimedFounderSlots} of {totalFounderSlots}{" "}
                        launch‑cohort spots filled
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(claimedFounderSlots / totalFounderSlots) * 100}
                        sx={{ height: 6, borderRadius: 999 }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      href="/pulse/join"
                    >
                      Join early adopters
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      After the launch cohort, standard pricing applies. Your
                      ongoing rate after month 3 is $200/month (20 users
                      included).
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Standard (Most popular) */}
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: theme.spacing(3),
                    height: "100%",
                    position: "relative",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                    opacity: (t) => (isStandardEnabled ? 1 : 0.65),
                  }}
                >
                  <Chip
                    label={
                      isStandardEnabled ? "Most popular" : "Available soon"
                    }
                    color={isStandardEnabled ? "secondary" : "default"}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: theme.spacing(2),
                      right: theme.spacing(2),
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" color="text.secondary">
                      Standard
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700 }}
                      gutterBottom
                    >
                      $200{" "}
                      <span style={{ fontSize: 16, opacity: 0.7 }}>
                        {" "}
                        / month
                      </span>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: theme.spacing(2) }}>
                      <strong>20 users included</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: theme.spacing(3) }}
                    >
                      Designed for small and mid‑size professional service
                      businesses. Month‑to‑month. Cancel anytime.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    href="/pulse/join"
                    disabled={!isStandardEnabled}
                  >
                    {isStandardEnabled
                      ? "Start for $200/month"
                      : "Unlocks after launch cohort fills"}
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    {isStandardEnabled
                      ? "Month‑to‑month. Cancel anytime."
                      : "Standard pricing unlocks once all launch cohort spots are filled."}
                  </Typography>
                </Paper>
              </Grid>

              {/* Growth / Enterprise */}
              <Grid item xs={12} md={4}>
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
                      Growth / Enterprise
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700 }}
                      gutterBottom
                    >
                      Custom pricing
                    </Typography>
                    <Typography variant="body1" sx={{ mb: theme.spacing(2) }}>
                      Unlimited users
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: theme.spacing(3) }}
                    >
                      Advanced reporting, dedicated support, and custom
                      integrations / SSO.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    href="/pulse/join"
                  >
                    Talk to us
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1, visibility: "hidden" }}
                  >
                    Contact us for a tailored plan.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Notes */}
          <Box sx={{ mt: theme.spacing(5), textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Prices in AUD, excluding GST. Fair‑use limits apply during the
              early cohort while we scale. Additional users available on
              request.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
