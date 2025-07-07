import {
  Typography,
  Box,
  Button,
  Grid,
  Container,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import Security from "@mui/icons-material/Security";
import AccessTime from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SendIcon from "@mui/icons-material/Send";

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const features = [
    {
      title: "Find out if you need to report",
      description:
        "Just enter a few details — no login needed. We'll instantly tell you if PTR applies to you.",
      iconComponent: QuestionMarkIcon,
      buttonLink: "/compliance-navigator",
    },
    {
      title: "Step-by-step help to complete your report",
      description:
        "We break the PTR process down into simple steps so you’re never left wondering what’s next.",
      iconComponent: FormatListNumberedIcon,
      buttonLink: "/overview",
    },
    {
      title: "Talk to real people if you get stuck",
      description: "Need help? Our compliance experts are just a click away.",
      iconComponent: SupportAgentIcon,
      buttonLink: "/booking",
    },
  ];

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default }}>
      {/* Hero Banner */}
      <Box
        sx={{
          backgroundImage: `url(/images/backgrounds/monochromatic%20squares.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: isSmallScreen ? 240 : 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: isSmallScreen ? 4 : 6,
          textAlign: "center",
          px: isSmallScreen ? 2 : 6,
        }}
      >
        <Box>
          <Typography
            variant={isSmallScreen ? "h6" : "h3"}
            sx={{
              color: "#fff",
              fontWeight: "bold",
              lineHeight: 1.2,
            }}
          >
            Handle your Payment Times Reporting
          </Typography>
          <Typography
            variant={isSmallScreen ? "h6" : "h3"}
            sx={{
              color: "#fff",
              fontWeight: "bold",
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            obligations with confidence
          </Typography>
          <Typography
            variant={isSmallScreen ? "body1" : "h6"}
            sx={{
              color: "#fff",
              mb: 2,
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: isSmallScreen ? 320 : "100%",
              mx: "auto",
            }}
          >
            We'll walk you through the new requirements and help you complete
            your submission step-by-step.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ bgcolor: theme.palette.primary.main, py: 2 }}>
        <Container>
          <Box
            sx={{
              textAlign: "center",
              maxWidth: theme.breakpoints.values.md,
              mx: "auto",
              mb: 1,
            }}
          >
            <Typography
              variant={isSmallScreen ? "h6" : "h5"}
              sx={{ color: theme.palette.text.primary }}
            >
              PTR compliance doesn’t have to be overwhelming. Here’s how we make
              it easier.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ maxWidth: theme.breakpoints.values.md, mx: "auto" }}>
                  <Card
                    onClick={() => navigate(feature.buttonLink)}
                    sx={{
                      display: "flex",
                      flexDirection: index % 2 === 1 ? "row-reverse" : "row",
                      alignItems: "center",
                      px: isSmallScreen ? 2 : 4,
                      py: isSmallScreen ? 2 : 3,
                      cursor: "pointer",
                      transition: "box-shadow 0.3s",
                      "&:hover": {
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        p: 0,
                      }}
                    >
                      <feature.iconComponent
                        sx={{
                          fontSize: isSmallScreen ? 50 : 80,
                          mx: 2,
                          color: theme.palette.primary.secondary,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ color: theme.palette.text.primary }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          py: 6,
          bgcolor: theme.palette.secondary.main,
          textAlign: "center",
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant={isSmallScreen ? "h5" : "h4"} gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <SearchIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              1. Check Your Obligation
            </Typography>
            <Typography variant="body2">
              Use our Navigator to confirm if PTR applies to you.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FileDownloadIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              2. Upload Your Data
            </Typography>
            <Typography variant="body2">
              Download our CSV template to compile your payments data.
              Integrations with Xero and JDE are coming soon.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <SendIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              3. Submit to Regulator
            </Typography>
            <Typography variant="body2">
              Generate a complete submission file for the regulator’s portal.
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          py: 6,
          bgcolor: theme.palette.secondary.main,
          textAlign: "center",
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Why Choose Monochrome Compliance?
        </Typography>
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Security sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1">Your data is secure</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <AccessTime sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1">Save hours of work</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <SupportAgentIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1">Local expert support</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* CTA */}
      <Box sx={{ py: 6, textAlign: "center", px: 2 }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{ mb: 4, color: theme.palette.text.primary }}
        >
          Get clarity in minutes — start now
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/compliance-navigator")}
          sx={{ width: isSmallScreen ? "100%" : "auto" }}
        >
          Launch the Compliance Navigator
        </Button>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: theme.palette.text.secondary }}
        >
          No login. No risk. Just clear answers.
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center", px: 2 }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{ mb: 4, color: theme.palette.text.primary }}
        >
          Ready to simplify your compliance?
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/contact")}
          sx={{ width: isSmallScreen ? "100%" : "auto" }}
        >
          Join the Waitlist
        </Button>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: theme.palette.text.secondary }}
        >
          We are currently in beta. Join our waitlist to be notified when we
          launch.
        </Typography>
      </Box>
    </Box>
  );
}
