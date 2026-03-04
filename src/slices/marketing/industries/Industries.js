import { Box, Typography, Divider, Button, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function Industries() {
  const theme = useTheme();
  const contentMaxWidth = 1000;

  return (
    <>
      <PageMeta
        title="Industries | Monochrome Compliance"
        description="Industry-focused payment reporting and data advisory support, beginning with the construction sector."
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
            Industries
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.6, mb: theme.spacing(3) }}
          >
            We focus on sectors where payment mechanics are structurally complex
            and external scrutiny is increasing.
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.7, mb: theme.spacing(4) }}
          >
            Our approach is systems-led. We start from the payment dataset and
            work outward into the reporting, contractual and tax frameworks that
            depend on it. That keeps the work grounded, defensible and
            repeatable.
          </Typography>

          <Divider sx={{ mb: theme.spacing(4) }} />

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Box
                  component="img"
                  src="/images/industries/construction.jpg"
                  alt="Construction payment reporting environment"
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Construction
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  Construction payment environments involve progress claims,
                  certification workflows, retention timing and decentralised
                  project structures. These mechanics create perfectly normal
                  operational complexity.
                </Typography>

                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  The challenge is that external frameworks often compress that
                  complexity into simplified timing assumptions. When reporting
                  methodology does not reflect operational mechanics, published
                  outcomes can appear inconsistent with day-to-day reality.
                </Typography>

                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  Our focus is on aligning operational payment structures with
                  payment data architecture so compliance, enforcement and
                  public perception remain coherent.
                </Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/construction-payment-reporting"
                >
                  Explore construction focus
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: theme.spacing(6) }} />

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Why construction first
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
          >
            We are building depth where the need is most obvious and the data
            patterns are most demanding. Construction combines decentralised
            delivery models, high subcontractor reliance and increasing
            transparency expectations.
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
          >
            As our industry library grows, we will expand this work into other
            sectors with similar payment complexity and reporting exposure.
          </Typography>

          <Button variant="outlined" component={Link} to="/contact">
            Discuss your context
          </Button>
        </Box>
      </Box>
    </>
  );
}
