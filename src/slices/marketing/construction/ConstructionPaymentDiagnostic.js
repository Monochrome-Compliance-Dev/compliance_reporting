// src/slices/marketing/construction/ConstructionPaymentDiagnostic.js

import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import PageMeta from "shared/ui/PageMeta";

const PDF_PATH =
  "/diagnostics/Construction_Payment_Timing_Diagnostic_Report_Illustrative.pdf";

export default function ConstructionPaymentDiagnostic() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const contentMaxWidth = 980;
  const sectionSx = { maxWidth: contentMaxWidth, mx: "auto" };

  return (
    <>
      <PageMeta
        title="Construction Payment Timing Diagnostic | Monochrome Compliance"
        description="An illustrative example of how progress-claim mechanics, end-of-month treatment and retention handling can materially influence reported payment performance — without changing your actual payment intent."
        path="/construction-payment-diagnostic"
        image="/images/og/construction-diagnostic.jpg"
      />

      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={sectionSx}>
            <Stack spacing={3}>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                Construction sector
              </Typography>

              <Typography
                variant="h3"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                Construction Payment Timing Diagnostic
              </Typography>

              <Typography
                variant="h6"
                color={theme.palette.text.secondary}
                sx={{ lineHeight: 1.5 }}
              >
                A practical way to separate <strong>mechanics</strong> (how
                claims and invoices are processed) from{" "}
                <strong>behaviour</strong> (whether suppliers are actually being
                paid fairly) — and understand what your Payment Times Reporting
                metrics are really reflecting.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isSmallScreen ? "column" : "row",
                  alignItems: isSmallScreen ? "stretch" : "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AssessmentOutlinedIcon />}
                  href={PDF_PATH}
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  View illustrative report
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<ChatOutlinedIcon />}
                  onClick={() => navigate("/contact")}
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  Discuss a diagnostic
                </Button>

                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  No forms. No gimmicks. Just an example output your team can
                  use to drive clarity and action.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Divider />

      <Box sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h4">Why this exists</Typography>

                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  Construction payment performance is often assessed at face
                  value. But progress claims, end-of-month treatment, retention
                  releases, milestone verification, and invoice/claim timing
                  conventions can materially shift the reporting outcome.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  This diagnostic is designed to surface those mechanics quickly
                  — so you can understand whether the numbers reflect{" "}
                  <strong>process</strong> or <strong>behaviour</strong>, and
                  take the right action before the next reporting cycle.
                </Typography>
              </Stack>
            </Paper>

            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                What the diagnostic does
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <InsightsOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Identifies mechanical distortion drivers
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Highlights where timing conventions (claim vs invoice
                      date, EOM, retention treatment) can inflate or suppress
                      “within term” outcomes.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <FactCheckOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Quantifies impact on reported performance
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Shows the practical delta between the reported metric and
                      the mechanically adjusted view — without changing your
                      underlying payment behaviour.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <AssessmentOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Produces an executive-ready snapshot
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      A one-page output that gives finance leadership a clear
                      explanation of what is driving the numbers and what to do
                      next.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h4">Illustrative snapshot</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Example metrics (illustrative only — numbers vary by entity,
                  portfolio and claim profile).
                </Typography>

                <Divider />

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Sample size
                    </Typography>
                    <Typography variant="h5">124 transactions</Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Reported within term
                    </Typography>
                    <Typography variant="h5">38%</Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Mechanically adjusted within term
                    </Typography>
                    <Typography variant="h5">52%</Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  The gap between these figures typically points to timing
                  interpretation and processing mechanics (not necessarily
                  deteriorating supplier treatment). The diagnostic shows
                  *where* the distortion is coming from so you can fix the right
                  thing.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AssessmentOutlinedIcon />}
                    href={PDF_PATH}
                  >
                    View illustrative report
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ChatOutlinedIcon />}
                    href="/contact"
                  >
                    Discuss a diagnostic
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h4">How we run it</Typography>

                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  We typically start with a small sample (50–150 transactions)
                  to confirm the profile and identify the drivers. Then, if
                  helpful, we scale the analysis across the reporting period and
                  align it to your reporting approach.
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  If you’re preparing for the next reporting cycle and want a
                  mechanical review that is construction-aware, we’re happy to
                  have a first conversation.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    startIcon={<ChatOutlinedIcon />}
                    href="/contact"
                  >
                    Book a quick chat
                  </Button>
                  <Button variant="text" href="/construction-payment-reporting">
                    Learn about Construction PTRS
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
