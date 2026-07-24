import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router";
import { Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function ConstructionPaymentReporting() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const contentMaxWidth = 980;
  const sectionSx = { maxWidth: contentMaxWidth, mx: "auto" };

  return (
    <>
      <PageMeta
        title="Construction Payment Times Reporting"
        description="Construction PTRS for progress-claim environments..."
        image="https://monochrome-compliance.com/images/og/og-construction.jpg"
        url="https://monochrome-compliance.com/industries/construction/payment-reporting"
      />

      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Hero */}
        <Box sx={sectionSx}>
          <Typography
            variant="h3"
            color={theme.palette.text.primary}
            sx={{ fontWeight: 700, mb: theme.spacing(1) }}
          >
            Construction PTRS, without the confusion
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ mb: theme.spacing(3), lineHeight: 1.5 }}
          >
            Construction payment environments are not the same as standard trade
            creditors. Progress claims, certification, retentions, end-of-month
            terms and state-based Security of Payment requirements can all be
            compliant and still produce weak PTRS outcomes when reporting logic
            does not match operating reality.
          </Typography>

          <Box
            sx={{
              mb: theme.spacing(3),
              p: theme.spacing(2),
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ fontWeight: 500 }}
              >
                Want a deeper breakdown of how construction mechanics affect
                reported outcomes?
              </Typography>
            </Box>

            <Button
              component={RouterLink}
              to="/services/payment-times-reporting"
              variant="outlined"
              color="primary"
              size="small"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Explore the broader PTRS service
            </Button>
            <Button
              component={RouterLink}
              to="/insights"
              variant="text"
              color="primary"
              size="small"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Read related insights
            </Button>
          </Box>

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
              onClick={() => navigate("/contact")}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Book a construction diagnostic
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() =>
                navigate("/industries/construction/payment-diagnostic")
              }
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              See an example diagnostic
            </Button>

            <Typography variant="body2" color={theme.palette.text.secondary}>
              A short working session to confirm scope, identify distortion
              risk, and connect the issue back to your broader PTRS approach.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* Why construction is different */}
        <Box sx={sectionSx}>
          <Typography
            variant="h5"
            color={theme.palette.text.primary}
            sx={{ fontWeight: 700, mb: theme.spacing(1) }}
          >
            Why construction reporting looks worse than it feels
          </Typography>

          <Typography variant="body1" color={theme.palette.text.secondary}>
            Many construction organisations operate with SOPA-driven workflows.
            That often creates a mismatch between how payments are managed and
            how PTRS measures time.
          </Typography>

          <Grid container spacing={2} sx={{ mt: theme.spacing(2) }}>
            <Grid size={{ xs: 12, md: 6 }}>
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
                    variant="h6"
                    color={theme.palette.text.primary}
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    The Dual Clock Problem
                  </Typography>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Security of Payment obligations operate on statutory timing
                    after a valid claim. PTRS reports elapsed calendar days from
                    invoice date to payment date. In progress-claim
                    environments, those clocks can diverge.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
                    variant="h6"
                    color={theme.palette.text.primary}
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    Structural drivers that distort outcomes
                  </Typography>

                  <Box
                    component="ul"
                    sx={{ pl: theme.spacing(3), mb: 0, mt: 1 }}
                  >
                    <Box component="li" sx={{ mb: 0.75 }}>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        30 days end-of-month terms (30 becomes 60+ calendar
                        days)
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 0.75 }}>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        Certification and assessment cycles before payment
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 0.75 }}>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        Retentions and milestone releases skew medians
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 0 }}>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        Weekly payment runs and cut-offs add artificial lag
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* What we do */}
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
                What we do for construction
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                We help construction reporting entities submit PTRS accurately
                and defensibly, with a focus on progress-claim environments and
                SOPA-driven timing.
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
                    Validate term declarations against what contracts and
                    workflows actually do
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Confirm the correct date fields (invoice vs claim vs
                    certification) are driving calculations
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Review classification and exclusions (retentions, cards,
                    intercompany noise)
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Produce a review-ready submission with a clear audit trail
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ mt: theme.spacing(2) }}
              >
                We do not alter invoice dates or payment dates. We ensure the
                submission accurately reflects the organisation’s contractual
                and statutory framework.
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
                The construction diagnostic
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                A short working session to confirm whether your reporting
                approach is likely to suppress outcomes or create avoidable
                commentary.
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
                    Identify the top 2–3 structural drivers affecting your
                    metrics
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Confirm the minimum changes needed to improve accuracy and
                    defensibility
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0 }}>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                  >
                    Outline the quickest path to a clean draft submission
                  </Typography>
                </Box>
              </Box>

              <Box
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
                  onClick={() =>
                    navigate("/industries/construction/payment-diagnostic")
                  }
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  See an example diagnostic
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => navigate("/contact")}
                  sx={{ width: isSmallScreen ? "100%" : "auto" }}
                >
                  Get started
                </Button>
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  If you already have your reporting period dataset prepared, we
                  can move fast.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* How the engagement works */}
        <Box sx={sectionSx}>
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
                How an engagement typically runs
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
                        color={theme.palette.text.secondary}
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
                        color={theme.palette.text.secondary}
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
                        color={theme.palette.text.secondary}
                      >
                        You submit with confidence and an audit trail.
                      </Typography>
                    }
                  >
                    Submission
                  </StepLabel>
                </Step>
              </Stepper>

              <Divider sx={{ my: theme.spacing(3) }} />

              <Typography variant="body2" color={theme.palette.text.secondary}>
                Construction entities often span multiple states and contract
                types. We keep the engagement practical: focus on the few
                structural levers that matter, document decisions, and avoid
                surprises at submission time.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: theme.spacing(5) }} />

        {/* CTA */}
        <Box sx={sectionSx}>
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
                Ready to de-risk your next submission?
              </Typography>

              <Typography variant="body1" color={theme.palette.text.secondary}>
                If your organisation operates in progress claims, certifications
                and retentions, a small amount of alignment work can materially
                improve accuracy and defensibility.
              </Typography>

              <Box
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
                  Book a construction diagnostic
                </Button>

                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  If you prefer, start with the broader PTRS service and we’ll
                  confirm whether a construction diagnostic is the right next
                  step.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
}
