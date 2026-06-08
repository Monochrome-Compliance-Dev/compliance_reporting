import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function IndustryInsights() {
  const theme = useTheme();

  const contentMaxWidth = 1080;

  const industryInsights = [
    {
      series: "Industry Insight Series #1",
      title: "Construction Payment Times: Compliance vs Optics",
      description:
        "Why construction entities governed by Security of Payment legislation can appear slow in PTRS reporting even when operating within contractual and statutory frameworks.",
      publishDate: "February 2026",
      href: "/insights/Industry_Insight_Series_01_Construction_Payment_Times.pdf",
      tags: ["Construction", "PTRS", "Payment timing"],
    },
    {
      series: "Industry Insight Series #2",
      title: "The Hidden Drivers of Poor Payment Metrics",
      description:
        "A practical look at the operational mechanics that can quietly affect reported payment outcomes across large and complex organisations.",
      publishDate: "June 2026",
      href: "/insights/The_Hidden_Drivers_of_Poor_Payment_Metrics.pdf",
      tags: ["Payment behaviour", "Operational delay", "P95"],
    },
  ];

  const articleTopics = [
    {
      title: "How Weekly Payment Runs Distort Payment Metrics",
      description:
        "Why ordinary payment cycle timing can create unexpected elapsed-day impacts in PTRS reporting.",
      status: "Published",
      href: "/insights/blog/how-weekly-payment-runs-distort-payment-metrics",
    },
    {
      title: "Operational Delay vs Behavioural Delay",
      description:
        "A plain-English distinction between process-driven payment lag and deliberate payment behaviour.",
      status: "Coming soon",
    },
  ];

  return (
    <>
      <PageMeta
        title="Industry Insights | Monochrome Compliance"
        description="Practical Payment Times Reporting insights for complex organisations, with plain-English analysis of payment behaviour, operational timing, and reporting outcomes."
        image="/images/og/og-industry-insights.jpg"
      />

      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: { xs: theme.spacing(5), md: theme.spacing(7) },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Box sx={{ maxWidth: 820 }}>
            <Typography
              variant="overline"
              color={theme.palette.primary.main}
              sx={{ fontWeight: 700, letterSpacing: 1.4 }}
            >
              Insights & analysis
            </Typography>

            <Typography
              variant="h3"
              sx={{ fontWeight: 700, mt: 1, mb: theme.spacing(2) }}
            >
              Practical insight for complex payment reporting environments
            </Typography>

            <Typography
              variant="h6"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.55 }}
            >
              We unpack the operational mechanics that sit underneath Payment
              Times Reporting outcomes, including payment cycles, approval
              pathways, shared services processing, invoice recognition, and
              tail-payment behaviour.
            </Typography>
          </Box>

          <Divider
            sx={{ my: { xs: theme.spacing(4), md: theme.spacing(5) } }}
          />

          <Stack spacing={1} sx={{ mb: theme.spacing(3) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Industry Insight Series
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ maxWidth: 760, lineHeight: 1.65 }}
            >
              Flagship PDF papers exploring the structural and operational
              drivers that influence payment behaviour reporting across large
              organisations.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {industryInsights.map((insight) => (
              <Grid key={insight.title} size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <CardContent sx={{ p: theme.spacing(3) }}>
                    <Typography
                      variant="overline"
                      color={theme.palette.text.secondary}
                      sx={{ fontWeight: 700 }}
                    >
                      {insight.series} · {insight.publishDate}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                      {insight.title}
                    </Typography>

                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                      sx={{ mt: 1.5, mb: theme.spacing(2.5), lineHeight: 1.65 }}
                    >
                      {insight.description}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mb: theme.spacing(2.5) }}
                    >
                      {insight.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>

                    <Button
                      variant="outlined"
                      color="primary"
                      component="a"
                      href={insight.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider
            sx={{ my: { xs: theme.spacing(4), md: theme.spacing(5) } }}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={1} sx={{ mb: theme.spacing(3) }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Articles & analysis
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.65 }}
                >
                  Shorter pieces that unpack specific payment reporting
                  mechanics in a more focused way. These are written to be
                  practical, searchable, and easy to share.
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {articleTopics.map((article) => (
                  <Card
                    key={article.title}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {article.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={theme.palette.text.secondary}
                            sx={{ mt: 0.75, lineHeight: 1.6 }}
                          >
                            {article.description}
                          </Typography>
                        </Box>

                        {article.href ? (
                          <Button
                            variant="outlined"
                            color="primary"
                            component={RouterLink}
                            to={article.href}
                            sx={{
                              alignSelf: { xs: "flex-start", sm: "center" },
                            }}
                          >
                            Read article
                          </Button>
                        ) : (
                          <Chip
                            label={article.status}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                              alignSelf: { xs: "flex-start", sm: "center" },
                            }}
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Button
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/insights/blog"
                sx={{ mt: theme.spacing(3) }}
              >
                View blog posts
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <CardContent sx={{ p: theme.spacing(3) }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Knowledge Centre
                  </Typography>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{ lineHeight: 1.65, mb: theme.spacing(2.5) }}
                  >
                    We are building a practical reference library for Payment
                    Times Reporting concepts, including PTRS, P95, payment
                    timing, regulator focus areas, and the operational mechanics
                    that influence reported outcomes.
                  </Typography>

                  <Stack spacing={1.25}>
                    <Chip label="PTRS fundamentals" variant="outlined" />
                    <Chip label="P95 explainers" variant="outlined" />
                    <Chip label="Payment behaviour" variant="outlined" />
                    <Button
                      variant="outlined"
                      color="primary"
                      component={RouterLink}
                      to="/insights/knowledge"
                      sx={{ alignSelf: "flex-start", mt: theme.spacing(1) }}
                    >
                      View Knowledge Centre
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}
