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
        description="Structured payment reporting and advisory services focused on defensible data, regulatory alignment, and operational clarity."
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
          </Typography>

          <Divider sx={{ mb: theme.spacing(4) }} />

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Box
                  component="img"
                  src="/images/services/payment-times-reporting.jpg"
                  alt="Payment reporting data architecture"
                  sx={{
                    width: "100%",
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
                  to="/payment-times-reporting"
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
                  to="/construction-payment-diagnostic"
                >
                  View health check
                </Button>
              </Box>
            </Grid>
          </Grid>

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
