import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  GlobalStyles,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAuthContext } from "context";
import { useNavigate } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function PaymentTimesReporting() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const contentMaxWidth = 980;
  const sectionSx = { maxWidth: contentMaxWidth, mx: "auto" };
  // Public-facing preview images (store these in /public so they can be swapped easily)
  // e.g. /public/images/ptrs-dashboard-light.png and /public/images/ptrs-dashboard-dark.png
  const dashboardPreview = {
    light: "/images/solutions/ptrs/ptrs-dashboard-light.png",
    dark: "/images/solutions/ptrs/ptrs-dashboard-dark.png",
  };

  const isDark = theme.palette.mode === "dark";
  const { user } = useAuthContext();

  const handlePrint = () => {
    window.open(
      "/payment-times-reporting/print",
      "_blank",
      "noopener,noreferrer",
    );
  };

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

      <Box
        id="ptrs-onepager"
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Print-only header removed */}
        {/* Hero */}
        <Box sx={sectionSx}>
          <Typography
            variant="h3"
            color={theme.palette.text.primary}
            sx={{ fontWeight: 700, mb: theme.spacing(1) }}
          >
            PTRS reporting, without the scramble
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ mb: theme.spacing(3), lineHeight: 1.5 }}
          >
            Monochrome Compliance helps enterprises meet their Payment Times
            Reporting obligations accurately and confidently — with far less
            effort than traditional approaches. Payment Times Reports are
            mandatory, run every six months, and are often prepared under time
            pressure using fragile spreadsheets and manual checks.
          </Typography>

          <Box
            className="no-print"
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
              onClick={() => navigate("/contact")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Book a quick call
            </Button>
            {/* <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate("/compliance-navigator")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Check if you need to report
            </Button> */}
            {user?.role === "boss" && (
              <Button
                variant="text"
                color="primary"
                size="large"
                onClick={handlePrint}
                sx={{ width: isSmallScreen ? "100%" : "auto" }}
              >
                Open print version
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* What we do + dashboard */}
        <Box
          sx={{
            ...sectionSx,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: theme.spacing(3),
          }}
        >
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                What we do
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                Most organisations still prepare PTRS reports using
                spreadsheets, manual checks, and last-minute rule
                interpretation. We replace that with a structured, repeatable
                process that reduces risk and surprises.
              </Typography>

              <Box
                component="ul"
                sx={{ mt: theme.spacing(2), pl: theme.spacing(3), mb: 0 }}
              >
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Validate your payment data against PTRS requirements
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Apply the relevant rules and interpretations
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Identify issues early, not at submission time
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Produce a clear, review-ready PTRS report
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ mt: theme.spacing(2) }}
              >
                You stay informed and in control, without having to manage the
                mechanics yourself.
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                The dashboard
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                The dashboard exists to answer one question clearly: “Are we
                ready to sign this report, and why?”
              </Typography>

              <Box
                component="ul"
                sx={{ mt: theme.spacing(2), pl: theme.spacing(3), mb: 0 }}
              >
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Reporting status and progress at a glance
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Key drivers that affect PTRS outcomes
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Practical “what-if” views to show the smallest levers that
                    move results
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    A clear audit trail of what was checked and why
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ mt: theme.spacing(2) }}
              >
                It’s built to support confident review and sign-off — without
                drowning you in detail.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* Proof early */}
        <Box sx={{ ...sectionSx, mb: theme.spacing(5) }}>
          <Typography
            variant="h5"
            color={theme.palette.text.primary}
            sx={{ fontWeight: 700, mb: theme.spacing(1) }}
          >
            Why this matters
          </Typography>

          <Typography variant="body1" color={theme.palette.text.secondary}>
            PTRS reporting is mandatory, recurring, and easy to get wrong —
            often because small timing or classification details are buried in
            the data.
          </Typography>

          <Card
            elevation={0}
            sx={{
              mt: theme.spacing(3),
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                What looks like an operational detail can materially change what
                gets reported. A simple timing change can shift reported
                performance.
              </Typography>

              <Typography variant="body2" color={theme.palette.text.secondary}>
                In one engagement, we identified that paying invoices just six
                days earlier would shift small business invoices paid on time
                from:
              </Typography>

              <Box sx={{ mt: theme.spacing(2) }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, mb: 0.5 }}
                          color={theme.palette.text.primary}
                        >
                          40%
                        </Typography>
                        <Typography
                          variant="body2"
                          color={theme.palette.text.secondary}
                        >
                          Current position
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, mb: 0.5 }}
                          color={theme.palette.text.primary}
                        >
                          72%
                        </Typography>
                        <Typography
                          variant="body2"
                          color={theme.palette.text.secondary}
                        >
                          If paid 6 days earlier
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, mb: 0.5 }}
                          color={theme.palette.text.primary}
                        >
                          86%
                        </Typography>
                        <Typography
                          variant="body2"
                          color={theme.palette.text.secondary}
                        >
                          If paid within average days late
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ mt: theme.spacing(2) }}
              >
                No system changes. No supplier renegotiation. Just visibility
                into what’s driving the reported outcome.
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              mt: theme.spacing(4),
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ mt: theme.spacing(1.5) }}
              >
                Dashboard shown with synthetic data for illustrative purposes.
              </Typography>

              <Box
                sx={{
                  mt: theme.spacing(1.5),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: theme.palette.background.default,
                }}
              >
                {/* Render both so print can force the light variant via CSS */}
                <Box
                  component="img"
                  className="ptrs-dashboard-shot--dark"
                  alt="PTRS dashboard preview (dark)"
                  src={dashboardPreview.dark}
                  sx={{
                    display: isDark ? "block" : "none",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
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
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* How the engagement works */}
        <Box sx={{ ...sectionSx, mt: theme.spacing(5) }}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(2) }}
              >
                How the engagement works
              </Typography>

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
            </CardContent>
          </Card>
        </Box>

        {/* What it's like + approach + pricing */}
        <Box sx={{ ...sectionSx, mt: theme.spacing(5) }}>
          <Card
            elevation={0}
            sx={{
              mt: theme.spacing(3),
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                What it’s like to work with us
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                We take the time up front to understand your data properly. That
                initial effort means PTRS reporting becomes predictable and
                repeatable — not a fire drill every six months.
              </Typography>

              <Box
                component="ul"
                sx={{ mt: theme.spacing(2), pl: theme.spacing(3), mb: 0 }}
              >
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Easy to deal with and clear in communication
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Careful rather than rushed — we ask before assuming
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Accountable for the work and the decisions behind it
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: theme.spacing(3) }} />

              <Typography
                variant="h6"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                Our approach
              </Typography>

              <Typography variant="body2" color={theme.palette.text.secondary}>
                Our work is software-led, with human judgement where it matters.
                Automation removes repetition and reduces error. Human review
                ensures context, interpretation, and defensibility.
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                color={theme.palette.text.primary}
                sx={{ fontWeight: 700, mb: theme.spacing(1) }}
              >
                Pricing
              </Typography>

              <Typography variant="body2" color={theme.palette.text.secondary}>
                PTRS reporting is priced at <strong>$7,000</strong> per report,
                per reporting period. Clear scope. No surprises.
              </Typography>

              <Box
                className="no-print"
                sx={{
                  mt: theme.spacing(3),
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
                  onClick={() => navigate("/contact")}
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  Talk to us
                </Button>
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  A short conversation is usually enough to confirm whether
                  we’re a good fit.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* Print-only footer */}
        <Box className="ptrs-print-footer print-only" sx={{ display: "none" }}>
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
            {/* Removed: <Box className="ptrs-print-footer__page" /> */}
          </Box>
        </Box>
      </Box>
    </>
  );
}
