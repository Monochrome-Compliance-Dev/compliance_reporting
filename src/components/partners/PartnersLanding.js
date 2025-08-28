import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  Divider,
  CardMedia,
  Card,
  CardContent,
  Button,
} from "@mui/material";
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
          backgroundImage: `url('/images/partners/handshake.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: theme.palette.grey[900],
            opacity: 0.65,
            inset: 0,
            zIndex: 1,
          }}
        />
        <Box sx={{ zIndex: 2, px: theme.spacing(2), textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              color: theme.palette.common.white,
              mb: 2,
            }}
          >
            Partner With Monochrome Compliance
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.common.white,
              maxWidth: 800,
              mx: "auto",
            }}
          >
            White-label ready compliance products. Built for consultants,
            advisors, and digital resellers.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          px: {
            xs: theme.spacing(2),
            sm: theme.spacing(4),
            md: theme.spacing(8),
          },
          py: theme.spacing(4),
        }}
      >
        <Typography variant="h6" textAlign="center" gutterBottom>
          Why Partner With Us?
        </Typography>
        <Grid container spacing={2}>
          {[
            {
              label: "White-Label Ready",
              text: "Custom branding available on all client-facing portals, reports, and emails.",
              image: "/images/partners/report.jpg",
            },
            {
              label: "Simple Onboarding",
              text: "Clients can be live in under 48 hours with full support during setup.",
              image: "/images/partners/onboarding.jpg",
            },
            {
              label: "Attractive Margins",
              text: "Earn up to 20% margins on every product subscription sold.",
              image: "/images/partners/profit.jpg",
            },
            {
              label: "Ongoing Support",
              text: "We handle the backend, updates, and regulatory monitoring. You stay client-facing.",
              image: "/images/partners/support.jpg",
            },
          ].map((layer, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardMedia
                  component="img"
                  height="230"
                  image={layer.image}
                  alt={layer.label}
                  sx={{ mb: 2, borderRadius: theme.shape.borderRadius }}
                  loading="lazy"
                />
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {layer.label}
                  </Typography>
                  <Typography variant="body2">{layer.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider />

      <Box
        textAlign="center"
        sx={{
          px: {
            xs: theme.spacing(2),
            sm: theme.spacing(4),
            md: theme.spacing(8),
          },
          py: theme.spacing(4),
        }}
      >
        <Typography variant="h6" gutterBottom>
          Ready to Explore a Partnership?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Book a short call and discover how Monochrome Compliance can power
          your client offerings.
        </Typography>
        <Box>
          <Link to="/contact" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              color="primary"
              sx={{
                px: theme.spacing(4),
                py: theme.spacing(1.5),
                fontWeight: 600,
                borderRadius: theme.shape.borderRadius,
                textTransform: "none",
              }}
            >
              Book a Partner Call
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
