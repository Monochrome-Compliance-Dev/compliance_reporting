import { Box, Button, Divider, Grid, Stack, Typography } from "@mui/material";
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

const pricingOptions = [
  {
    title: "Payment Times Reporting",
    price: "$7,500",
    cadence: "per submission",
    description:
      "End-to-end support to prepare an accurate, defensible Payment Times Report without turning the submission into a major internal project.",
    inclusions: [
      "Review and preparation of source payment data",
      "Data validation and issue identification",
      "Payment timing and reporting calculations",
      "Review of material anomalies and outliers",
      "Preparation of submission-ready outputs",
      "Clear explanation of the reporting result",
    ],
    cta: "Talk to us about your submission",
  },
  {
    title: "Payment Behaviour Monitoring",
    price: "$1,500",
    cadence: "per month",
    description:
      "Ongoing visibility of payment behaviour and reporting readiness while there is still time to act.",
    inclusions: [
      "Monthly payment behaviour analysis",
      "Tracking of key payment performance measures",
      "Identification of emerging operational issues",
      "Monitoring of reporting readiness",
      "Practical recommendations where action is needed",
      "Payment Times Reporting submission included",
    ],
    cta: "Discuss ongoing monitoring",
    featured: true,
  },
];

const comparisonOptions = [
  {
    title: "Submission Support",
    description:
      "Ideal if you already have your payment data and simply want an experienced partner to prepare a complete, accurate and defensible Payment Times Report.",
    points: [
      "One engagement every reporting period",
      "We prepare the report from your payment data",
      "Clear explanation of the reported outcome",
      "Submission-ready outputs",
    ],
  },
  {
    title: "Ongoing Monitoring",
    description:
      "Designed for organisations that want to understand payment behaviour throughout the reporting period so there are fewer surprises when reporting time arrives.",
    points: [
      "Monthly payment behaviour analysis",
      "Early identification of emerging issues",
      "Practical recommendations before the period closes",
      "Payment Times Report preparation included",
    ],
    featured: true,
  },
];

function DetailList({ items }) {
  const theme = useTheme();

  return (
    <Box
      component="ul"
      sx={{
        my: 0,
        pl: 3,
        color: theme.palette.text.secondary,
        "& li": { mb: 1.25 },
        "& li:last-child": { mb: 0 },
      }}
    >
      {items.map((item) => (
        <Typography component="li" variant="body2" key={item}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}

export function PricingPage() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Payment Times Reporting Pricing"
        description="Straightforward Payment Times Reporting submission support and payment behaviour monitoring options from Monochrome Compliance."
        path="/pricing"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          image="/images/brand/hero3.jpg"
          eyebrow="Pricing"
          title="Straightforward support for Payment Times Reporting."
          description="Choose submission support when you need help completing your report, or ongoing monitoring when you want visibility while there is still time to improve the outcome."
        />

        <PublicPageSection
          title="Two simple options"
          introduction="Whether you simply need help preparing your next submission or want ongoing insight into your payment behaviour, we have a service that fits."
          textMaxWidth={theme.layout.public.textWidth}
        >
          <Grid container spacing={3} alignItems="stretch">
            {pricingOptions.map((option) => (
              <Grid
                key={option.title}
                size={{ xs: 12, md: 6 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  eyebrow={option.featured ? "Best value" : undefined}
                  title={option.title}
                  titleComponent="h3"
                  titleVariant="h5"
                  sx={{
                    borderColor: option.featured
                      ? theme.palette.primary.main
                      : theme.palette.divider,
                    borderWidth: option.featured ? 2 : 1,
                  }}
                  actions={
                    <Button
                      variant={option.featured ? "contained" : "outlined"}
                      component={RouterLink}
                      to="/contact"
                    >
                      {option.cta}
                    </Button>
                  }
                >
                  <Stack spacing={2.5} sx={{ pt: 1 }}>
                    <Box>
                      <Typography component="span" variant="h3">
                        {option.price}
                      </Typography>
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{ ml: 1, color: theme.palette.text.secondary }}
                      >
                        {option.cadence}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                      }}
                    >
                      {option.description}
                    </Typography>

                    <Divider />

                    <Box>
                      <Typography
                        component="p"
                        variant="subtitle1"
                        sx={{ mb: 1.5 }}
                      >
                        Included
                      </Typography>
                      <DetailList items={option.inclusions} />
                    </Box>
                  </Stack>
                </PublicCard>
              </Grid>
            ))}
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Which option is right for you?"
          introduction="Some organisations only need help every six months. Others want confidence throughout the reporting period. Both approaches deliver an accurate Payment Times Report — the difference is when you gain visibility."
          sx={{ pt: { xs: 4, md: 6 } }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {comparisonOptions.map((option) => (
              <Grid
                key={option.title}
                size={{ xs: 12, md: 6 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  title={option.title}
                  titleComponent="h3"
                  titleVariant="h5"
                  description={option.description}
                  sx={{
                    borderColor: option.featured
                      ? theme.palette.primary.main
                      : theme.palette.divider,
                    borderWidth: option.featured ? 2 : 1,
                  }}
                >
                  <Box sx={{ pt: 1.5 }}>
                    <DetailList items={option.points} />
                  </Box>
                </PublicCard>
              </Grid>
            ))}
          </Grid>
        </PublicPageSection>

        <PublicPageSection sx={{ pt: { xs: 4, md: 6 } }}>
          <PublicCallToAction
            title="Ready to make your next Payment Times Report easier?"
            description="Whether you need help with your next submission or want ongoing visibility into your payment behaviour, we'd be happy to talk through your situation and recommend the most suitable approach."
            sx={{ py: { xs: 3, md: 4 } }}
          >
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/contact"
            >
              Talk to us
            </Button>
          </PublicCallToAction>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
