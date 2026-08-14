import {
  Box,
  Button,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import {
  PublicCallToAction,
  PublicCard,
  PublicPageSection,
} from "shared/ui";

export default function ConstructionPaymentReporting() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      <PageMeta
        title="Construction Payment Times Reporting"
        description="Construction Payment Times Reporting support for progress claims, certification, retentions, end-of-month terms and Security of Payment environments."
        image="https://monochrome-compliance.com/images/og/og-construction.jpg"
        url="https://monochrome-compliance.com/construction-payment-reporting"
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
                <Typography component="h1" variant="h3">
                  Construction PTRS, without the confusion
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    lineHeight: 1.55,
                  }}
                >
                  Construction payment environments are not the same as
                  standard trade creditors. Progress claims, certification,
                  retentions, end-of-month terms and state-based Security of
                  Payment requirements can all be compliant and still produce
                  weak PTRS outcomes when reporting logic does not match
                  operating reality.
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
                    component={RouterLink}
                    to="/contact"
                  >
                    Book a construction diagnostic
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    component={RouterLink}
                    to="/construction-payment-diagnostic"
                  >
                    See an example diagnostic
                  </Button>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  A short working session to confirm scope, identify distortion
                  risk, and connect the issue back to your broader PTRS approach.
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
                  src="/images/industries/construction.jpg"
                  alt="Construction site with cranes and a city skyline"
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

        <PublicPageSection sx={{ pt: 0, pb: { xs: 4, md: 6 } }}>
          <PublicSurface sx={{ py: theme.layout.public.cardPadding }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Typography
                variant="body2"
                sx={{ flexGrow: 1, color: theme.palette.text.secondary }}
              >
                Want a deeper breakdown of how construction mechanics affect
                reported outcomes?
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={RouterLink}
                  to="/payment-times-reporting"
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Explore the broader PTRS service
                </Button>
                <Button
                  component={RouterLink}
                  to="/insights"
                  variant="text"
                  color="primary"
                  size="small"
                >
                  Read related insights
                </Button>
              </Stack>
            </Stack>
          </PublicSurface>
        </PublicPageSection>

        <PublicPageSection
          title="Why construction reporting looks worse than it feels"
          introduction="Many construction organisations operate with SOPA-driven workflows. That often creates a mismatch between how payments are managed and how PTRS measures time."
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                title="The Dual Clock Problem"
                titleComponent="h3"
                titleVariant="h6"
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  Security of Payment obligations operate on statutory timing
                  after a valid claim. PTRS reports elapsed calendar days from
                  invoice date to payment date. In progress-claim environments,
                  those clocks can diverge.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                title="Structural drivers that distort outcomes"
                titleComponent="h3"
                titleVariant="h6"
              >
                <Box
                  component="ul"
                  sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                >
                  <li>30 days end-of-month terms (30 becomes 60+ calendar days)</li>
                  <li>Certification and assessment cycles before payment</li>
                  <li>Retentions and milestone releases skew medians</li>
                  <li>Weekly payment runs and cut-offs add artificial lag</li>
                </Box>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection sx={{ py: { xs: 4, md: 6 } }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                title="What we do for construction"
                titleComponent="h2"
                titleVariant="h5"
              >
                <Typography
                  variant="body1"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  We help construction reporting entities submit PTRS accurately
                  and defensibly, with a focus on progress-claim environments
                  and SOPA-driven timing.
                </Typography>

                <Box
                  component="ul"
                  sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                >
                  <li>
                    Validate term declarations against what contracts and
                    workflows actually do
                  </li>
                  <li>
                    Confirm the correct date fields (invoice vs claim vs
                    certification) are driving calculations
                  </li>
                  <li>
                    Review classification and exclusions (retentions, cards,
                    intercompany noise)
                  </li>
                  <li>
                    Produce a review-ready submission with a clear audit trail
                  </li>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  We do not alter invoice dates or payment dates. We ensure the
                  submission accurately reflects the organisation’s contractual
                  and statutory framework.
                </Typography>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                title="The construction diagnostic"
                titleComponent="h2"
                titleVariant="h5"
              >
                <Typography
                  variant="body1"
                  sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
                >
                  A short working session to confirm whether your reporting
                  approach is likely to suppress outcomes or create avoidable
                  commentary.
                </Typography>

                <Box
                  component="ul"
                  sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                >
                  <li>
                    Identify the top 2–3 structural drivers affecting your
                    metrics
                  </li>
                  <li>
                    Confirm the minimum changes needed to improve accuracy and
                    defensibility
                  </li>
                  <li>Outline the quickest path to a clean draft submission</li>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    component={RouterLink}
                    to="/construction-payment-diagnostic"
                  >
                    See an example diagnostic
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    component={RouterLink}
                    to="/contact"
                  >
                    Get started
                  </Button>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  If you already have your reporting period dataset prepared, we
                  can move fast.
                </Typography>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="How an engagement typically runs"
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <PublicSurface>
            <Stepper
              activeStep={-1}
              orientation={isSmallScreen ? "vertical" : "horizontal"}
              alternativeLabel={!isSmallScreen}
            >
              <Step>
                <StepLabel
                  optional={
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      We review scope, contract mechanics and how claims flow.
                    </Typography>
                  }
                >
                  Diagnostic
                </StepLabel>
              </Step>

              <Step>
                <StepLabel
                  optional={
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      We validate data mapping, rules, and classifications.
                    </Typography>
                  }
                >
                  Validation
                </StepLabel>
              </Step>

              <Step>
                <StepLabel
                  optional={
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      You see exactly what will be submitted and why.
                    </Typography>
                  }
                >
                  Review
                </StepLabel>
              </Step>

              <Step>
                <StepLabel
                  optional={
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      You submit with confidence and an audit trail.
                    </Typography>
                  }
                >
                  Submission
                </StepLabel>
              </Step>
            </Stepper>

            <Typography
              variant="body2"
              sx={{ mt: 3, color: theme.palette.text.secondary }}
            >
              Construction entities often span multiple states and contract
              types. We keep the engagement practical: focus on the few
              structural levers that matter, document decisions, and avoid
              surprises at submission time.
            </Typography>
          </PublicSurface>
        </PublicPageSection>

        <PublicPageSection sx={{ pt: 0, pb: { xs: 4, md: 6 } }}>
          <PublicCallToAction
            align="left"
            title="Ready to de-risk your next submission?"
            description="If your organisation operates in progress claims, certifications and retentions, a small amount of alignment work can materially improve accuracy and defensibility."
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/contact"
            >
              Book a construction diagnostic
            </Button>

            <Typography
              variant="body2"
              sx={{ alignSelf: "center", color: theme.palette.text.secondary }}
            >
              If you prefer, start with the broader PTRS service and we’ll
              confirm whether a construction diagnostic is the right next step.
            </Typography>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
