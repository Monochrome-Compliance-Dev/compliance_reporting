import { Link as RouterLink } from "react-router";
import { Box, Link, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

function Footer(props) {
  const theme = useTheme();

  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.background.navbar,
        color: theme.palette.text.secondary,
        py: 2,
        px: 2,
        textAlign: "center",
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 6,
        width: "100%",
      }}
      {...props}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: "0.75rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          flexDirection: "row",
          textAlign: "center",
          mt: 0.5,
        }}
      >
        © {new Date().getFullYear()}{" "}
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          underline="hover"
          sx={{ fontWeight: "bold" }}
        >
          Monochrome Compliance
        </Link>
        <span style={{ color: theme.palette.text.disabled }}>•</span>ABN
        20687127386
        <span style={{ color: theme.palette.text.disabled }}>•</span>
        <Link
          component={RouterLink}
          to="/policy-documents/legal"
          color="inherit"
          underline="hover"
        >
          Legal
        </Link>
        <span style={{ color: theme.palette.text.disabled }}>•</span>
        <Link
          component={RouterLink}
          to="/policy-documents/privacy-policy"
          color="inherit"
          underline="hover"
        >
          Privacy
        </Link>
        <span style={{ color: theme.palette.text.disabled }}>•</span>
        <Link
          component={RouterLink}
          to="/policy-documents/client-service-agreement"
          color="inherit"
          underline="hover"
        >
          Terms of Service
        </Link>
        <span style={{ color: theme.palette.text.disabled }}>•</span>
        <Link
          component="a"
          href="/sitemap.xml"
          color="inherit"
          underline="hover"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sitemap
        </Link>
      </Typography>

      {showScrollButton && (
        <Box
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
            boxShadow: 3,
            p: 1,
            zIndex: 1000,
            animation: "fadeSlideIn 0.4s ease-out forwards",
            "@keyframes fadeSlideIn": {
              from: { opacity: 0, transform: "translateY(20px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Box
            component="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              color: "inherit",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Back to top ↑
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default Footer;
