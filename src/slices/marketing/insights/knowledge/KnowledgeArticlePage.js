import { Box, Divider, Typography, useTheme } from "@mui/material";
import { useParams, Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";
import { knowledgeArticles } from "./knowledgeRegistry";

export default function KnowledgeArticlePage() {
  const theme = useTheme();
  const { slug } = useParams();
  const contentMaxWidth = 980;

  const article = knowledgeArticles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Article not found
          </Typography>
          <Typography
            component={RouterLink}
            to="/insights/knowledge"
            sx={{ color: theme.palette.primary.main }}
          >
            Back to Knowledge Centre
          </Typography>
        </Box>
      </Box>
    );
  }

  const ArticleComponent = article.Component;

  return (
    <>
      <PageMeta
        title={`${article.title} | Monochrome Compliance`}
        description={article.description}
        image="https://monochrome-compliance.com/images/og/og-industry-insights.jpg"
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
            to="/insights/knowledge"
            sx={{
              display: "inline-block",
              mb: theme.spacing(2),
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            ← Back to Knowledge Centre
          </Typography>

          <Typography
            variant="overline"
            color={theme.palette.text.secondary}
            sx={{ fontWeight: 700 }}
          >
            {article.category}
          </Typography>

          <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
            {article.title}
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.55 }}
          >
            {article.description}
          </Typography>

          <Divider sx={{ my: theme.spacing(4) }} />

          <ArticleComponent />

          <Divider sx={{ my: theme.spacing(4) }} />

          <Typography variant="body2">
            Explore more practical explainers in the{" "}
            <RouterLink
              to="/insights/knowledge"
              style={{ color: theme.palette.primary.main }}
            >
              PTRS Knowledge Centre
            </RouterLink>
            , or read our longer analysis in the{" "}
            <RouterLink
              to="/insights"
              style={{ color: theme.palette.primary.main }}
            >
              Industry Insight Series
            </RouterLink>
            .
          </Typography>
        </Box>
      </Box>
    </>
  );
}
