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

  const contentMaxWidth = theme.layout.public.contentWidth;
  const pdfHref = "/documents/insights";

  const insights = [
    {
      series: "Industry Insight Series #1",
      title: "Construction Payment Times: Compliance vs Optics",
      description:
        "Why construction entities governed by Security of Payment legislation can appear slow in PTRS reporting even when operating within contractual and statutory frameworks.",
      publishDate: "February 2026",
      href: `${pdfHref}/Industry_Insight_Series_01_Construction_Payment_Times.pdf`,
      tags: ["Construction", "PTRS", "Payment timing"],
    },
    {
      series: "Industry Insight Series #2",
      title: "The Hidden Drivers of Poor Payment Metrics",
      description:
        "A practical look at the operational mechanics that can quietly affect reported payment outcomes across large and complex organisations.",
      publishDate: "June 2026",
      href: `${pdfHref}/The_Hidden_Drivers_of_Poor_Payment_Metrics.pdf`,
      tags: ["Payment behaviour", "Operational delay", "P95"],
    },
    {
      series: "Industry Insight Series #3",
      title: "How Can You Fix Your PTRS?",
      description:
        "A practical guide to understanding P95, why averages can point organisations in the wrong direction, and how targeted operational changes can improve reported payment outcomes.",
      publishDate: "July 2026",
      href: `${pdfHref}/How%20Can%20You%20Fix%20Your%20PTRS%3F.pdf`,
      tags: ["PTRS", "P95", "Payment behaviour"],
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
          <Box>
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
              Latest insight
            </Typography>

            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.65 }}
            >
              Practical articles exploring published payment data, reporting
              measures and the operational behaviour behind the results.
            </Typography>
          </Stack>

          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent
              sx={{ p: { xs: theme.spacing(3), md: theme.spacing(4) } }}
            >
              <Typography
                variant="overline"
                color={theme.palette.primary.main}
                sx={{ fontWeight: 700 }}
              >
                Product insight · July 2026
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                Introducing the Payment Times Explorer
              </Typography>

              <Typography
                variant="body1"
                color={theme.palette.text.secondary}
                sx={{
                  mt: 1.5,
                  mb: theme.spacing(2.5),
                  lineHeight: 1.65,
                }}
              >
                A clearer way to search Australia&apos;s published Payment Times
                Reporting data, explore company results over time and understand
                payment behaviour within an industry context.
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mb: theme.spacing(2.5) }}
              >
                <Chip
                  label="Payment Times Explorer"
                  size="small"
                  variant="outlined"
                />
                <Chip label="PTRS" size="small" variant="outlined" />
                <Chip label="Payment data" size="small" variant="outlined" />
              </Stack>

              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/insights/payment-times-explorer"
              >
                Read the article
              </Button>
            </CardContent>
          </Card>

          <Divider sx={{ my: theme.spacing(4) }} />

          <Stack spacing={1} sx={{ mb: theme.spacing(3) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Industry Insight Series
            </Typography>

            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.65 }}
            >
              Flagship PDF papers exploring the structural and operational
              drivers that influence payment behaviour reporting across large
              organisations.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {insights.map((insight) => (
              <Grid key={insight.series} size={{ xs: 12 }}>
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
                      sx={{
                        mt: 1.5,
                        mb: theme.spacing(2.5),

                        lineHeight: 1.65,
                      }}
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
                      variant="contained"
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

          <Divider sx={{ my: theme.spacing(4) }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <CardContent
                  sx={{
                    height: "100%",
                    p: { xs: theme.spacing(3), md: theme.spacing(4) },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="overline"
                    color={theme.palette.primary.main}
                    sx={{ fontWeight: 700 }}
                  >
                    Practical guidance
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    Knowledge Centre
                  </Typography>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{
                      mt: 1.5,
                      mb: theme.spacing(2.5),
                      lineHeight: 1.65,
                    }}
                  >
                    Plain-English explanations of Payment Times Reporting
                    concepts, payment metrics and the operational processes that
                    influence reported outcomes.
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.25,
                      fontWeight: 700,
                    }}
                  >
                    Topics include
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mb: theme.spacing(3) }}
                  >
                    <Chip label="P95" size="small" variant="outlined" />
                    <Chip
                      label="Payment terms"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Reporting metrics"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Payment behaviour"
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Box sx={{ mt: "auto" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to="/insights/knowledge"
                    >
                      Explore the Knowledge Centre
                    </Button>
                  </Box>
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
                <CardContent
                  sx={{
                    height: "100%",
                    p: { xs: theme.spacing(3), md: theme.spacing(4) },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="overline"
                    color={theme.palette.primary.main}
                    sx={{ fontWeight: 700 }}
                  >
                    Short-form analysis
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    Blog
                  </Typography>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{
                      mt: 1.5,
                      mb: theme.spacing(2.5),
                      lineHeight: 1.65,
                    }}
                  >
                    Focused articles unpacking specific mechanics behind payment
                    reporting, written to be practical, searchable and grounded
                    in how large organisations actually operate.
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.25,
                      fontWeight: 700,
                    }}
                  >
                    Recent themes
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mb: theme.spacing(3) }}
                  >
                    <Chip
                      label="Construction"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Payment cycles"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Invoice recognition"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Operational delay"
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Box sx={{ mt: "auto" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to="/insights/blog"
                    >
                      View blog posts
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}
