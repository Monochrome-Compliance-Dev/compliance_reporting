import { Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useParams } from "react-router";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicPageHero, PublicPageSection } from "shared/ui";
import { blogPosts } from "./blogRegistry";

function formatDate(dateISO) {
  return new Date(dateISO).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostPage() {
  const theme = useTheme();
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <>
        <PageMeta
          title="Blog Post Not Found"
          description="The requested Monochrome Compliance blog post could not be found."
          noIndex
        />
        <PublicPageLayout>
          <PublicPageHero
            eyebrow="Industry Insights Blog"
            title="Post not found"
            description="The requested blog post could not be found."
          >
            <Button
              variant="outlined"
              component={RouterLink}
              to="/insights/blog"
            >
              Back to Blog
            </Button>
          </PublicPageHero>
        </PublicPageLayout>
      </>
    );
  }

  const PostComponent = post.Component;

  return (
    <>
      <PageMeta
        title={`${post.title} | Monochrome Compliance`}
        description={post.description}
        image="https://monochrome-compliance.com/images/og/og-industry-insights.jpg"
        type="article"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Industry Insights Blog"
          title={post.title}
          description={post.description}
          metadata={formatDate(post.dateISO)}
          contentMaxWidth={theme.layout.public.textWidth}
        >
          <Button variant="text" component={RouterLink} to="/insights/blog">
            Back to blog
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
          <PostComponent />

          <PublicSurface component="aside" sx={{ mt: { xs: 2, md: 3 } }}>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              Explore how these ideas translate into practical outcomes through{" "}
              <RouterLink to="/services">our services</RouterLink>, or see how
              they apply in specific sectors on the{" "}
              <RouterLink to="/industries">industries page</RouterLink>.
            </Typography>
          </PublicSurface>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
