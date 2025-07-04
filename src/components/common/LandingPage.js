import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  Divider,
  Container,
  CardMedia,
} from "@mui/material";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";
import DescriptionIcon from "@mui/icons-material/Description";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Contact from "./Contact";
import { Link } from "react-router";

export default function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mt: 6,
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <Typography
        variant="h4"
        textAlign="center"
        gutterBottom
        sx={{ fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" } }}
      >
        Simplifying Compliance for Australian Companies
      </Typography>
      {/* 
      <Box
        sx={{
          position: "relative",
          height: 240,
          backgroundImage:
            "url('/images/backgrounds/right-zebra-crossing.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          my: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          px: 4,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            p: 2,
            maxWidth: "60%",
            borderRadius: 1,
          }}
        >
          Monochrome helps you meet key obligations like Payment Times
          Reporting, Modern Slavery statements, and Director Disclosures —
          without spreadsheets, manual follow-ups, or legal headaches.
        </Typography>
      </Box>
      */}
      <Container maxWidth="sm">
        <Typography variant="body1" textAlign="center" sx={{ mb: 4 }}>
          Monochrome helps you meet key obligations like Payment Times
          Reporting, Modern Slavery statements, and Director Disclosures —
          without spreadsheets, manual follow-ups, or legal headaches.
        </Typography>
      </Container>
      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          gap: 2,
          scrollSnapType: "x mandatory",
          px: 2,
          pb: 2,
        }}
      >
        {[
          {
            title: "Modern Slavery Reporting",
            description:
              "Templated risk assessments, due diligence logs and registry-ready reports. Simplified.",
            icon: (
              <DescriptionIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/modern-slavery",
            image: "/images/solutions/ms/modern-slavery.jpg",
          },
          {
            title: "Director Disclosures",
            description:
              "Track declarations, manage conflicts, and automate board attestation cycles.",
            icon: (
              <VerifiedUserIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/director-obligations",
            image: "/images/solutions/do/director.jpg",
          },
          {
            title: "Whistleblower Compliance",
            description:
              "Provide a simple, secure intake and triage experience — without the overpriced platforms.",
            icon: (
              <RocketLaunchIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/whistleblower-compliance",
            image: "/images/solutions/wb/whistleblower.jpg",
          },
          {
            title: "Risk Register as a Service",
            description:
              "Keep your risks up-to-date with a guided register, library of controls, and review reminders.",
            icon: (
              <DomainVerificationIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/risk-register",
            image: "/images/solutions/rr/Risks.jpg",
          },
          {
            title: "Payment Times Reporting",
            description:
              "Streamline compliance with timely and accurate payment times reports.",
            icon: (
              <DescriptionIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/payment-times-reporting",
            image: "/images/solutions/ptrs/Payment-times-reporting.jpg",
          },
          {
            title: "ESG Reporting",
            description:
              "Comprehensive ESG reporting tools to meet regulatory and stakeholder expectations.",
            icon: (
              <VerifiedUserIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/esg-reporting",
            image: "/images/solutions/esg/ESG-reporting.jpg",
          },
          {
            title: "Working Capital",
            description:
              "Manage your working capital obligations with ease and accuracy.",
            icon: (
              <RocketLaunchIcon
                sx={{ fontSize: 36, color: theme.palette.primary.main }}
              />
            ),
            to: "/working-capital",
            image: "/images/solutions/wc/Working-Capital.jpg",
          },
        ].map((card, index) => (
          <Box
            key={index}
            sx={{
              minWidth: 280,
              maxWidth: 300,
              flexShrink: 0,
              scrollSnapAlign: "start",
            }}
          >
            <Link to={card.to} style={{ textDecoration: "none" }}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                {(!card.image || card.image === "") && (
                  <Box sx={{ mb: 1 }}>{card.icon}</Box>
                )}
                {card.image && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={card.image}
                    alt={`${card.title} image`}
                    sx={{ mb: 1, borderRadius: 1 }}
                  />
                )}
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2">{card.description}</Typography>
              </Paper>
            </Link>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 5 }} />
      <Box textAlign="center" sx={{ mb: 5 }}>
        <Typography variant="body1">
          Not sure what applies to your business? Book a quick call — we'll walk
          you through it.
        </Typography>
      </Box>
      <Contact />
    </Box>
  );
}
