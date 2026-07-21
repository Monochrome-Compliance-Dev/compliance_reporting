import {
  Box,
  Typography,
  Grid,
  Card,
  useTheme,
  Divider,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router";

export function LandingPage() {
  const theme = useTheme();

  const contentMaxWidth = 1100;
  const sectionSx = {
    maxWidth: contentMaxWidth,
    mx: "auto",
  };

  return (
    <Box
      sx={{
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
            ...sectionSx,
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
            Payment Times Reporting
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
            Understand your reporting position before the period closes.
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
            We help reporting entities understand their payment behaviour,
            identify emerging issues and prepare accurate Payment Times Reports
            before the results are locked in.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              component={RouterLink}
              to="/payment-times-reporting"
              sx={{ fontWeight: 800 }}
            >
              Explore Payment Times Reporting
            </Button>

            <Button
              variant="outlined"
              component={RouterLink}
              to="/pricing"
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
              View pricing
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Typography variant="h6" textAlign="center" sx={{ mt: 4, mb: 3 }}>
          Two ways we can help
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
            <Card
              variant="outlined"
              sx={{
                width: "100%",
                p: { xs: 2.5, md: 3 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
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
                  height: { xs: 170, md: 190 },
                  objectFit: "cover",
                  borderRadius: 2,
                  mb: theme.spacing(2),
                }}
              />

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Payment Times Reporting
              </Typography>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
              >
                End-to-end support to prepare an accurate, defensible Payment
                Times Report without turning it into a major internal project.
              </Typography>

              <Button
                sx={{
                  mt: "auto",
                  alignSelf: "flex-start",
                }}
                variant="outlined"
                component={RouterLink}
                to="/payment-times-reporting"
              >
                Explore Payment Times Reporting
              </Button>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
            <Card
              variant="outlined"
              sx={{
                width: "100%",
                p: { xs: 2.5, md: 3 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Box
                component="img"
                src="/images/insights/insights2.jpg"
                alt="Payment Behaviour Monitoring"
                loading="lazy"
                sx={{
                  width: "100%",
                  height: { xs: 170, md: 190 },
                  objectFit: "cover",
                  borderRadius: 2,
                  mb: theme.spacing(2),
                }}
              />

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Payment Behaviour Monitoring
              </Typography>

              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
              >
                Monthly visibility of payment behaviour, emerging risks and
                reporting readiness while there is still time to act.
              </Typography>

              <Button
                sx={{
                  mt: "auto",
                  alignSelf: "flex-start",
                }}
                variant="outlined"
                component={RouterLink}
                to="/pricing"
              >
                View pricing
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 2, sm: 4, md: 6 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Card
          variant="outlined"
          sx={{
            p: { xs: 3, md: 4 },
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box sx={{ maxWidth: 760 }}>
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 800,
                letterSpacing: 1.4,
              }}
            >
              Explore the public register
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 1 }}>
              See how reporting entities are paying small businesses
            </Typography>

            <Typography
              variant="body2"
              color={theme.palette.text.secondary}
              sx={{ lineHeight: 1.7 }}
            >
              Search thousands of Payment Times Reports, compare results within
              each industry division and review payment performance trends over
              time.
            </Typography>
          </Box>

          <Button
            variant="contained"
            component={RouterLink}
            to="/regulator-payment-times"
            sx={{
              flexShrink: 0,
              px: 3,
              fontWeight: 800,
            }}
          >
            Explore the register
          </Button>
        </Card>
      </Box>

      <Divider />

      <Box sx={{ ...sectionSx, px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <Typography variant="h6" textAlign="center" gutterBottom>
          The reporting result is only the end of the story
        </Typography>

        <Typography variant="body2" textAlign="center" sx={{ mb: 4 }}>
          Payment Times Reporting is shaped by everyday operational choices. We
          help you understand which of those choices are actually driving the
          result.
        </Typography>

        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          {[
            {
              title: "SOPA does not equal PTRS",
              description:
                "Construction payment rules and Payment Times Reporting obligations measure different things and need to be treated separately.",
              to: "/insights",
            },
            {
              title: "Weekly payment runs",
              description:
                "A routine payment schedule can create avoidable delays that materially affect reported payment performance.",
              to: "/insights",
            },
            {
              title: "Why P95 problems are rarely random",
              description:
                "Poor tail performance is usually concentrated around a small number of operational causes that can be identified and addressed.",
              to: "/insights",
            },
          ].map((card) => (
            <Grid
              key={card.title}
              size={{ xs: 12, sm: 8, md: 4 }}
              sx={{ display: "flex" }}
            >
              <Box sx={{ ...sectionSx, width: "100%" }}>
                <RouterLink to={card.to} style={{ textDecoration: "none" }}>
                  <Card
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
                  </Card>
                </RouterLink>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider />

      <Box
        textAlign="center"
        sx={{ ...sectionSx, px: { xs: 2, sm: 4, md: 8 }, py: 4 }}
      >
        <Typography variant="h6" gutterBottom>
          Know where you stand before the reporting period closes
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Whether you need help preparing your next submission or ongoing
          visibility into payment behaviour, we’re happy to talk through your
          situation.
        </Typography>

        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/contact"
          sx={{
            px: 4,
            fontWeight: 700,
          }}
        >
          Talk to us
        </Button>
      </Box>
    </Box>
  );
}
