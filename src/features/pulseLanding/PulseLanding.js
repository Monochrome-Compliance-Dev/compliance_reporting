// src/features/pulseLanding/PulseLanding.js
// Marketing-style landing page for Pulse (audit firm engagement & resource management)
// No new deps. Uses MUI only. Links use plain hrefs to avoid react-router-dom.

import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import { useEffect } from "react";

export default function PulseLanding() {
  const theme = useTheme();

  useEffect(() => {
    const title =
      "Pulse — Engagement & Resource Management for Audit Firms | Monochrome Compliance";
    const description =
      "Pulse gives mid‑tier audit firms clarity on engagements, resources and utilisation — without the admin burden.";
    const baseUrl = window.location.origin;
    const pageUrl = `${baseUrl}/pulse`;
    const imageUrl = `${baseUrl}/images/pulse/dashboard1.png`;

    document.title = title;

    function upsertMeta(selectorKey, selectorValue, attrs = {}) {
      let el = document.head.querySelector(
        `meta[${selectorKey}='${selectorValue}']`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(selectorKey, selectorValue);
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    }

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
  }, [theme]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 2 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          maxWidth: 1200,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        {/* HERO */}
        <Box
          component="section"
          sx={{
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Container maxWidth="lg">
            <Grid
              container
              spacing={4}
              alignItems="center"
              justifyContent="center"
            >
              <Grid
                item
                xs={12}
                md={6}
                sx={{ textAlign: { xs: "center", md: "left" } }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: "-0.5px",
                    wordBreak: "normal",
                    hyphens: "none",
                    overflowWrap: "anywhere",
                    fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                  }}
                  gutterBottom
                >
                  Clarity in client engagements — without the spreadsheets
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: theme.spacing(3),
                    fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
                    maxWidth: { xs: "38ch", md: "unset" },
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  Pulse gives mid‑tier audit firms a clear view of engagements,
                  resources and utilisation — so partners can plan, deliver and
                  report without the admin hell.
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    href="/contact"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Join early adopters
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    href="/pulse/pricing"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    See founder pricing
                  </Button>
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                sx={{ textAlign: { xs: "center", md: "left" } }}
              >
                <Box
                  component="figure"
                  sx={{
                    m: 0,
                    maxWidth: { xs: "100%", md: 640 },
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  <Box
                    component="img"
                    src="/images/pulse/dashboard1.png"
                    alt="Pulse dashboard showing Spend vs Budget donut, Resource Allocation vs Capacity bars, Engagement Status Breakdown donut, Budget burn‑down line, and Utilisation bar chart"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    sx={{ width: "100%", display: "block", borderRadius: 1 }}
                  />
                </Box>
                <Typography
                  component="figcaption"
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: theme.spacing(1),
                    display: "block",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  * Pulse dashboard preview — visualising spend vs budget,
                  resource allocation, and utilisation.
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* BENEFITS */}
        <Box component="section" sx={{ py: { xs: 6 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: theme.spacing(3),
                    height: "100%",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Engagement overview
                  </Typography>
                  <Typography color="text.secondary">
                    Scope, status and milestones at a glance so partners stay
                    aligned without chasing spreadsheets.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: theme.spacing(3),
                    height: "100%",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Resource & utilisation
                  </Typography>
                  <Typography color="text.secondary">
                    Plan capacity and balance workloads — reduce
                    over/under‑allocation and avoid firefighting.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: theme.spacing(3),
                    height: "100%",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Budget vs spend
                  </Typography>
                  <Typography color="text.secondary">
                    Live view of budgets and burn‑down, plus top overruns, so
                    you can intervene early.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* FULL-WIDTH VISUAL */}
        <Box component="section" sx={{ bgcolor: "background.paper" }}>
          <Container maxWidth="lg">
            <Paper elevation={1} sx={{ p: { xs: 1, md: 3 } }}>
              <Typography
                variant="h6"
                sx={{
                  mb: theme.spacing(2),
                  fontWeight: 700,
                  fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.5rem" },
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                A single view of engagements and teams
              </Typography>
              <Box
                component="img"
                src="/images/pulse/dashboard2.png"
                alt="Pulse engagement and resource charts including status breakdowns, budget burn‑down over time, and team utilisation metrics"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                sx={{
                  width: { xs: "100%", sm: "100%" },
                  maxWidth: { xs: "unset", md: 1040 },
                  height: "auto",
                  mx: "auto",
                  display: "block",
                  borderRadius: 1,
                }}
              />
              <Typography
                component="figcaption"
                variant="body2"
                color="text.secondary"
                sx={{ mt: theme.spacing(1) }}
              >
                * Engagement and resource charts — showing status breakdowns,
                budget burn‑down, and utilisation metrics.
              </Typography>
            </Paper>
          </Container>
        </Box>

        {/* COMBINED PRICING + CTA BAND */}
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 3, md: 4 }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                {/* Left: Founder pricing */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: {
                        xs: "1.5rem",
                        sm: "1.875rem",
                        md: "2.125rem",
                      },
                    }}
                    gutterBottom
                  >
                    Founder pricing for early adopters
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    We’re opening a small early‑adopter cohort (first 5 firms)
                    with discounted rates and priority onboarding. See plan
                    details and availability on the pricing page.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    href="/pulse/pricing"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    View Pulse pricing
                  </Button>
                </Box>

                {/* Divider on desktop only */}
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: "none", md: "block" } }}
                />

                {/* Right: Get partners out of spreadsheets */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: {
                        xs: "1.5rem",
                        sm: "1.875rem",
                        md: "2.125rem",
                      },
                    }}
                    gutterBottom
                  >
                    Ready to get partners out of spreadsheets?
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    We’re inviting a small group of mid‑tier firms to trial
                    Pulse and steer the product. If the pains above look
                    familiar, you’re our people.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    href="/contact"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Book a 15‑minute intro
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </Paper>
    </Box>
  );
}
