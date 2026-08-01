import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import {
  PublicCallToAction,
  PublicCard,
  PublicPageHero,
  PublicPageSection,
} from "shared/ui";

export default function Services() {
  const theme = useTheme();
  const listTypographySx = {
    my: 0,
    pl: 3,
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    fontWeight:
      theme.typography.body2.fontWeight ?? theme.typography.fontWeightRegular,
    lineHeight: 1.7,
    "& li + li": { mt: 0.75 },
  };

  return (
    <>
      <PageMeta
        title="Services | Monochrome Compliance"
        description="Payment Times Reporting, payment data review, and compliance advisory services for organisations that need defensible reporting, clearer payment visibility, and stronger data foundations."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          title="Services"
          description="We help organisations bring structure to payment data so reporting, enforcement and transparency frameworks align rather than collide. These services are delivered horizontally across different operating environments, with industry-specific applications where payment mechanics are especially demanding."
          sx={{
            "&&": {
              paddingTop: { xs: theme.spacing(4), md: theme.spacing(5) },
              paddingBottom: {
                xs: theme.spacing(3),
                md: theme.spacing(4),
              },
            },
            "& > .MuiBox-root > .MuiBox-root > .MuiStack-root": {
              gap: { xs: theme.spacing(2.25), md: theme.spacing(2.5) },
            },
          }}
        />

        <PublicPageSection
          sx={{
            "&&": {
              paddingTop: 0,
              paddingBottom: {
                xs: theme.spacing(2),
                md: theme.spacing(3),
              },
            },
          }}
        >
          <PublicSurface>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography component="h2" variant="h6">
                  Looking for the industry view?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 1, color: theme.palette.text.secondary }}
                >
                  Our services are applied across different sectors. Where
                  payment mechanics vary materially by industry, we map the same
                  core service set into a more specific operating context.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/industries"
                sx={{ flexShrink: 0 }}
              >
                Explore industries
              </Button>
            </Stack>
          </PublicSurface>
        </PublicPageSection>

        <PublicPageSection
          title="Core services"
          sx={{
            "&&": {
              paddingTop: { xs: theme.spacing(3), md: theme.spacing(4) },
              paddingBottom: {
                xs: theme.spacing(3),
                md: theme.spacing(4),
              },
            },
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Reporting support"
                title="Payment Times Reporting"
                titleComponent="h3"
                titleVariant="h5"
                description="End-to-end preparation and submission support under the Payment Times Reporting framework. We focus on defensible methodology, small business identification integrity, and reconciliation across source systems."
                actions={
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/payment-times-reporting"
                  >
                    View service
                  </Button>
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Payment visibility"
                title="Payment Health Check"
                titleComponent="h3"
                titleVariant="h5"
                description="A structured review of your payment data architecture, timing logic, supplier classification and ABN integrity. Designed to surface structural misalignment before it becomes a public reporting issue."
                actions={
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/payment-health-check"
                  >
                    View health check
                  </Button>
                }
              />
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Construction-specific services"
          sx={{
            "&&": {
              paddingTop: { xs: theme.spacing(3), md: theme.spacing(4) },
              paddingBottom: {
                xs: theme.spacing(3),
                md: theme.spacing(4),
              },
            },
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Construction sector"
                title="Construction Payment Reporting"
                titleComponent="h3"
                titleVariant="h5"
                description="Construction payment environments are not the same as standard trade creditors. Progress claims, certification, retentions, end-of-month terms and state-based Security of Payment requirements can all be compliant and still produce weak PTRS outcomes when reporting logic does not match operating reality."
                actions={
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/construction-payment-reporting"
                  >
                    Learn about Construction PTRS
                  </Button>
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Construction sector"
                title="Construction Payment Diagnostic"
                titleComponent="h3"
                titleVariant="h5"
                description="A practical way to separate mechanics (how claims and invoices are processed) from behaviour (whether suppliers are actually being paid fairly) — and understand what your Payment Times Reporting metrics are really reflecting."
                actions={
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/construction-payment-diagnostic"
                  >
                    See an example diagnostic
                  </Button>
                }
              />
            </Grid>
          </Grid>
        </PublicPageSection>

        <Box id="data-review" sx={{ scrollMarginTop: theme.spacing(10) }}>
          <PublicPageSection
            title="Payment data review"
            introduction="If you’re responsible for Payment Times Reporting or supplier payment data and would like a second set of eyes on a sample dataset, we’re happy to review it and share what we see."
            sx={{
              "&&": {
                paddingTop: { xs: theme.spacing(3), md: theme.spacing(4) },
                paddingBottom: {
                  xs: theme.spacing(4),
                  md: theme.spacing(5),
                },
              },
            }}
            contentSx={{
              "& > .MuiStack-root": {
                gap: { xs: theme.spacing(2), md: theme.spacing(2.5) },
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                maxWidth: theme.layout.public.textWidth,
                color: theme.palette.text.secondary,
              }}
            >
              This is not a formal engagement. It’s a practical way to
              understand how your payment dataset behaves under reporting
              frameworks before deadlines arrive.
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="What we typically need"
                  titleComponent="h3"
                  titleVariant="h6"
                >
                  <Box
                    component="ul"
                    sx={listTypographySx}
                  >
                    <li>Supplier name</li>
                    <li>Invoice date</li>
                    <li>Payment date</li>
                    <li>Payment amount</li>
                    <li>ABN (if available)</li>
                  </Box>
                </PublicCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
                <PublicCard
                  title="What happens next"
                  titleComponent="h3"
                  titleVariant="h6"
                  actions={
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/contact"
                    >
                      Request a payment data review
                    </Button>
                  }
                >
                  <Box
                    component="ol"
                    sx={listTypographySx}
                  >
                    <li>
                      We confirm scope and the extract format (usually 10
                      minutes).
                    </li>
                    <li>
                      We review the sample and flag any structural timing or
                      classification issues.
                    </li>
                    <li>
                      We return a short summary of observations and suggested
                      next steps.
                    </li>
                  </Box>
                </PublicCard>
              </Grid>
            </Grid>
          </PublicPageSection>
        </Box>

        <PublicPageSection
          sx={{
            "&&": {
              paddingTop: 0,
              paddingBottom: {
                xs: theme.spacing(4),
                md: theme.spacing(6),
              },
            },
          }}
        >
          <PublicCallToAction
            align="left"
            title="How engagements work"
            description={
              <>
                Most work begins with a short scoping conversation and a review
                of your source data and system context. From there, we define a
                clear scope, deliverables and evidence trail.
                <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                  We keep engagements practical and bounded. Where it makes
                  sense, we can sequence work in stages so you can build
                  confidence and internal alignment before committing to broader
                  changes.
                </Box>
              </>
            }
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Button variant="outlined" component={RouterLink} to="/contact">
              Get in touch
            </Button>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
