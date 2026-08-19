import { Box, Button, Chip, Grid, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicCard, PublicPageHero, PublicPageSection } from "shared/ui";

const insights = [
  {
    series: "Industry Insight Series #1",
    title: "Construction Payment Times: Compliance vs Optics",
    description:
      "Why construction entities governed by Security of Payment legislation can appear slow in PTRS reporting even when operating within contractual and statutory frameworks.",
    publishDate: "February 2026",
    href: "/documents/insights/Industry_Insight_Series_01_Construction_Payment_Times.pdf",
    tags: ["Construction", "PTRS", "Payment timing"],
  },
  {
    series: "Industry Insight Series #2",
    title: "The Hidden Drivers of Poor Payment Metrics",
    description:
      "A practical look at the operational mechanics that can quietly affect reported payment outcomes across large and complex organisations.",
    publishDate: "June 2026",
    href: "/documents/insights/The_Hidden_Drivers_of_Poor_Payment_Metrics.pdf",
    tags: ["Payment behaviour", "Operational delay", "P95"],
  },
  {
    series: "Industry Insight Series #3",
    title: "How Can You Fix Your PTRS?",
    description:
      "A practical guide to understanding P95, why averages can point organisations in the wrong direction, and how targeted operational changes can improve reported payment outcomes.",
    publishDate: "July 2026",
    href: "/documents/insights/How%20Can%20You%20Fix%20Your%20PTRS%3F.pdf",
    tags: ["PTRS", "P95", "Payment behaviour"],
  },
];

function TagList({ tags }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {tags.map((tag) => (
        <Chip key={tag} label={tag} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

export default function IndustryInsights() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Industry Insights | Monochrome Compliance"
        description="Practical Payment Times Reporting insights for complex organisations, with plain-English analysis of payment behaviour, operational timing, and reporting outcomes."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Insights & analysis"
          title="Practical insight for complex payment reporting environments"
          description="We unpack the operational mechanics that sit underneath Payment Times Reporting outcomes, including payment cycles, approval pathways, shared services processing, invoice recognition, and tail-payment behaviour."
          sx={{ pb: { xs: 3, md: 4 } }}
        />

        <PublicPageSection
          title="Latest insight"
          introduction="Practical articles exploring published payment data, reporting measures and the operational behaviour behind the results."
          sx={{ pt: 0, pb: { xs: 4, md: 5 } }}
        >
          <PublicCard
            eyebrow="Product insight · July 2026"
            title="Introducing the Payment Times Explorer"
            titleComponent="h3"
            titleVariant="h4"
            description="A clearer way to search Australia's published Payment Times Reporting data, explore company results over time and understand payment behaviour within an industry context."
            actions={
              <Button
                variant="contained"
                component={RouterLink}
                to="/insights/payment-times-explorer"
              >
                Read the article
              </Button>
            }
          >
            <Box sx={{ pt: 1.5 }}>
              <TagList
                tags={["Payment Times Explorer", "PTRS", "Payment data"]}
              />
            </Box>
          </PublicCard>
        </PublicPageSection>

        <PublicPageSection
          title="Industry Insight Series"
          introduction="Flagship PDF papers exploring the structural and operational drivers that influence payment behaviour reporting across large organisations."
          sx={{ py: { xs: 4, md: 6 } }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {insights.map((insight) => (
              <Grid
                key={insight.series}
                size={{ xs: 12, md: 4 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  eyebrow={`${insight.series} · ${insight.publishDate}`}
                  title={insight.title}
                  titleComponent="h3"
                  titleVariant="h5"
                  description={insight.description}
                  actions={
                    <Button
                      variant="outlined"
                      component="a"
                      href={insight.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${insight.title} PDF in a new tab`}
                    >
                      Download PDF
                    </Button>
                  }
                >
                  <Box sx={{ pt: 1.5 }}>
                    <TagList tags={insight.tags} />
                  </Box>
                </PublicCard>
              </Grid>
            ))}
          </Grid>
        </PublicPageSection>

        <PublicPageSection
          title="Explore by format"
          introduction="Choose concise practical explainers or longer-form analysis depending on the question you are trying to answer."
          sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 7 } }}
        >
          <Grid container spacing={3} alignItems="stretch">
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Practical guidance"
                title="Knowledge Centre"
                titleComponent="h3"
                titleVariant="h4"
                description="Plain-English explanations of Payment Times Reporting concepts, payment metrics and the operational processes that influence reported outcomes."
                actions={
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/insights/knowledge"
                  >
                    Explore the Knowledge Centre
                  </Button>
                }
              >
                <Box sx={{ pt: 1.5 }}>
                  <TagList
                    tags={[
                      "P95",
                      "Payment terms",
                      "Reporting metrics",
                      "Payment behaviour",
                    ]}
                  />
                </Box>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Short-form analysis"
                title="Blog"
                titleComponent="h3"
                titleVariant="h4"
                description="Focused articles unpacking specific mechanics behind payment reporting, written to be practical, searchable and grounded in how large organisations actually operate."
                actions={
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/insights/blog"
                  >
                    View blog posts
                  </Button>
                }
              >
                <Box sx={{ pt: 1.5 }}>
                  <TagList
                    tags={[
                      "Construction",
                      "Payment cycles",
                      "Invoice recognition",
                      "Operational delay",
                    ]}
                  />
                </Box>
              </PublicCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
              <PublicCard
                eyebrow="Official guidance made easier"
                title="PTRS Guidance Explorer"
                titleComponent="h3"
                titleVariant="h4"
                description="Search plain-English answers to common Payment Times Reporting questions, grounded in the Regulator's published guidance and worked examples."
                actions={
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/ptrs-guidance"
                  >
                    Explore PTRS Guidance
                  </Button>
                }
              >
                <Box sx={{ pt: 1.5 }}>
                  <TagList
                    tags={[
                      "Trade credit",
                      "Payments",
                      "Exclusions",
                      "Calculations",
                    ]}
                  />
                </Box>
              </PublicCard>
            </Grid>
          </Grid>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
