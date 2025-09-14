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
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import { useEffect, useRef, useState } from "react";
import { InsightCards, INSIGHT_CARDS } from "../pulse/maximiser/PulseMaximiser";

export default function PulseLanding() {
  const theme = useTheme();

  const heroRef = useRef(null);
  const [showMobileCta, setShowMobileCta] = useState(false);

  const totalFounderSlots = 50;
  const claimedFounderSlots = 1; // TODO: wire from backend later
  const remainingFounderSlots = Math.max(
    totalFounderSlots - claimedFounderSlots,
    0
  );

  useEffect(() => {
    const title =
      "Pulse — Engagement & Resource Management for Teams | Monochrome Compliance";
    const description =
      "Pulse helps teams and businesses plan work, balance resources and deliver with confidence — without the admin burden.";
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

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Show sticky CTA when hero is NOT visible
        setShowMobileCta(!entry.isIntersecting);
      },
      { root: null, threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [heroRef]);

  const maximiserPreviewItems = INSIGHT_CARDS.filter((c) =>
    ["estimation-vs-reality", "burnout-radar", "team-trends"].includes(c.key)
  );

  return (
    <>
      {/* FULL-WIDTH BANNER: scrolling scarcity notice */}
      <Box
        data-role="scroll-banner"
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
            animation: "scroll-left 25s linear infinite",
            animationDelay: "2s",
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
                ⚡ Only {remainingFounderSlots} of {totalFounderSlots} early
                access spots — join the waitlist. ⚡
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
              Join the waitlist
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
          <Box component="section" ref={heroRef}>
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
                    One solution for scope, budgets, people, and time.
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      mb: theme.spacing(2),
                      fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
                      maxWidth: { xs: "38ch", md: "unset" },
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    Whether you run projects, teams, or whole departments, Pulse
                    gives you a single view of plan vs actuals — and AI that
                    tells you what needs attention
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
                      href="/pulse/join"
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Join the waitlist
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      href="/pulse/join"
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Request a walkthrough
                    </Button>
                    {/* <Button
                      className="screen-only"
                      variant="text"
                      size="small"
                      onClick={() => window.print()}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Print this page (PDF)
                    </Button> */}
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      className="print-url"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "none" }}
                    >
                      Join: monochrome-compliance.com/pulse/join • Pricing:
                      monochrome-compliance.com/pulse/pricing
                    </Typography>
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
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* HOW IT WORKS */}
          <Box
            data-role="sticky-cta"
            component="section"
            sx={{ py: { xs: 4, md: 6 }, mt: { xs: 4, md: 6 } }}
          >
            <Container maxWidth="lg">
              <Stack
                spacing={2}
                sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1, fontWeight: 700 }}
                >
                  HOW PULSE WORKS
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.75rem", md: "2rem" },
                  }}
                >
                  From plan to improvement — in three steps
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          1) Plan
                        </Typography>
                        <ChecklistRtlOutlinedIcon
                          fontSize="medium"
                          color="action"
                          aria-hidden
                        />
                      </Stack>
                      <Typography color="text.secondary">
                        Set scope, dates, budgets and roles in minutes. Everyone
                        starts on the same page.
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          2) Run
                        </Typography>
                        <BoltOutlinedIcon
                          fontSize="medium"
                          color="action"
                          aria-hidden
                        />
                      </Stack>
                      <Typography color="text.secondary">
                        Assign people, capture time, and keep work flowing —
                        without the spreadsheet shuffle.
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          3) Improve
                        </Typography>
                        <AutoGraphOutlinedIcon
                          fontSize="medium"
                          color="action"
                          aria-hidden
                        />
                      </Stack>
                      <Typography color="text.secondary">
                        AI flags drift, overload and risks with clear next steps
                        so you can adjust with confidence.
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* AI-POWERED: Pulse Maximiser (Included) */}
          <Box
            component="section"
            sx={{
              py: { xs: 4, md: 6 },
              mt: { xs: 4, md: 6 },
              bgcolor: (t) =>
                t.palette.mode === "light" ? "grey.50" : "background.default",
              borderTop: (t) => `1px solid ${t.palette.divider}`,
              borderBottom: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Container maxWidth="lg">
              <Stack
                spacing={2}
                sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1, fontWeight: 700 }}
                >
                  AI‑POWERED • INCLUDED WITH PULSE
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.75rem", md: "2rem" },
                  }}
                >
                  Pulse Maximiser (Beta) — AI‑powered insights from your
                  timesheets
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    maxWidth: { xs: "48ch", md: "70ch" },
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  Pulse Maximiser uses AI to analyse the timesheets you already
                  have and highlight where work took longer than planned, where
                  people are regularly working extra hours, and how teams
                  compare. It isn’t about micromanagement — it’s AI that helps
                  you plan better, protect people from burnout, and deliver with
                  more confidence.
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mt: 2, fontStyle: "italic" }}
                >
                  “Pulse shows us where projects drift — without managers
                  chasing timesheets.”
                </Paper>
              </Stack>

              <InsightCards items={maximiserPreviewItems} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  mt: 3,
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <Button href="/pulse/maximiser" variant="outlined" size="large">
                  See AI sample insights
                </Button>
                <Button href="/pulse/join" variant="contained" size="large">
                  Join the waitlist
                </Button>
              </Stack>
            </Container>
          </Box>

          {/* FEATURE TEASER: alternating text + image placeholders */}
          <Box
            component="section"
            sx={{
              py: { xs: 2, md: 4 },
              mt: { xs: 4, md: 6 },
              px: 2,
              bgcolor: (theme) =>
                theme.palette.mode === "light"
                  ? "grey.50"
                  : "background.default",
            }}
          >
            <Container maxWidth="lg" disableGutters>
              <Box
                sx={{
                  mb: { xs: 4, md: 6 },
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1, fontWeight: 700 }}
                >
                  PRODUCT HIGHLIGHTS
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mt: 0.5,
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                  }}
                >
                  What you’ll use every day
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1, maxWidth: { xs: "38ch", md: "60ch" } }}
                >
                  Four core flows that remove the spreadsheet shuffle and keep
                  teams aligned.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    mt: 2,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                ></Stack>
              </Box>
              {/* Row 1: Text left, Image right */}
              <Grid
                container
                spacing={4}
                alignItems="center"
                sx={{ mb: { xs: 4, md: 6 } }}
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 1, md: 1 },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", md: "1.75rem" },
                    }}
                    gutterBottom
                  >
                    Streamlined Engagement Wizard
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      maxWidth: { xs: "46ch", md: "56ch" },
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    Spin up a new engagement in a few clear steps. Scope, dates,
                    budget and team — captured without the spreadsheet shuffle.
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      href="/pulse/join"
                      size="small"
                      variant="text"
                      sx={{ textTransform: "none" }}
                    >
                      Join the waitlist →
                    </Button>
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 2, md: 2 },
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 1,
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      "&:hover": { transform: "scale(1.01)" },
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/pulse/Engagement_Wizard.png"
                      alt="Engagement Wizard preview"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      sx={{
                        width: "100%",
                        display: "block",
                        maxHeight: { xs: 260, sm: 300, md: 360 },
                        objectFit: "cover",
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {/* Row 2: Image left, Text right */}
              <Grid
                container
                spacing={4}
                alignItems="center"
                sx={{ mb: { xs: 4, md: 6 } }}
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 2, md: 1 },
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 1,
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      "&:hover": { transform: "scale(1.01)" },
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/pulse/Budget_Builder2.png"
                      alt="Budget Builder preview"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      sx={{
                        width: "100%",
                        display: "block",
                        maxHeight: { xs: 260, sm: 300, md: 360 },
                        objectFit: "cover",
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 1, md: 2 },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", md: "1.75rem" },
                    }}
                    gutterBottom
                  >
                    Smarter Budget Builder
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      maxWidth: { xs: "46ch", md: "56ch" },
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    Build or link budgets without duplication. See burn and
                    variance clearly so you can intervene early.
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      href="/pulse/join"
                      size="small"
                      variant="text"
                      sx={{ textTransform: "none" }}
                    >
                      Join the waitlist →
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Row 3: Text left, Image right */}
              <Grid
                container
                spacing={4}
                alignItems="center"
                sx={{ mb: { xs: 4, md: 6 } }}
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 1, md: 1 },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", md: "1.75rem" },
                    }}
                    gutterBottom
                  >
                    Resource assignment made obvious
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      maxWidth: { xs: "46ch", md: "56ch" },
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    Assign people with confidence. Balance workloads and track
                    utilisation without guesswork.
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      href="/pulse/join"
                      size="small"
                      variant="text"
                      sx={{ textTransform: "none" }}
                    >
                      Join the waitlist →
                    </Button>
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 2, md: 2 },
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 1,
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      "&:hover": { transform: "scale(1.01)" },
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/pulse/Resource_Utilisation.png"
                      alt="Resource assignment preview"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      sx={{
                        width: "100%",
                        display: "block",
                        maxHeight: { xs: 260, sm: 300, md: 360 },
                        objectFit: "cover",
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {/* Row 4: Image left, Text right */}
              <Grid container spacing={4} alignItems="center">
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 2, md: 1 },
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 1,
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      "&:hover": { transform: "scale(1.01)" },
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/pulse/Timesheet.png"
                      alt="Timesheets preview"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      sx={{
                        width: "100%",
                        display: "block",
                        maxHeight: { xs: 260, sm: 300, md: 360 },
                        objectFit: "cover",
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    order: { xs: 1, md: 2 },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.5rem", md: "1.75rem" },
                    }}
                    gutterBottom
                  >
                    Log time against engagements
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      maxWidth: { xs: "46ch", md: "56ch" },
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    Make time capture painless and contextual so actuals roll up
                    to engagements and budgets automatically.
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      href="/pulse/join"
                      size="small"
                      variant="text"
                      sx={{ textTransform: "none" }}
                    >
                      Join the waitlist →
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* COMBINED PRICING + CTA BAND */}
          <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
            <Container maxWidth="lg">
              <Paper
                variant="outlined"
                sx={{ p: { xs: 3, md: 4 }, position: "relative" }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 3, md: 4 }}
                  alignItems={{ xs: "stretch", md: "stretch" }}
                  justifyContent="space-between"
                >
                  {/* Left: Ready to make the move from spreadsheets to clarity and
                      actionable insight? */}
                  <Box sx={{ flex: 1, display: "flex" }}>
                    <Stack
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ height: "100%" }}
                    >
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
                      >
                        Ready to leave spreadsheet juggling behind?
                      </Typography>
                      <Typography color="text.secondary">
                        We’re inviting a small group of teams and businesses to
                        trial Pulse and help steer the product. Born in
                        professional services firms, Pulse works anywhere people
                        run projects with scope, budgets and deadlines.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="large"
                        href="/pulse/join"
                        sx={{
                          alignSelf: { xs: "stretch", sm: "flex-start" },
                          mt: "auto",
                        }}
                      >
                        Join the waitlist
                      </Button>
                    </Stack>
                  </Box>

                  {/* Divider on desktop only */}
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", md: "block" } }}
                  />

                  {/* Right: Founder pricing */}
                  <Box sx={{ flex: 1, display: "flex" }}>
                    <Stack
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ height: "100%" }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Pilot pricing for early adopters
                      </Typography>
                      <Typography color="text.secondary">
                        We’re opening a small early‑adopter cohort (first 50
                        firms) with discounted rates and priority onboarding.
                        See plan details and availability on the pricing page.
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        href="/pulse/pricing"
                        sx={{
                          alignSelf: { xs: "stretch", sm: "flex-start" },
                          mt: "auto",
                        }}
                      >
                        View Pulse pricing
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Container>
          </Box>
          {/* Mobile sticky footer CTA: shows after hero is scrolled out */}
          <Box
            sx={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              display: { xs: showMobileCta ? "block" : "none", md: "none" },
              bgcolor: "background.paper",
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: 3,
              py: 1,
            }}
          >
            <Container maxWidth="lg">
              <Button
                href="/pulse/join"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.25 }}
              >
                Join the waitlist
              </Button>
            </Container>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
