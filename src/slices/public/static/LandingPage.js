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
  Link as MuiLink,
  Button,
} from "@mui/material";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";
import DescriptionIcon from "@mui/icons-material/Description";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Link as RouterLink } from "react-router";

export function LandingPage() {
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
          Monochrome Compliance helps organisations meet their Payment Times
          Reporting obligations with confidence. We take messy source data,
          calculate the required metrics correctly, and deliver a
          submission-ready report with a clear audit trail — without adding
          internal burden.
        </Typography>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Card
            elevation={0}
            sx={{
              maxWidth: 720,
              width: "100%",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Industry focus
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
                Construction
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Progress claims, certification, retentions and SOPA-driven
                timing can distort PTRS outcomes. We help construction reporting
                entities align their workflows and submissions.
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="text"
                  component={RouterLink}
                  to="/construction-payment-reporting"
                  sx={{ fontWeight: 700 }}
                >
                  Construction PTRS
                </Button>
                <Button
                  variant="text"
                  component={RouterLink}
                  to="/insights"
                  sx={{ fontWeight: 700 }}
                >
                  Read the latest insight
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Typography
          variant="body2"
          textAlign="center"
          sx={{ mt: 1, opacity: 0.85 }}
        >
          Pricing is typically <strong>$7,000 per reporting period</strong>.{" "}
          <Button
            variant="text"
            component={RouterLink}
            to="/pricing"
            sx={{ fontWeight: 700, ml: 0.5, minWidth: "auto", p: 0.5 }}
          >
            View pricing
          </Button>
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          What You Get
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          Everything you need to meet Payment Times Reporting requirements —
          handled end to end.
        </Typography>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          {[
            {
              title: "Clean, reliable data",
              description:
                "We consolidate and validate your source exports into a consistent dataset you can rely on.",
              to: "/payment-times-reporting",
            },
            {
              title: "Correct metrics",
              description:
                "Payment times are calculated correctly, reviewed, and explained clearly.",
              to: "/payment-times-reporting",
            },
            {
              title: "Board-ready reporting",
              description:
                "Submission-ready outputs with an audit trail you can stand behind.",
              to: "/payment-times-reporting",
            },
          ].map((card, index) => (
            <Grid
              key={index}
              size={{ xs: 12, sm: 8, md: 4 }}
              sx={{ display: "flex" }}
            >
              <Box sx={{ width: "100%" }}>
                <RouterLink to={card.to} style={{ textDecoration: "none" }}>
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
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2">{card.description}</Typography>
                  </Paper>
                </RouterLink>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Divider />
      <Box textAlign="center" sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Let us take Payment Times Reporting off your plate
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          A short conversation is usually all it takes to see whether we can
          help.
        </Typography>
        <Box>
          <RouterLink to="/contact" style={{ textDecoration: "none" }}>
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
              Talk to us
            </Paper>
          </RouterLink>
        </Box>
      </Box>
    </Box>
  );
}
