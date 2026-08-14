import { Button, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicCard, PublicPageHero, PublicPageSection } from "shared/ui";
import { knowledgeArticles } from "./knowledgeRegistry";

export default function KnowledgeIndex() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="PTRS Knowledge Centre | Monochrome Compliance"
        description="Plain-English explanations of Payment Times Reporting Scheme concepts, including PTRS, P95, payment timing, reporting obligations, and operational payment behaviour."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="PTRS Knowledge Centre"
          title="Plain-English answers to common payment reporting questions"
          description="Short practical explainers covering the Payment Times Reporting Scheme, P95, payment timing, regulator focus areas, and the operational mechanics that can influence reported payment outcomes."
        >
          <Button variant="text" component={RouterLink} to="/insights">
            Back to Insights
          </Button>
        </PublicPageHero>

        <PublicPageSection
          title="Build a practical understanding"
          introduction="The Knowledge Centre is designed for quick reference. Each article answers one question clearly, then links to related concepts so teams can build a practical understanding of payment behaviour reporting without having to interpret the scheme from scratch every time."
          sx={{ pt: 0 }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {knowledgeArticles.map((article) => (
              <Grid
                key={article.slug}
                size={{ xs: 12, md: 6 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  eyebrow={article.category}
                  title={article.title}
                  titleComponent="h3"
                  titleVariant="h5"
                  description={article.description}
                  actions={
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to={`/insights/knowledge/${article.slug}`}
                    >
                      Read explainer
                    </Button>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
