import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  Divider,
  CardMedia,
  Card,
  CardContent,
} from "@mui/material";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";
import DescriptionIcon from "@mui/icons-material/Description";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Link } from "react-router";

export default function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // mt: 6,
        // px: { xs: 2, sm: 3, md: 4 },
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      {/* <Box
        component="img"
        src="/images/backgrounds/Expect zebras 1200x1200 px.png"
        alt="Expect zebras"
        loading="lazy"
        sx={{
          width: { xs: 450, md: 475 },
          height: "100%",
          objectFit: "cover",
          borderRadius: 2,
          display: "block",
          maxWidth: "100%",
        }}
      /> */}
      <Box
        sx={{
          position: "relative",
          // borderRadius: 2,
          overflow: "hidden",
          mb: 4,
          minHeight: { xs: 180, sm: 220, md: 300 },
          display: "flex",
          alignItems: "center",
          justifyContent: "left",
          backgroundImage: `url('/images/backgrounds/compliance-solution.jpg')`,
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
            display: "flex",
            alignItems: "center",
            inset: 0,
            zIndex: 1,
          }}
        />
        <Box sx={{ width: "100%" }}>
          <Typography
            variant="h4"
            textAlign="center"
            gutterBottom
            sx={{
              fontSize: { xs: "1.25rem", sm: "2rem", md: "2.25rem" },
              position: "relative",
              zIndex: 2,
              fontWeight: 700,
              color: "#fff",
              px: 2,
            }}
          >
            Board-ready compliance
            <br />
            without the internal burden.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
          Monochrome Compliance delivers Compliance-as-a-Service (CaaS) — a
          bundled, fully-managed solution that handles your reporting,
          disclosures, and registers end-to-end. No tools to configure. No
          consultants. No nasty surprises.
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          The Layers of Monochrome Compliance-as-a-Service
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          Our service isn’t just software. It’s a full stack of compliance
          infrastructure.
        </Typography>
        <Grid container spacing={2}>
          {[
            {
              label: "Expertise",
              text: "Our team identifies obligations and maintains up-to-date obligations across industries.",
              image: "/images/landing-page/expertise-compliance.jpg",
            },
            {
              label: "Templates",
              text: "Prebuilt forms, registers, workflows, and reporting formats ready to use.",
              image: "/images/landing-page/templates.jpg",
            },
            {
              label: "Scheduling",
              text: "Built-in calendars, deadlines, and reminders to keep everything on track.",
              image: "/images/landing-page/scheduling.jpg",
            },
            {
              label: "Oversight",
              text: "Everything reviewed, logged, and archived for when regulators come knocking.",
              image: "/images/landing-page/secure-audit.jpg",
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
                  sx={{ mb: 2, borderRadius: 1 }}
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
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          What’s Included
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          Every Monochrome Compliance subscription includes the critical
          obligations covered below — managed, monitored, and delivered on time.
        </Typography>
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
                      loading="lazy"
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
      </Box>
      <Divider />
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          Work With Us
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          Monochrome Compliance partners with consultants, advisors, and digital
          service providers to deliver Compliance-as-a-Service at scale.
        </Typography>
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
              title: "White-label ready",
              description:
                "Custom-branded reports, dashboards, and portals with your client front and centre.",
              image: "/images/partners/report.jpg",
            },
            {
              title: "Fast onboarding",
              description:
                "Your clients can be live in under 48 hours — no dev team required.",
              image: "/images/partners/onboarding.jpg",
            },
            {
              title: "Attractive margins",
              description:
                "Earn ongoing revenue with every active product subscription.",
              image: "/images/partners/profit.jpg",
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
                {card.image && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={card.image}
                    alt={`${card.title} image`}
                    sx={{ mb: 1, borderRadius: 1 }}
                    loading="lazy"
                  />
                )}
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2">{card.description}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Link to="/partners" style={{ textDecoration: "none" }}>
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
              Learn About Partnerships
            </Paper>
          </Link>
        </Box>
      </Box>
      <Divider />
      <Box textAlign="center" sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Let Us Handle Compliance for You
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Book a quick call and we’ll walk you through how Monochrome Compliance
          can take compliance off your plate.
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
              Book a CaaS Intro Call
            </Paper>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
