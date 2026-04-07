import { Box, Typography, Divider, Button, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function Services() {
  const theme = useTheme();
  const contentMaxWidth = 1000;

  return (
    <>
      <PageMeta
        title="Services | Monochrome Compliance"
        description="Payment Times Reporting, payment data review, and compliance advisory services for organisations that need defensible reporting, clearer payment visibility, and stronger data foundations."
        image="/images/og/og-industry-insights.jpg"
      />

      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Services
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.6, mb: theme.spacing(4) }}
          >
            We help organisations bring structure to payment data so reporting,
            enforcement and transparency frameworks align rather than collide.
            These services are delivered horizontally across different operating
            environments, with industry-specific applications where payment
            mechanics are especially demanding.
          </Typography>

          <Divider sx={{ mb: theme.spacing(4) }} />

          <Box
            sx={{
              mb: theme.spacing(4),
              p: theme.spacing(2.5),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Looking for the industry view?
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
            >
              Our services are applied across different sectors. Where payment
              mechanics vary materially by industry, we map the same core
              service set into a more specific operating context.
            </Typography>
            <Button variant="outlined" component={Link} to="/industries">
              Explore industries
            </Button>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Box
                  component="img"
                  src="/images/services/payment-times-reporting.jpg"
                  alt="Payment reporting data architecture"
                  sx={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Payment Times Reporting
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  End-to-end preparation and submission support under the
                  Payment Times Reporting framework. We focus on defensible
                  methodology, small business identification integrity, and
                  reconciliation across source systems.
                </Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/services/payment-times-reporting"
                >
                  View service
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Box
                  component="img"
                  src="/images/services/payment-health-check.jpg"
                  alt="Payment data diagnostic review"
                  sx={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Payment Health Check
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  A structured review of your payment data architecture, timing
                  logic, supplier classification and ABN integrity. Designed to
                  surface structural misalignment before it becomes a public
                  reporting issue.
                </Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/services/payment-health-check"
                >
                  View health check
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: theme.spacing(6) }} />

          <Box id="data-review">
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Payment data review
            </Typography>

            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
            >
              If you’re responsible for Payment Times Reporting or supplier
              payment data and would like a second set of eyes on a sample
              dataset, we’re happy to review it and share what we see.
            </Typography>

            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.7, mb: theme.spacing(3) }}
            >
              This is not a formal engagement. It’s a practical way to
              understand how your payment dataset behaves under reporting
              frameworks before deadlines arrive.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              What we typically need
            </Typography>

            <Box
              component="ul"
              sx={{
                mt: 0,
                mb: theme.spacing(3),
                pl: theme.spacing(3),
                color: theme.palette.text.secondary,
                lineHeight: 1.7,
              }}
            >
              <li>Supplier name</li>
              <li>Invoice date</li>
              <li>Payment date</li>
              <li>Payment amount</li>
              <li>ABN (if available)</li>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              What happens next
            </Typography>

            <Box
              component="ol"
              sx={{
                mt: 0,
                mb: theme.spacing(3),
                pl: theme.spacing(3),
                color: theme.palette.text.secondary,
                lineHeight: 1.7,
              }}
            >
              <li>
                We confirm scope and the extract format (usually 10 minutes).
              </li>
              <li>
                We review the sample and flag any structural timing or
                classification issues.
              </li>
              <li>
                We return a short summary of observations and suggested next
                steps.
              </li>
            </Box>

            <Button variant="contained" component={Link} to="/contact">
              Request a payment data review
            </Button>
          </Box>

          <Divider sx={{ my: theme.spacing(6) }} />

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            How engagements work
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
          >
            Most work begins with a short scoping conversation and a review of
            your source data and system context. From there, we define a clear
            scope, deliverables and evidence trail.
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
          >
            We keep engagements practical and bounded. Where it makes sense, we
            can sequence work in stages so you can build confidence and internal
            alignment before committing to broader changes.
          </Typography>

          <Button variant="outlined" component={Link} to="/contact">
            Get in touch
          </Button>
        </Box>
      </Box>
    </>
  );
}
