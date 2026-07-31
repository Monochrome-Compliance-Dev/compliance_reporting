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
  PublicPageHero,
  PublicPageSection,
} from "shared/ui";

const PDF_PATH = "/diagnostics/Construction_Payment_Diagnostic.pdf";

export default function ConstructionPaymentDiagnostic() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Construction Payment Diagnostic"
        description="Construction payment diagnostic showing how progress-claim mechanics, end-of-month treatment, and retention handling can materially influence reported payment performance."
        url="https://monochrome-compliance.com/construction-payment-diagnostic"
        image="/images/og/og-construction.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Construction sector"
          title="Construction Payment Timing Diagnostic"
          description={
            <>
              A practical way to separate <strong>mechanics</strong> (how claims
              and invoices are processed) from <strong>behaviour</strong> (whether
              suppliers are actually being paid fairly) — and understand what
              your Payment Times Reporting metrics are really reflecting.
            </>
          }
          contentMaxWidth={theme.layout.public.contentWidth}
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Stack spacing={2} alignItems="flex-start">
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AssessmentOutlinedIcon />}
                href={PDF_PATH}
              >
                View illustrative report
              </Button>

              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<ChatOutlinedIcon />}
                component={RouterLink}
                to="/contact"
              >
                Discuss a diagnostic
              </Button>
            </Stack>

            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              No forms. No gimmicks. Just an example output your team can use
              to drive clarity and action.
            </Typography>
          </Stack>
        </PublicPageHero>

        <PublicPageSection
          title="Why this exists"
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <PublicCard component="div">
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
            >
              Construction payment performance is often assessed at face value.
              But progress claims, end-of-month treatment, retention releases,
              milestone verification, and invoice/claim timing conventions can
              materially shift the reporting outcome.
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
            >
              This diagnostic is designed to surface those mechanics quickly —
              so you can understand whether the numbers reflect{" "}
              <strong>process</strong> or <strong>behaviour</strong>, and take
              the right action before the next reporting cycle.
            </Typography>
          </PublicCard>
        </PublicPageSection>

        <PublicPageSection
          title="What the diagnostic does"
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Identifies mechanical distortion drivers"
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
                  Highlights where timing conventions (claim vs invoice date,
                  EOM, retention treatment) can inflate or suppress “within
                  term” outcomes.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Quantifies impact on reported performance"
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
                  Shows the practical delta between the reported metric and the
                  mechanically adjusted view — without changing your underlying
                  payment behaviour.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Produces an executive-ready snapshot"
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
                  A one-page output that gives finance leadership a clear
                  explanation of what is driving the numbers and what to do next.
                </Typography>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Illustrative snapshot"
          introduction="Example metrics (illustrative only — numbers vary by entity, portfolio and claim profile)."
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <PublicCard component="div">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="Sample size"
                  title="124 transactions"
                  titleComponent="p"
                  titleVariant="h5"
                  sx={{ backgroundColor: theme.palette.background.default }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="Reported within term"
                  title="38%"
                  titleComponent="p"
                  titleVariant="h5"
                  sx={{ backgroundColor: theme.palette.background.default }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <PublicCard
                  component="div"
                  eyebrow="Mechanically adjusted within term"
                  title="52%"
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
              The gap between these figures typically points to timing
              interpretation and processing mechanics (not necessarily
              deteriorating supplier treatment). The diagnostic shows *where*
              the distortion is coming from so you can fix the right thing.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
                component={RouterLink}
                to="/contact"
              >
                Discuss a diagnostic
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
                We typically start with a small sample (50–150 transactions) to
                confirm the profile and identify the drivers. Then, if helpful,
                we scale the analysis across the reporting period and align it
                to your reporting approach.
                <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                  If you’re preparing for the next reporting cycle and want a
                  mechanical review that is construction-aware, we’re happy to
                  have a first conversation.
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
            <Button
              variant="text"
              component={RouterLink}
              to="/construction-payment-reporting"
            >
              Learn about Construction PTRS
            </Button>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
