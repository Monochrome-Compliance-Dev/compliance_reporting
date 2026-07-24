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

export default function PaymentHealthCheck() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const contentMaxWidth = 980;
  const sectionSx = { maxWidth: contentMaxWidth, mx: "auto" };

  return (
    <>
      <PageMeta
        title="Payment Health Check"
        description="A practical payment health check to make payment behaviour visible, identify late-payment patterns, and highlight the operational drivers affecting supplier outcomes and reporting performance."
        url="https://monochrome-compliance.com/services/payment-health-check"
        image="/images/og/og-industry-insights.jpg"
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
                Core service
              </Typography>

              <Typography
                variant="h3"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                Payment Health Check
              </Typography>

              <Typography
                variant="h6"
                color={theme.palette.text.secondary}
                sx={{ lineHeight: 1.5 }}
              >
                A practical way to understand how your organisation is actually
                paying suppliers, identify the patterns driving poor outcomes,
                and focus attention on the issues that matter before they harden
                into reporting or compliance problems.
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
                  onClick={() => navigate("/contact")}
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  Discuss a health check
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<InsightsOutlinedIcon />}
                  onClick={() =>
                    navigate("/industries/construction/payment-diagnostic")
                  }
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  View a specialist example
                </Button>

                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  Start broad, then go deeper where the mechanics or operating
                  context demand it.
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
                  Many organisations only look closely at payment behaviour when
                  reporting deadlines arrive, supplier complaints escalate, or a
                  regulator starts asking questions. By then, the patterns are
                  already embedded in the data and harder to untangle.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  This health check is designed to surface those patterns early
                  — so finance and operational leaders can distinguish between
                  isolated exceptions, process bottlenecks, and genuine payment
                  behaviour issues, then focus on the right corrective action.
                </Typography>
              </Stack>
            </Paper>

            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                What the health check does
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <InsightsOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Identifies late-payment patterns
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Highlights where supplier payment outcomes are being
                      dragged down by timing clusters, approval delays,
                      processing backlogs, or other repeatable operational
                      patterns.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <FactCheckOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Separates process issues from behaviour issues
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Shows whether poor outcomes appear to be driven by system
                      and workflow friction, policy settings, or genuinely slow
                      payment behaviour so you can fix the right thing.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <AssessmentOutlinedIcon
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Produces a leadership-ready view
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      A concise output that gives decision-makers a practical
                      picture of what is happening in the payment data and where
                      intervention is likely to make the biggest difference.
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
                  Example indicators only — the exact mix depends on your
                  payment profile, operating model, and supplier base.
                </Typography>

                <Divider />

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Sample reviewed
                    </Typography>
                    <Typography variant="h5">148 payments</Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      On-time or within expected range
                    </Typography>
                    <Typography variant="h5">61%</Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Pattern requiring intervention
                    </Typography>
                    <Typography variant="h5">3 recurring drivers</Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", lineHeight: 1.7 }}
                >
                  In practice, the value is not just the headline number. It is
                  understanding which part of the process is creating friction,
                  whether that pattern is isolated or systemic, and which next
                  step will materially improve supplier outcomes.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    startIcon={<ChatOutlinedIcon />}
                    onClick={() => navigate("/contact")}
                  >
                    Discuss a health check
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentOutlinedIcon />}
                    onClick={() =>
                      navigate("/industries/construction/payment-diagnostic")
                    }
                  >
                    See the construction example
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
                  We typically start with a focused sample to understand the
                  profile, identify the main drivers, and test whether the issue
                  is behavioural, operational, or structural. If useful, we then
                  scale the analysis and align it to your broader reporting or
                  remediation approach.
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Where industry mechanics matter materially — for example in
                  construction — we can extend the health check into a more
                  specialist diagnostic view.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    startIcon={<ChatOutlinedIcon />}
                    onClick={() => navigate("/contact")}
                  >
                    Book a quick chat
                  </Button>
                  <Button variant="text" onClick={() => navigate("/services")}>
                    Explore core services
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
