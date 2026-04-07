import { Box, Divider, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink } from "react-router";
import PageMeta from "shared/ui/PageMeta";
import { blogPosts } from "./blogRegistry";

export default function BlogIndex() {
  const theme = useTheme();
  const contentMaxWidth = 980;

  const sorted = [...blogPosts].sort((a, b) =>
    String(b.dateISO).localeCompare(String(a.dateISO)),
  );

  return (
    <>
      <PageMeta
        title="Blog | Industry Insights | Monochrome Compliance"
        description="Short, practical insights on payment behaviour, reporting, and data architecture across industries — focused on clarity, defensibility, and outcomes."
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
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Blog
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ lineHeight: 1.5 }}
          >
            Short posts to build clarity around payment behaviour and reporting
            pressure across industries — and the underlying data architecture
            that makes it harder than it needs to be.
          </Typography>

          <Divider sx={{ my: theme.spacing(4) }} />

          <Typography variant="body2" sx={{ mb: theme.spacing(3) }}>
            Looking for a more structured approach? Explore our core services{" "}
            <RouterLink
              to="/services"
              style={{ color: theme.palette.primary.main }}
            >
              here
            </RouterLink>
            .
          </Typography>

          <Grid container spacing={3}>
            {sorted.map((post) => (
              <Grid key={post.slug} size={{ xs: 12 }}>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    p: theme.spacing(3),
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                    component={RouterLink}
                    to={`/insights/blog/${post.slug}`}
                  >
                    {post.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                    sx={{ mb: 1 }}
                  >
                    {new Date(post.dateISO).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Typography>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{ lineHeight: 1.6 }}
                  >
                    {post.description}
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
