import { Box, Divider, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";

const knowledgeArticles = [
  {
    slug: "what-is-the-payment-times-reporting-scheme",
    title: "What is the Payment Times Reporting Scheme?",
    description:
      "A plain-English overview of the PTRS, why it exists, and why payment transparency matters for large reporting entities and small business suppliers.",
    category: "PTRS fundamentals",
  },
  {
    slug: "what-is-p95",
    title: "What is P95?",
    description:
      "A practical explanation of P95 payment performance and why it has become one of the most important measures in payment behaviour reporting.",
    category: "Payment metrics",
  },
  {
    slug: "what-does-a-p95-of-30-days-mean",
    title: "What does a P95 of 30 days mean?",
    description:
      "How to understand a P95 result in real terms, including what it means for most invoices to be paid within 30 days.",
    category: "Payment metrics",
  },
  {
    slug: "what-does-the-bottom-20-percent-mean",
    title: "What does the bottom 20% mean?",
    description:
      "A simple explanation of how the regulator compares slower payers within industry groups and why safe harbour matters.",
    category: "Regulator focus",
  },
  {
    slug: "how-are-payment-times-calculated",
    title: "How are payment times calculated?",
    description:
      "An overview of elapsed payment timing and why invoice dates, receipt dates, payment dates, and operational workflows matter.",
    category: "Payment calculations",
  },
  {
    slug: "what-is-a-payment-run",
    title: "What is a payment run?",
    description:
      "Why scheduled payment cycles can affect reported payment timing even when the underlying process feels normal internally.",
    category: "Operational drivers",
  },
];

export default function KnowledgeIndex() {
  const theme = useTheme();
  const contentMaxWidth = 980;

  return (
    <>
      <PageMeta
        title="PTRS Knowledge Centre | Monochrome Compliance"
        description="Plain-English explanations of Payment Times Reporting Scheme concepts, including PTRS, P95, payment timing, reporting obligations, and operational payment behaviour."
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
          <Typography
            variant="overline"
            color={theme.palette.primary.main}
            sx={{ fontWeight: 700, letterSpacing: 1.4 }}
          >
            PTRS Knowledge Centre
          </Typography>

          <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
            Plain-English answers to common payment reporting questions
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.5 }}
          >
            Short practical explainers covering the Payment Times Reporting
            Scheme, P95, payment timing, regulator focus areas, and the
            operational mechanics that can influence reported payment outcomes.
          </Typography>

          <Divider sx={{ my: theme.spacing(4) }} />

          <Typography
            variant="body1"
            sx={{ mb: theme.spacing(3), lineHeight: 1.7 }}
          >
            The Knowledge Centre is designed for quick reference. Each article
            answers one question clearly, then links to related concepts so
            teams can build a practical understanding of payment behaviour
            reporting without having to interpret the scheme from scratch every
            time.
          </Typography>

          <Grid container spacing={3}>
            {knowledgeArticles.map((article) => (
              <Grid key={article.slug} size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    height: "100%",
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    p: theme.spacing(3),
                  }}
                >
                  <Typography
                    variant="overline"
                    color={theme.palette.text.secondary}
                    sx={{ fontWeight: 700 }}
                  >
                    {article.category}
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mt: 1,
                      mb: 1,
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                    component={RouterLink}
                    to={`/insights/knowledge/${article.slug}`}
                  >
                    {article.title}
                  </Typography>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{ lineHeight: 1.6 }}
                  >
                    {article.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
