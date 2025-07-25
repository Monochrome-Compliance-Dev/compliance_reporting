import {
  Box,
  Typography,
  Paper,
  useTheme,
  Divider,
  CardMedia,
} from "@mui/material";
import { Link } from "react-router";

export default function PartnerModernSlavery() {
  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: "100%", overflowX: "hidden" }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          mb: 4,
          minHeight: { xs: 180, sm: 220, md: 300 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url('/images/backgrounds/modern-slavery-hero.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            inset: 0,
            zIndex: 1,
          }}
        />
        <Box sx={{ zIndex: 2, px: 2, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              color: "#fff",
              mb: 2,
            }}
          >
            Modern Slavery Compliance — Done For You
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#fff", maxWidth: 800, mx: "auto" }}
          >
            A simple, partner-ready solution for automating Modern Slavery
            Statements and compliance.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" gutterBottom>
          What is it?
        </Typography>
        <Typography variant="body2" paragraph>
          Our Modern Slavery solution streamlines the preparation, review, and
          submission of required statements — without manual spreadsheets or
          legal consultants. Designed to meet Australian regulatory
          requirements, it includes task assignment, evidence logging, and
          templated statement generation.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
          Key Features
        </Typography>
        <ul>
          <li>
            <Typography variant="body2">
              Templated, editable statement generator
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Track suppliers and risks across reporting periods
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Audit trail logging and task assignment
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Export-ready board summaries
            </Typography>
          </li>
        </ul>

        <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
          Who is it for?
        </Typography>
        <Typography variant="body2" paragraph>
          Compliance officers, ESG leads, procurement consultants, and external
          advisors who want a fast, repeatable solution.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
          Partner Benefits
        </Typography>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Built for Resale
          </Typography>
          <Typography variant="body2">
            White-label ready with your logo and branding on all client-facing
            portals and exports. No infrastructure needed — just onboard your
            clients and go.
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Attractive Margins
          </Typography>
          <Typography variant="body2">
            Resell the solution directly, embed it into your managed services,
            or refer it and earn. Partner tiers available.
          </Typography>
        </Paper>

        <Box textAlign="center" sx={{ mt: 5 }}>
          <Link to="/partners" style={{ textDecoration: "none" }}>
            <Paper
              elevation={3}
              sx={{
                display: "inline-block",
                px: 4,
                py: 1.5,
                backgroundColor: theme.palette.secondary.main,
                color: "#fff",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.light,
                },
              }}
            >
              Back to Partner Hub
            </Paper>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
