import { Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useParams } from "react-router";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicPageHero, PublicPageSection } from "shared/ui";
import { knowledgeArticles } from "./knowledgeRegistry";

export default function KnowledgeArticlePage() {
  const theme = useTheme();
  const { slug } = useParams();
  const article = knowledgeArticles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <>
        <PageMeta
          title="Knowledge Article Not Found"
          description="The requested Monochrome Compliance knowledge article could not be found."
          noIndex
        />
        <PublicPageLayout>
          <PublicPageHero
            eyebrow="PTRS Knowledge Centre"
            title="Article not found"
            description="The requested knowledge article could not be found."
          >
            <Button
              variant="outlined"
              component={RouterLink}
              to="/insights/knowledge"
            >
              Back to Knowledge Centre
            </Button>
          </PublicPageHero>
        </PublicPageLayout>
      </>
    );
  }

  const ArticleComponent = article.Component;

  return (
    <>
      <PageMeta
        title={`${article.title} | Monochrome Compliance`}
        description={article.description}
        image="https://monochrome-compliance.com/images/og/og-industry-insights.jpg"
        type="article"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow={article.category}
          title={article.title}
          description={article.description}
          contentMaxWidth={theme.layout.public.textWidth}
        >
          <Button
            variant="text"
            component={RouterLink}
            to="/insights/knowledge"
          >
            Back to Knowledge Centre
          </Button>
        </PublicPageHero>

        <PublicPageSection
          component="article"
          contentMaxWidth={theme.layout.public.textWidth}
          sx={{ pt: 0 }}
          contentSx={{
            "& p": { lineHeight: 1.8 },
            "& h2, & h3, & h4": { scrollMarginTop: theme.spacing(12) },
            "& img": { maxWidth: "100%", height: "auto" },
          }}
        >
          <ArticleComponent />

          <PublicSurface component="aside" sx={{ mt: { xs: 2, md: 3 } }}>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              Explore more practical explainers in the{" "}
              <RouterLink to="/insights/knowledge">
                PTRS Knowledge Centre
              </RouterLink>
              , or read our longer analysis in the{" "}
              <RouterLink to="/insights">Industry Insight Series</RouterLink>.
            </Typography>
          </PublicSurface>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
