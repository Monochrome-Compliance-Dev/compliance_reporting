import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router";

const pricingOptions = [
  {
    title: "Payment Times Reporting",
    price: "$7,500",
    cadence: "per submission",
    description:
      "End-to-end support to prepare an accurate, defensible Payment Times Report without turning the submission into a major internal project.",
    inclusions: [
      "Review and preparation of source payment data",
      "Data validation and issue identification",
      "Payment timing and reporting calculations",
      "Review of material anomalies and outliers",
      "Preparation of submission-ready outputs",
      "Clear explanation of the reporting result",
    ],
    cta: "Talk to us about your submission",
    to: "/contact",
  },
  {
    title: "Payment Behaviour Monitoring",
    price: "$1,500",
    cadence: "per month",
    description:
      "Ongoing visibility of payment behaviour and reporting readiness while there is still time to act.",
    inclusions: [
      "Monthly payment behaviour analysis",
      "Tracking of key payment performance measures",
      "Identification of emerging operational issues",
      "Monitoring of reporting readiness",
      "Practical recommendations where action is needed",
      "Payment Times Reporting submission included",
    ],
    cta: "Discuss ongoing monitoring",
    to: "/contact",
    featured: true,
  },
];

export function PricingPage() {
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
          minHeight: { xs: 220, sm: 280, md: 340 },
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
              "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.58) 55%, rgba(0,0,0,0.28) 100%)",
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            ...sectionSx,
            px: { xs: 3, md: 8 },
            py: { xs: 5, md: 7 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              maxWidth: 850,
              color: theme.palette.common.white,
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Straightforward support for Payment Times Reporting.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              maxWidth: 780,
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.6,
            }}
          >
            Choose submission support when you need help completing your report,
            or ongoing monitoring when you want visibility while there is still
            time to improve the outcome.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          sx={{
            fontWeight: 800,
            mb: 1,
          }}
        >
          Two simple options
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color={theme.palette.text.secondary}
          sx={{
            maxWidth: 760,
            mx: "auto",
            lineHeight: 1.7,
            mb: 5,
          }}
        >
          Whether you simply need help preparing your next submission or want
          ongoing insight into your payment behaviour, we have a service that
          fits.
        </Typography>

        <Grid container spacing={3}>
          {pricingOptions.map((option) => (
            <Grid key={option.title} size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: `1px solid ${
                    option.featured
                      ? theme.palette.primary.main
                      : theme.palette.divider
                  }`,
                  borderWidth: option.featured ? 2 : 1,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <CardContent
                  sx={{
                    p: 4,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {option.featured && (
                    <Typography
                      variant="overline"
                      sx={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        mb: 2,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontWeight: 800,
                        letterSpacing: 1,
                      }}
                    >
                      Best value
                    </Typography>
                  )}

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                    }}
                  >
                    {option.title}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      component="span"
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {option.price}
                    </Typography>

                    <Typography
                      component="span"
                      variant="body1"
                      color={theme.palette.text.secondary}
                      sx={{ ml: 1 }}
                    >
                      {option.cadence}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                    sx={{
                      lineHeight: 1.7,
                      mb: 3,
                    }}
                  >
                    {option.description}
                  </Typography>

                  <Divider sx={{ mb: 3 }} />

                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                    }}
                  >
                    Included
                  </Typography>

                  <Box
                    component="ul"
                    sx={{
                      mt: 0,
                      mb: 4,
                      pl: 3,
                      color: theme.palette.text.secondary,
                      "& li": {
                        mb: 1.25,
                      },
                    }}
                  >
                    {option.inclusions.map((inclusion) => (
                      <Box component="li" key={inclusion}>
                        <Typography
                          variant="body2"
                          color={theme.palette.text.secondary}
                        >
                          {inclusion}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant={option.featured ? "contained" : "outlined"}
                    component={RouterLink}
                    to={option.to}
                    sx={{
                      mt: "auto",
                      alignSelf: "flex-start",
                      fontWeight: 700,
                    }}
                  >
                    {option.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider />

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          sx={{
            fontWeight: 800,
            mb: 1,
          }}
        >
          Which option is right for you?
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color={theme.palette.text.secondary}
          sx={{
            maxWidth: 760,
            mx: "auto",
            lineHeight: 1.7,
            mb: 5,
          }}
        >
          Some organisations only need help every six months. Others want
          confidence throughout the reporting period. Both approaches deliver an
          accurate Payment Times Report — the difference is when you gain
          visibility.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Submission Support
                </Typography>

                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: 3 }}
                >
                  Ideal if you already have your payment data and simply want an
                  experienced partner to prepare a complete, accurate and
                  defensible Payment Times Report.
                </Typography>

                <Box
                  component="ul"
                  sx={{
                    pl: 3,
                    mb: 0,
                    "& li": { mb: 1.25 },
                  }}
                >
                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      One engagement every reporting period
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      We prepare the report from your payment data
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Clear explanation of the reported outcome
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Submission-ready outputs
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: `2px solid ${theme.palette.primary.main}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Ongoing Monitoring
                </Typography>

                <Typography
                  variant="body1"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1.7, mb: 3 }}
                >
                  Designed for organisations that want to understand payment
                  behaviour throughout the reporting period so there are fewer
                  surprises when reporting time arrives.
                </Typography>

                <Box
                  component="ul"
                  sx={{
                    pl: 3,
                    mb: 0,
                    "& li": { mb: 1.25 },
                  }}
                >
                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Monthly payment behaviour analysis
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Early identification of emerging issues
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Practical recommendations before the period closes
                    </Typography>
                  </Box>

                  <Box component="li">
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                    >
                      Payment Times Report preparation included
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 8 },
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 2,
          }}
        >
          Ready to make your next Payment Times Report easier?
        </Typography>

        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          sx={{
            maxWidth: 760,
            mx: "auto",
            lineHeight: 1.7,
            mb: 4,
          }}
        >
          Whether you need help with your next submission or want ongoing
          visibility into your payment behaviour, we'd be happy to talk through
          your situation and recommend the most suitable approach.
        </Typography>

        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/contact"
          sx={{
            px: 5,
            fontWeight: 700,
          }}
        >
          Talk to us
        </Button>
      </Box>
    </Box>
  );
}
