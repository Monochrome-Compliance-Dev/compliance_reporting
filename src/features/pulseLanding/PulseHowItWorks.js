// src/features/pulseLanding/PulseHowItWorks.js
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";
import { useEffect } from "react";

export default function PulseHowItWorks() {
  const theme = useTheme();

  useEffect(() => {
    const title =
      "How Pulse works — Engagement & Resource Management | Monochrome Compliance";
    const description =
      "See how Pulse replaces spreadsheet chaos with clear engagements, smarter budgets, and obvious resource assignment.";
    const baseUrl = window.location.origin;
    const pageUrl = `${baseUrl}/pulse/how-it-works`;
    const imageUrl = `${baseUrl}/images/pulse/dashboard2.png`;

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
        backgroundColor: theme.palette.background.default,
        py: { xs: 2, md: 4 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          {/* Page header */}
          <Box
            component="header"
            sx={{
              mb: { xs: 3, md: 4 },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
                lineHeight: 1.1,
              }}
            >
              How Pulse works
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
              A quick walkthrough of the benefits, key flows, and a visual
              overview.
            </Typography>
          </Box>

          {/* Benefits */}
          <Box
            component="section"
            aria-labelledby="benefits-heading"
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Typography
              id="benefits-heading"
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Benefits
            </Typography>
            <Container maxWidth="lg" disableGutters>
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

          <Divider sx={{ my: { xs: 3, md: 4 } }} />

          {/* Features */}
          <Box
            component="section"
            aria-labelledby="features-heading"
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Typography
              id="features-heading"
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Features
            </Typography>
            <Container maxWidth="lg" disableGutters>
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
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Streamlined Engagement Wizard
                  </Typography>
                  <Typography color="text.secondary">
                    Spin up a new engagement in a few clear steps. Scope, dates,
                    budget and team — captured without the spreadsheet shuffle.
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Box
                    component="img"
                    src="/images/pulse/Engagement_Wizard.png"
                    alt="Engagement Wizard preview"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    sx={{ width: "100%", height: "auto", borderRadius: 1 }}
                  />
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
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Box
                    component="img"
                    src="/images/pulse/Budget_Builder2.png"
                    alt="Budget Builder preview"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    sx={{ width: "100%", height: "auto", borderRadius: 1 }}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Smarter Budget Builder
                  </Typography>
                  <Typography color="text.secondary">
                    Build or link budgets without duplication. See burn and
                    variance clearly so you can intervene early.
                  </Typography>
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
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Resource assignment made obvious
                  </Typography>
                  <Typography color="text.secondary">
                    Assign people with confidence. Balance workloads and track
                    utilisation without guesswork.
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Box
                    component="img"
                    src="/images/pulse/Resource_Utilisation.png"
                    alt="Resource assignment preview"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    sx={{ width: "100%", height: "auto", borderRadius: 1 }}
                  />
                </Grid>
              </Grid>

              {/* Row 4: Image left, Text right */}
              <Grid container spacing={4} alignItems="center">
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Box
                    component="img"
                    src="/images/pulse/Timesheet.png"
                    alt="Timesheets preview"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    sx={{ width: "100%", height: "auto", borderRadius: 1 }}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ textAlign: { xs: "center", md: "left" } }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Log time against engagements
                  </Typography>
                  <Typography color="text.secondary">
                    Make time capture painless and contextual so actuals roll up
                    to engagements and budgets automatically.
                  </Typography>
                </Grid>
              </Grid>
            </Container>
          </Box>

          <Divider sx={{ my: { xs: 3, md: 4 } }} />

          {/* Visual overview */}
          <Box
            component="section"
            aria-labelledby="visual-heading"
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Typography
              id="visual-heading"
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Visual overview
            </Typography>
            <Container maxWidth="lg" disableGutters>
              <Paper elevation={1} sx={{ p: { xs: 1, md: 3 } }}>
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
        </Paper>
      </Container>
    </Box>
  );
}
