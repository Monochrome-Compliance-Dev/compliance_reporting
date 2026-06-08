import { Box, Divider, Typography, useTheme } from "@mui/material";
import { useParams, Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";
import { blogPosts } from "./blogRegistry";

export default function BlogPostPage() {
  const theme = useTheme();
  const { slug } = useParams();
  const contentMaxWidth = 980;

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
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
            Post not found
          </Typography>
          <Typography
            component={RouterLink}
            to="/insights/blog"
            sx={{ color: theme.palette.primary.main }}
          >
            Back to blog
          </Typography>
        </Box>
      </Box>
    );
  }

  const PostComponent = post.Component;

  return (
    <>
      <PageMeta
        title={`${post.title} | Monochrome Compliance`}
        description={post.description}
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
            to="/insights/blog"
            sx={{
              display: "block",
              mb: theme.spacing(2),
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            ← Back to blog
          </Typography>

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {post.title}
          </Typography>

          <Typography variant="body2" color={theme.palette.text.secondary}>
            {new Date(post.dateISO).toLocaleDateString("en-AU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>

          <Divider sx={{ my: theme.spacing(4) }} />

          <PostComponent />

          <Divider sx={{ my: theme.spacing(4) }} />

          <Typography variant="body2">
            Explore how these ideas translate into practical outcomes through{" "}
            <RouterLink
              to="/services"
              style={{ color: theme.palette.primary.main }}
            >
              our services
            </RouterLink>
            , or see how they apply in specific sectors on the{" "}
            <RouterLink
              to="/industries"
              style={{ color: theme.palette.primary.main }}
            >
              industries page
            </RouterLink>
            .
          </Typography>
        </Box>
      </Box>
    </>
  );
}
