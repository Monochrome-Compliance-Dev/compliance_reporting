import { Box, Typography, Paper, Grid, useTheme, Divider } from "@mui/material";
import { Link } from "react-router";

export default function PartnersLanding() {
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
          backgroundImage: `url('/images/backgrounds/partner-hero.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.65)",
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
            Partner With Monochrome Compliance
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#fff", maxWidth: 800, mx: "auto" }}
          >
            White-label ready compliance products. Built for consultants,
            advisors, and digital resellers.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          Why Partner With Us?
        </Typography>
        <Grid container spacing={2}>
          {[
            {
              label: "White-Label Ready",
              text: "Custom branding available on all client-facing portals, reports, and emails.",
            },
            {
              label: "Simple Onboarding",
              text: "Clients can be live in under 48 hours with full support during setup.",
            },
            {
              label: "Attractive Margins",
              text: "Earn up to 40% margins on every product subscription sold.",
            },
            {
              label: "Ongoing Support",
              text: "We handle the backend, updates, and regulatory monitoring. You stay client-facing.",
            },
          ].map((item, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Typography variant="subtitle1" gutterBottom>
                  {item.label}
                </Typography>
                <Typography variant="body2">{item.text}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider />

      <Box textAlign="center" sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ready to Explore a Partnership?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Book a short call and discover how Monochrome Compliance can power
          your client offerings.
        </Typography>
        <Box>
          <Link to="/contact" style={{ textDecoration: "none" }}>
            <Paper
              elevation={3}
              sx={{
                display: "inline-block",
                px: 4,
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                color: "#fff",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: theme.palette.primary.light,
                },
              }}
            >
              Book a Partner Call
            </Paper>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
