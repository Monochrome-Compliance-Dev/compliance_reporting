import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  useMediaQuery,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { adminService } from "../services/admin/admin";

const POSTS_PER_PAGE = 5;

const BlogIndex = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("all");
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/static-content/blog/index.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load index");
        return res.json();
      })
      .then((data) => {
        const blogs = data
          .filter((post) => post.slug !== "your-blog-slug")
          .map(({ slug, title, description, date, tags }) => ({
            slug,
            title: title || "Untitled",
            description: description || "",
            date: date || "",
            tags: tags || [],
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setAllPosts(blogs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load blog index:", err);
        setLoading(false);
      });
  }, []);

  const filteredPosts =
    tag === "all"
      ? allPosts
      : allPosts.filter((post) => {
          const tags =
            typeof post.tags === "string"
              ? post.tags
                  .replace(/[\\[\]"]/g, "")
                  .split(",")
                  .map((t) => t.trim())
              : (post.tags || []).map((t) => t.trim());
          return tags.includes(tag);
        });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const displayedPosts = filteredPosts.slice(
    (page - 1) * POSTS_PER_PAGE,
    page * POSTS_PER_PAGE
  );

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <Box sx={{ maxWidth: "800px", mx: "auto", p: theme.spacing(4) }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Compliance Blog</Typography>
        <FormControl size="small">
          <InputLabel id="tag-select-label">Filter by tag</InputLabel>
          <Select
            labelId="tag-select-label"
            value={tag}
            label="Filter by tag"
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            {Object.entries(
              allPosts.reduce((acc, post) => {
                const tags =
                  typeof post.tags === "string"
                    ? post.tags
                        .replace(/[\\[\]"]/g, "")
                        .split(",")
                        .map((t) => t.trim())
                    : (post.tags || []).map((t) => t.trim());

                for (const tag of tags) {
                  if (!acc[tag]) acc[tag] = new Set();
                  acc[tag].add(post.slug);
                }

                return acc;
              }, {})
            )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tag, slugSet]) => (
                <MenuItem key={tag} value={tag}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{tag}</span>
                    <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                      {slugSet.size}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={4}>
        {displayedPosts.map((post) => {
          // Calculate reading time
          const wordCount = (post.description || "").split(/\s+/).length;
          const readingTime = Math.ceil(wordCount / 200); // ~200 wpm
          return (
            <Grid item xs={12} key={post.slug}>
              <Card
                key={post.slug}
                onClick={() => navigate(`/blog/${post.slug}`)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: isSmallScreen ? 2 : 3,
                  py: isSmallScreen ? 1 : 2,
                  cursor: "pointer",
                  transition: "box-shadow 0.3s",
                  "&:hover": {
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ p: 0, pb: 1 }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {post.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontStyle: "italic", display: "block" }}
                  >
                    {post.date && !isNaN(new Date(post.date))
                      ? new Date(post.date).toLocaleDateString()
                      : "No date available"}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {post.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: "italic", mt: 2, display: "block" }}
                  >
                    {`${readingTime} min read`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          sx={{ mt: 4, display: "flex", justifyContent: "center" }}
        />
      )}
    </Box>
  );
};

export default BlogIndex;
