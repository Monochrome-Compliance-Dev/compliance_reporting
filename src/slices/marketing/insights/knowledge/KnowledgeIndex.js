import { Box, Divider, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";
import { knowledgeArticles } from "./knowledgeRegistry";

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
            component={RouterLink}
            to="/insights"
            sx={{
              display: "block",
              mb: theme.spacing(2),
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            ← Back to Insights
          </Typography>
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
