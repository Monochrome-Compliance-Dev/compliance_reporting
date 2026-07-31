import {
  Box,
  Button,
  GlobalStyles,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAuthContext } from "context";
import { Link as RouterLink } from "react-router";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicCallToAction, PublicCard, PublicPageSection } from "shared/ui";

export default function PaymentTimesReporting() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  // Public-facing preview images (store these in /public so they can be swapped easily)
  // e.g. /public/images/ptrs-dashboard-light.png and /public/images/ptrs-dashboard-dark.png
  const dashboardPreview = {
    light: "/images/products/ptrs-dashboard-light.png",
    dark: "/images/products/ptrs-dashboard-dark.png",
  };

  const isDark = theme.palette.mode === "dark";
  const { user } = useAuthContext();

  return (
    <>
      <GlobalStyles
        styles={{
          "@page": {
            size: "A4",
            // Extra bottom margin for the print footer
            margin: "16mm 16mm 14mm 16mm",
          },
          "@media print": {
            "html, body": {
              background: "#fff",
              margin: 0,
              padding: 0,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            },
            // removed: body: { counterReset: "page 0", },

            /* Hide global chrome (app header/nav/drawer/footer) */
            "header, nav, footer": {
              display: "none !important",
            },
            ".MuiAppBar-root, .MuiToolbar-root": {
              display: "none !important",
            },
            ".MuiDrawer-root, .MuiBackdrop-root": {
              display: "none !important",
            },

            /* Hide dev tooling overlays/widgets in print */
            "#react-devtools, #react-devtools-root, #react-devtools-container":
              {
                display: "none !important",
              },
            ".react-devtools, .ReactQueryDevtools, .react-query-devtools": {
              display: "none !important",
            },
            /* Hide TanStack Query Devtools (various classnames across versions) */
            ".tsqd-open-btn, .tsqd-parent-container, .tsqd-panel": {
              display: "none !important",
            },
            "[class*='tsqd-']": {
              display: "none !important",
            },
            "[data-testid='react-query-devtools']": {
              display: "none !important",
            },
            "iframe[src*='react-devtools'], iframe[src*='devtools']": {
              display: "none !important",
            },

            /* Hide any explicit no-print areas */
            ".no-print": {
              display: "none !important",
            },

            /* Print-only blocks */
            ".print-only": {
              display: "block !important",
            },
            ".screen-only": {
              display: "none !important",
            },

            /* Fixed footer for printed/PDF output */
            ".ptrs-print-footer": {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "2mm 0",
              borderTop: "1px solid #ddd",
              fontSize: "9px",
              lineHeight: 1.2,
              color: "#444 !important",
              background: "#fff",
            },
            ".ptrs-print-footer__row": {
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "6mm",
            },
            ".ptrs-print-footer__left": {
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "4mm",
            },
            ".ptrs-print-footer__sep": {
              color: "#999 !important",
            },
            // removed: ".ptrs-print-footer__page::after": { content: ... },

            /* Ensure dashboard screenshot uses the light variant in print */
            ".ptrs-dashboard-shot--dark": {
              display: "none !important",
            },
            ".ptrs-dashboard-shot--light": {
              display: "block !important",
            },

            /* Make the one-pager fill the printable area (no centering offsets) */
            "#ptrs-onepager": {
              padding: 0,
              margin: 0,
              maxWidth: "none",
              width: "100%",
              background: "#fff",
            },
            "#ptrs-onepager > *": {
              marginLeft: 0,
              marginRight: 0,
              maxWidth: "none",
            },

            /* Remove shadows and interactive UI in print */
            "#ptrs-onepager .MuiCard-root": {
              backgroundColor: "#fff !important",
              borderColor: "#ddd !important",
              boxShadow: "none !important",
              breakInside: "avoid",
            },
            "#ptrs-onepager .MuiButton-root": {
              display: "none !important",
            },

            /* Avoid weird first-page offsets from transforms/positioning */
            "#root, #__next": {
              transform: "none !important",
            },

            /* Page-break behaviour */
            "#ptrs-onepager .MuiDivider-root": {
              breakAfter: "avoid",
            },

            /* Force light-mode colours in print (dark theme otherwise prints washed out) */
            "#ptrs-onepager, #ptrs-onepager *": {
              color: "#000 !important",
            },
            "#ptrs-onepager .MuiTypography-root": {
              color: "#000 !important",
            },
          },
        }}
      />
      <PageMeta
        title="Payment Times Reporting"
        description="PTRS reporting, without the scramble. Monochrome Compliance helps enterprises meet Payment Times Reporting obligations with less effort and stronger audit confidence."
      />

      <Box id="ptrs-onepager">
        <PublicPageLayout
          sx={{
            backgroundColor: theme.palette.background.default,
          }}
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
                    Payment Times Reporting
                  </Typography>

                  <Typography
                    component="h1"
                    variant="h3"
                    sx={{ fontWeight: 700 }}
                  >
                    PTRS reporting, without the scramble
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      lineHeight: 1.55,
                    }}
                  >
                    Monochrome Compliance helps enterprises meet their Payment
                    Times Reporting obligations accurately and confidently —
                    with far less effort than traditional approaches. Payment
                    Times Reports are mandatory, run every six months, and are
                    often prepared under time pressure using fragile
                    spreadsheets and manual checks.
                  </Typography>

                  <Stack
                    className="no-print"
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ width: { xs: "100%", sm: "auto" }, pt: 1 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      component={RouterLink}
                      to="/contact"
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Book a quick call
                    </Button>

                    {user?.role === "boss" && (
                      <Button
                        variant="outlined"
                        size="large"
                        component={RouterLink}
                        to="/payment-times-reporting-print"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        Open print version
                      </Button>
                    )}
                  </Stack>
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
                    src="/images/services/payment-times-reporting.jpg"
                    alt="Payment reporting analysis workspace"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "left center",
                      transform: "scale(1.15)",
                      transformOrigin: "left center",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </PublicPageSection>

          <PublicPageSection sx={{ py: { xs: 4, md: 6 } }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="Structured reporting support"
                  titleComponent="h2"
                  titleVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    Most organisations still prepare PTRS reports using
                    spreadsheets, manual checks, and last-minute rule
                    interpretation. We replace that with a structured,
                    repeatable process that reduces risk and surprises.
                  </Typography>

                  <Box
                    component="ul"
                    sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                  >
                    <li>
                      Validate your payment data against PTRS requirements
                    </li>
                    <li>Apply the relevant rules and interpretations</li>
                    <li>Identify issues early, not at submission time</li>
                    <li>Produce a clear, review-ready PTRS report</li>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    You stay informed and in control, without having to manage
                    the mechanics yourself.
                  </Typography>
                </PublicCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="The dashboard"
                  titleComponent="h2"
                  titleVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    The dashboard exists to answer one question clearly: “Are we
                    ready to sign this report, and why?”
                  </Typography>

                  <Box
                    component="ul"
                    sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                  >
                    <li>Reporting status and progress at a glance</li>
                    <li>Key drivers that affect PTRS outcomes</li>
                    <li>
                      Practical “what-if” views to show the smallest levers that
                      move results
                    </li>
                    <li>A clear audit trail of what was checked and why</li>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    It’s built to support confident review and sign-off —
                    without drowning you in detail.
                  </Typography>
                </PublicCard>
              </Grid>
            </Grid>
          </PublicPageSection>

          <PublicPageSection
            title="Why this matters"
            introduction="PTRS reporting is mandatory, recurring, and easy to get wrong — often because small timing or classification details are buried in the data."
            sx={{
              paddingTop: { xs: 4, md: 6 },
              paddingBottom: { xs: 3, md: 4 },
            }}
          >
            <PublicCard component="div">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                What looks like an operational detail can materially change what
                gets reported. A simple timing change can shift reported
                performance.
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
              >
                In one engagement, we identified that paying invoices just six
                days earlier would shift small business invoices paid on time
                from:
              </Typography>

              <Grid container spacing={2} sx={{ py: 1 }}>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                  <PublicCard
                    component="div"
                    title="40%"
                    titleComponent="p"
                    titleVariant="h4"
                    description="Current position"
                    sx={{ backgroundColor: theme.palette.background.default }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                  <PublicCard
                    component="div"
                    title="72%"
                    titleComponent="p"
                    titleVariant="h4"
                    description="If paid 6 days earlier"
                    sx={{ backgroundColor: theme.palette.background.default }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                  <PublicCard
                    component="div"
                    title="86%"
                    titleComponent="p"
                    titleVariant="h4"
                    description="If paid within average days late"
                    sx={{ backgroundColor: theme.palette.background.default }}
                  />
                </Grid>
              </Grid>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}
              >
                No system changes. No supplier renegotiation. Just visibility
                into what’s driving the reported outcome.
              </Typography>
            </PublicCard>
          </PublicPageSection>

          <PublicPageSection
            sx={{
              py: 0,
              pb: { xs: 4, md: 6 },
            }}
          >
            <PublicCard
              component="div"
              media={
                <Box
                  sx={{
                    overflow: "hidden",
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  <Box
                    component="img"
                    className="ptrs-dashboard-shot--dark"
                    alt="PTRS dashboard preview (dark)"
                    src={dashboardPreview.dark}
                    sx={{
                      display: isDark ? "block" : "none",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                  <Box
                    component="img"
                    className="ptrs-dashboard-shot--light"
                    alt="PTRS dashboard preview (light)"
                    src={dashboardPreview.light}
                    sx={{
                      display: isDark ? "none" : "block",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </Box>
              }
            >
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Dashboard shown with synthetic data for illustrative purposes.
              </Typography>
            </PublicCard>
          </PublicPageSection>

          <PublicPageSection
            title="How the engagement works"
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
                        color={theme.palette.text.secondary}
                      >
                        A short working session to understand your data and
                        context.
                      </Typography>
                    }
                  >
                    We review your data together
                  </StepLabel>
                </Step>

                <Step>
                  <StepLabel
                    optional={
                      <Typography
                        variant="caption"
                        color={theme.palette.text.secondary}
                      >
                        We validate, apply rules, and prepare a complete draft
                        report.
                      </Typography>
                    }
                  >
                    We prepare your draft PTRS report
                  </StepLabel>
                </Step>

                <Step>
                  <StepLabel
                    optional={
                      <Typography
                        variant="caption"
                        color={theme.palette.text.secondary}
                      >
                        You see what will be submitted and what’s driving the
                        results.
                      </Typography>
                    }
                  >
                    We review the draft with you
                  </StepLabel>
                </Step>

                <Step>
                  <StepLabel
                    optional={
                      <Typography
                        variant="caption"
                        color={theme.palette.text.secondary}
                      >
                        You submit knowing it’s accurate, defensible, and
                        supported.
                      </Typography>
                    }
                  >
                    You submit with confidence
                  </StepLabel>
                </Step>
              </Stepper>
            </PublicSurface>
          </PublicPageSection>

          <PublicPageSection
            sx={{
              paddingTop: { xs: 4, md: 6 },
              paddingBottom: { xs: 3, md: 4 },
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="What it’s like to work with us"
                  titleComponent="h2"
                  titleVariant="h5"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    We take the time up front to understand your data properly.
                    That initial effort means PTRS reporting becomes predictable
                    and repeatable — not a fire drill every six months.
                  </Typography>

                  <Box
                    component="ul"
                    sx={{ my: 1, pl: 3, color: theme.palette.text.secondary }}
                  >
                    <li>Easy to deal with and clear in communication</li>
                    <li>Careful rather than rushed — we ask before assuming</li>
                    <li>
                      Accountable for the work and the decisions behind it
                    </li>
                  </Box>
                </PublicCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="Our approach"
                  titleComponent="h2"
                  titleVariant="h5"
                  contentSx={{ justifyContent: "center" }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    Our work is software-led, with human judgement where it
                    matters. Automation removes repetition and reduces error.
                    Human review ensures context, interpretation, and
                    defensibility.
                  </Typography>
                </PublicCard>
              </Grid>
            </Grid>
          </PublicPageSection>

          <PublicPageSection
            sx={{
              py: 0,
              pb: { xs: 4, md: 6 },
            }}
          >
            <PublicCallToAction
              component="div"
              eyebrow="Pricing"
              title="$7,500 per submission"
              description="PTRS reporting is priced at $7,500 per submission. Clear scope. No surprises."
              sx={{ py: { xs: 3, md: 4 } }}
            >
              <Button
                className="no-print"
                variant="contained"
                color="primary"
                size="large"
                component={RouterLink}
                to="/contact"
              >
                Talk to us
              </Button>

              <Typography
                variant="body2"
                sx={{
                  alignSelf: "center",
                  color: theme.palette.text.secondary,
                }}
              >
                A short conversation is usually enough to confirm whether we’re
                a good fit.
              </Typography>
            </PublicCallToAction>
          </PublicPageSection>

          <Box
            className="ptrs-print-footer print-only"
            sx={{ display: "none" }}
          >
            <Box className="ptrs-print-footer__row">
              <Box className="ptrs-print-footer__left">
                <span>{new Date().getFullYear()} Monochrome Compliance</span>
                <span className="ptrs-print-footer__sep">•</span>
                <span>PTRS Marketing v1.0</span>
                <span className="ptrs-print-footer__sep">•</span>
                <span>Printed: {new Date().toLocaleDateString("en-AU")}</span>
                <span className="ptrs-print-footer__sep">•</span>
                <span>ABN 20687127386</span>
                <span className="ptrs-print-footer__sep">•</span>
                <span>contact@monochrome-compliance.com</span>
              </Box>
            </Box>
          </Box>
        </PublicPageLayout>
      </Box>
    </>
  );
}
