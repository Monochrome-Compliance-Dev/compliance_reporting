import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Box, Typography, CircularProgress } from "@mui/material";
import ReactMarkdown from "react-markdown";

const StaticPageViewer = () => {
  const { slug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`/static-content/blog/${slug}.md`);
        if (!res.ok) throw new Error("Failed to load content");
        const text = await res.text();
        setContent(text);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Content not found.</Typography>;

  return (
    <Box sx={{ maxWidth: "900px", mx: "auto", p: 4 }}>
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          "& h2": {
            marginTop: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            paddingBottom: "0.5rem",
          },
          "& ul": {
            paddingLeft: 3,
          },
          "& a": {
            color: "text.primary",
            textDecoration: "underline",
          },
        }}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </Box>
    </Box>
  );
};

export default StaticPageViewer;
