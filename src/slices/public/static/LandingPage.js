import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  Divider,
  Button,
} from "@mui/material";
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
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          mb: 4,
          minHeight: { xs: 220, sm: 280, md: 360 },
          display: "flex",
          alignItems: "center",
          backgroundImage: `url('/images/brand/hero3.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 100%)",
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            px: { xs: 2, sm: 4, md: 8 },
            py: { xs: 4, sm: 5, md: 6 },
            maxWidth: 1200,
            mx: "auto",
          }}
        >
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 1.6,
              opacity: 0.9,
              color: theme.palette.common.white,
              display: "block",
              mb: 1,
            }}
          >
            Payment data • Reporting clarity
          </Typography>

          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontSize: { xs: "1.55rem", sm: "2.2rem", md: "2.6rem" },
              fontWeight: 800,
              color: theme.palette.common.white,
              maxWidth: 900,
              lineHeight: 1.15,
            }}
          >
            Clarity in complex
            <br />
            payment environments.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.85)",
              maxWidth: 900,
              lineHeight: 1.7,
              mb: theme.spacing(3),
            }}
          >
            We strengthen the underlying payment dataset so reporting outcomes,
            controls and evidence trails hold up under scrutiny.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              component={RouterLink}
              to="/services"
              sx={{ fontWeight: 800 }}
            >
              View services
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/insights"
              sx={{
                fontWeight: 800,
                color: theme.palette.common.white,
                borderColor: "rgba(255,255,255,0.55)",
                "&:hover": {
                  borderColor: theme.palette.common.white,
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Read insights
            </Button>
          </Box>
          <Typography
            variant="body2"
            sx={{
              mt: theme.spacing(2),
              color: "rgba(255,255,255,0.78)",
              maxWidth: 900,
              lineHeight: 1.7,
            }}
          >
            Curious how your payment data behaves under these frameworks? We’re
            always happy to review a small sample dataset.{" "}
            <Button
              variant="text"
              component={RouterLink}
              to="/services"
              sx={{
                fontWeight: 800,
                color: theme.palette.common.white,
                p: 0,
                minWidth: "auto",
                textTransform: "none",
                verticalAlign: "baseline",
                "&:hover": { backgroundColor: "transparent", opacity: 0.9 },
              }}
            >
              See how it works
            </Button>
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
          Monochrome Compliance helps organisations meet payment reporting
          obligations and reduce risk by strengthening the underlying payment
          dataset. We work from payment data first, then align reporting,
          controls and evidence trails around it — without adding internal
          burden.
        </Typography>
        <Box sx={{ mt: theme.spacing(4) }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: theme.spacing(3),
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Box
                  component="img"
                  src="/images/services/payment-times-reporting.jpg"
                  alt="Payment Times Reporting"
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Services
                </Typography>
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  Practical delivery across Payment Times Reporting and payment
                  health checks.
                </Typography>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/services"
                >
                  View services
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: theme.spacing(3),
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Box
                  component="img"
                  src="/images/industries/construction.jpg"
                  alt="Construction"
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Industries
                </Typography>
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  Starting with construction — where payment mechanics and
                  reporting pressure collide.
                </Typography>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/industries"
                >
                  Explore industries
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: theme.spacing(3),
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Box
                  component="img"
                  src="/images/insights/insights.jpg"
                  alt="Insights"
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: theme.spacing(2),
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Insights
                </Typography>
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                >
                  Research and practical observations on payment visibility,
                  data quality and reporting interpretation.
                </Typography>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/insights"
                >
                  Read insights
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          How we help
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          We deliver practical outcomes — clean data, defensible logic and
          evidence trails you can stand behind.
        </Typography>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          {[
            {
              title: "Strengthen the dataset",
              description:
                "We consolidate, validate and structure your source exports into a consistent payment dataset.",
              to: "/payment-times-reporting",
            },
            {
              title: "Defensible logic",
              description:
                "Payment timing and classifications are calculated correctly, reviewed, and explained clearly.",
              to: "/payment-times-reporting",
            },
            {
              title: "Audit-ready outputs",
              description:
                "Clear outputs with traceable evidence — suitable for boards, auditors and regulators.",
              to: "/payment-times-reporting",
            },
          ].map((card, index) => (
            <Grid
              item
              key={index}
              xs={12}
              sm={8}
              md={4}
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
          Let us take payment reporting off your plate
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          A short conversation is usually all it takes to see whether a data
          review would be useful.
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
