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
import PageMeta from "shared/ui/PageMeta";

export function LandingPage() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Payment Data & Compliance Solutions"
        description="Payment data, compliance, and reporting solutions for organisations operating in complex environments, including Payment Times Reporting (PTRS). Strengthen reporting, controls, and evidence trails from the underlying dataset up."
        url="https://monochrome-compliance.com/"
        image="/images/brand/hero3.jpg"
      />
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
              Payment data • Compliance clarity
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
              Clarity and control over how you
              <br />
              actually pay suppliers.
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
              We make payment behaviour visible — so you can identify
              late-payment patterns early, take action, and keep reporting
              outcomes where they should be.
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
              Curious how your payment data behaves under these frameworks?
              We’re always happy to review a small sample dataset.{" "}
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
            Monochrome Compliance helps organisations understand and improve
            payment behaviour by strengthening the underlying dataset first. We
            then align reporting outcomes, controls, and evidence trails around
            it — without adding internal burden.
          </Typography>
          <Typography
            variant="body2"
            textAlign="center"
            sx={{ mb: 3, fontWeight: 600 }}
          >
            Trusted to support analysis and reporting across more than $2
            billion in supplier payments.
          </Typography>
          <Box sx={{ mt: theme.spacing(4) }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "center",
              }}
            >
              {[
                {
                  title: "Services",
                  image: "/images/services/payment-times-reporting.jpg",
                  alt: "Payment Times Reporting",
                  description:
                    "Practical delivery across payment behaviour analysis, Payment Times Reporting, and targeted payment health checks.",
                  to: "/services",
                  buttonText: "View services",
                },
                {
                  title: "Industries",
                  image: "/images/industries/construction.jpg",
                  alt: "Construction",
                  description:
                    "Starting with construction — where payment mechanics and reporting pressure collide.",
                  to: "/industries",
                  buttonText: "Explore industries",
                },
                {
                  title: "Insights",
                  image: "/images/insights/insights.jpg",
                  alt: "Insights",
                  description:
                    "Research and practical observations on payment visibility, data quality, compliance interpretation, and reporting.",
                  to: "/insights",
                  buttonText: "Read insights",
                },
              ].map((card, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: { xs: "1 1 100%", md: "1 1 calc(33.333% - 12px)" },
                    maxWidth: { xs: "100%", md: "calc(33.333% - 12px)" },
                    minWidth: 0,
                    display: "flex",
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: theme.spacing(3),
                      height: "100%",
                      width: "100%",
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Box
                      component="img"
                      src={card.image}
                      alt={card.alt}
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
                      {card.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                      sx={{ lineHeight: 1.7, mb: theme.spacing(2) }}
                    >
                      {card.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to={card.to}
                    >
                      {card.buttonText}
                    </Button>
                  </Paper>
                </Box>
              ))}
            </Box>
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
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
            }}
          >
            {[
              {
                title: "Strengthen the dataset",
                description:
                  "We consolidate, validate and structure your source exports into a consistent payment dataset.",
                to: "/services/payment-times-reporting",
              },
              {
                title: "Identify what’s driving late payments",
                description:
                  "We surface patterns in your payment data that are dragging performance down — before they show up in reporting outcomes.",
                to: "/services/payment-times-reporting",
              },
              {
                title: "Audit-ready outputs",
                description:
                  "Clear outputs with traceable evidence — suitable for boards, auditors and regulators.",
                to: "/services/payment-times-reporting",
              },
            ].map((card, index) => (
              <Box
                key={index}
                sx={{
                  flex: { xs: "1 1 100%", md: "1 1 calc(33.333% - 16px)" },
                  maxWidth: { xs: "100%", md: "calc(33.333% - 16px)" },
                  minWidth: 0,
                  display: "flex",
                }}
              >
                <RouterLink
                  to={card.to}
                  style={{ textDecoration: "none", width: "100%" }}
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
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2">{card.description}</Typography>
                  </Paper>
                </RouterLink>
              </Box>
            ))}
          </Box>
        </Box>
        <Divider />
        <Box textAlign="center" sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Get ahead of your payment performance before reporting becomes the
            issue
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
    </>
  );
}
