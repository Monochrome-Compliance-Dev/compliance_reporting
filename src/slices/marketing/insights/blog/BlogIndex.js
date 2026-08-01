import { Button, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicCard, PublicPageHero, PublicPageSection } from "shared/ui";
import { blogPosts } from "./blogRegistry";

function formatDate(dateISO) {
  return new Date(dateISO).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const theme = useTheme();
  const sorted = [...blogPosts].sort((a, b) =>
    String(b.dateISO).localeCompare(String(a.dateISO)),
  );

  return (
    <>
      <PageMeta
        title="Blog | Industry Insights | Monochrome Compliance"
        description="Short, practical commentary on payment reporting, compliance, data quality, operational payment behaviour, and the issues affecting reporting outcomes."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Industry Insights Blog"
          title="Practical commentary on payment reporting"
          description="Short, practical posts covering payment reporting, compliance, data quality, operational payment behaviour, and the issues that influence reported outcomes."
        >
          <Button variant="text" component={RouterLink} to="/insights">
            Back to Insights
          </Button>
        </PublicPageHero>

        <PublicPageSection
          title="Latest articles"
          introduction="Focused analysis grounded in how large organisations actually process, approve and report supplier payments."
          sx={{ pt: 0 }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {sorted.map((post) => (
              <Grid
                key={post.slug}
                size={{ xs: 12, md: 6 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  eyebrow={formatDate(post.dateISO)}
                  title={post.title}
                  titleComponent="h3"
                  titleVariant="h5"
                  description={post.description}
                  actions={
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to={`/insights/blog/${post.slug}`}
                    >
                      Read article
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
