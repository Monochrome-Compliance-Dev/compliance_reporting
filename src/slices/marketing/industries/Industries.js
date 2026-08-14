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

export default function Industries() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Industries | Monochrome Compliance"
        description="Industry-focused payment data and compliance support for sectors with complex payment mechanics, beginning with construction."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Industry applications"
          title="Industries"
          description="We focus on sectors where payment mechanics are structurally complex and external scrutiny is increasing. These industry pages are the vertical application of our core payment data, reporting, and compliance services."
        />

        <PublicPageSection sx={{ pt: 0, pb: { xs: 4, md: 5 } }}>
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <Typography
              variant="body1"
              sx={{
                maxWidth: theme.layout.public.textWidth,
                color: theme.palette.text.secondary,
                lineHeight: 1.7,
              }}
            >
              Our approach is systems-led. We start from the payment dataset and
              work outward into the reporting, contractual and tax frameworks
              that depend on it. That keeps the work grounded, defensible and
              repeatable.
            </Typography>

            <PublicSurface>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography component="h2" variant="h5">
                    Start with the core services
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mt: 1, color: theme.palette.text.secondary }}
                  >
                    If you want the broader service view first, explore the core
                    service set and then come back to the industry context that
                    best matches your environment.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/services"
                  sx={{ flexShrink: 0 }}
                >
                  Explore services
                </Button>
              </Stack>
            </PublicSurface>
          </Stack>
        </PublicPageSection>

        <PublicPageSection
          eyebrow="Current industry focus"
          title="Construction"
          introduction="Construction payment environments involve progress claims, certification workflows, retention timing and decentralised project structures. These mechanics create perfectly normal operational complexity."
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Grid container>
            <Grid size={{ xs: 12 }} sx={{ display: "flex" }}>
              <PublicCard
                image="/images/industries/construction.jpg"
                imageAlt="Construction payment reporting environment"
                title="Construction payment reporting"
                titleComponent="h3"
                titleVariant="h5"
                imageSx={{
                  aspectRatio: { xs: "16 / 8", md: "21 / 7" },
                  objectPosition: "center",
                }}
                actions={
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/construction-payment-reporting"
                  >
                    Explore construction focus
                  </Button>
                }
              >
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    The challenge is that external frameworks often compress
                    that complexity into simplified timing assumptions. When
                    reporting methodology does not reflect operational
                    mechanics, published outcomes can appear inconsistent with
                    day-to-day reality.
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    Our focus is on aligning operational payment structures with
                    payment data architecture so compliance, enforcement and
                    public perception remain coherent.
                  </Typography>
                </Stack>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 6 } }}
        >
          <PublicCallToAction
            align="left"
            title="Why construction first"
            description={
              <>
                We are building depth where the need is most obvious and the
                data patterns are most demanding. Construction combines
                decentralised delivery models, high subcontractor reliance and
                increasing transparency expectations.
                <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                  As our industry library grows, we will expand this work into
                  other sectors with similar payment complexity and reporting
                  exposure.
                </Box>
              </>
            }
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Button variant="outlined" component={RouterLink} to="/contact">
              Discuss your context
            </Button>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
