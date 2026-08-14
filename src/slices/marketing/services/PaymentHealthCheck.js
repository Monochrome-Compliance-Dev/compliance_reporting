import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import {
  PublicCallToAction,
  PublicCard,
  PublicPageSection,
} from "shared/ui";

export default function PaymentHealthCheck() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Payment Health Check"
        description="A practical payment health check to make payment behaviour visible, identify late-payment patterns, and highlight the operational drivers affecting supplier outcomes and reporting performance."
        url="https://monochrome-compliance.com/payment-health-check"
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageSection sx={{ py: { xs: 4, md: 6 } }}>
          <Grid
            container
            spacing={{ xs: 3, md: 5 }}
            alignItems={{ xs: "flex-start", md: "stretch" }}
          >
            <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex" }}>
              <Stack
                spacing={2}
                justifyContent="center"
                sx={{ width: "100%", maxWidth: 600 }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    letterSpacing: 1.4,
                  }}
                >
                  Core service
                </Typography>

                <Typography component="h1" variant="h3">
                  Payment Health Check
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    lineHeight: 1.55,
                  }}
                >
                  A practical way to understand how your organisation is
                  actually paying suppliers, identify the patterns driving poor
                  outcomes, and focus attention on the issues that matter before
                  they harden into reporting or compliance problems.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<AssessmentOutlinedIcon />}
                    component={RouterLink}
                    to="/contact"
                  >
                    Discuss a health check
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    startIcon={<InsightsOutlinedIcon />}
                    component={RouterLink}
                    to="/construction-payment-diagnostic"
                  >
                    View a specialist example
                  </Button>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Start broad, then go deeper where the mechanics or operating
                  context demand it.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex" }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: { xs: "16 / 10", sm: "2 / 1", md: "4 / 3" },
                  overflow: "hidden",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.layout.public.borderRadius,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Box
                  component="img"
                  src="/images/services/payment-health-check.jpg"
                  alt="Abstract representation of payment analysis and insight"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Why this exists"
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <PublicCard component="div">
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
            >
              Many organisations only look closely at payment behaviour when
              reporting deadlines arrive, supplier complaints escalate, or a
              regulator starts asking questions. By then, the patterns are
              already embedded in the data and harder to untangle.
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
            >
              This health check is designed to surface those patterns early —
              so finance and operational leaders can distinguish between
              isolated exceptions, process bottlenecks, and genuine payment
              behaviour issues, then focus on the right corrective action.
            </Typography>
          </PublicCard>
        </PublicPageSection>

        <PublicPageSection
          title="What the health check does"
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Identifies late-payment patterns"
                titleComponent="h3"
                titleVariant="h6"
              >
                <InsightsOutlinedIcon
                  aria-hidden="true"
                  sx={{ color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  Highlights where supplier payment outcomes are being dragged
                  down by timing clusters, approval delays, processing backlogs,
                  or other repeatable operational patterns.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Separates process issues from behaviour issues"
                titleComponent="h3"
                titleVariant="h6"
              >
                <FactCheckOutlinedIcon
                  aria-hidden="true"
                  sx={{ color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  Shows whether poor outcomes appear to be driven by system and
                  workflow friction, policy settings, or genuinely slow payment
                  behaviour so you can fix the right thing.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Produces a leadership-ready view"
                titleComponent="h3"
                titleVariant="h6"
              >
                <AssessmentOutlinedIcon
                  aria-hidden="true"
                  sx={{ color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  A concise output that gives decision-makers a practical
                  picture of what is happening in the payment data and where
                  intervention is likely to make the biggest difference.
                </Typography>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Illustrative snapshot"
          introduction="Example indicators only — the exact mix depends on your payment profile, operating model, and supplier base."
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <PublicCard component="div">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="Sample reviewed"
                  title="148 payments"
                  titleComponent="p"
                  titleVariant="h5"
                  sx={{ backgroundColor: theme.palette.background.default }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="On-time or within expected range"
                  title="61%"
                  titleComponent="p"
                  titleVariant="h5"
                  sx={{ backgroundColor: theme.palette.background.default }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="Pattern requiring intervention"
                  title="3 recurring drivers"
                  titleComponent="p"
                  titleVariant="h5"
                  sx={{ backgroundColor: theme.palette.background.default }}
                />
              </Grid>
            </Grid>

            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
            >
              In practice, the value is not just the headline number. It is
              understanding which part of the process is creating friction,
              whether that pattern is isolated or systemic, and which next step
              will materially improve supplier outcomes.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<ChatOutlinedIcon />}
                component={RouterLink}
                to="/contact"
              >
                Discuss a health check
              </Button>
              <Button
                variant="outlined"
                startIcon={<AssessmentOutlinedIcon />}
                component={RouterLink}
                to="/construction-payment-diagnostic"
              >
                See the construction example
              </Button>
            </Stack>
          </PublicCard>
        </PublicPageSection>

        <PublicPageSection sx={{ pt: 0, pb: { xs: 4, md: 6 } }}>
          <PublicCallToAction
            align="left"
            title="How we run it"
            description={
              <>
                We typically start with a focused sample to understand the
                profile, identify the main drivers, and test whether the issue
                is behavioural, operational, or structural. If useful, we then
                scale the analysis and align it to your broader reporting or
                remediation approach.
                <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                  Where industry mechanics matter materially — for example in
                  construction — we can extend the health check into a more
                  specialist diagnostic view.
                </Box>
              </>
            }
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Button
              variant="contained"
              startIcon={<ChatOutlinedIcon />}
              component={RouterLink}
              to="/contact"
            >
              Book a quick chat
            </Button>
            <Button variant="text" component={RouterLink} to="/services">
              Explore core services
            </Button>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
