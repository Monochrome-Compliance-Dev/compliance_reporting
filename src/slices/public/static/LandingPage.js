import { Box, Typography, Grid, Card, useTheme, Button } from "@mui/material";
import { Link as RouterLink } from "react-router";

export function LandingPage() {
  const theme = useTheme();

  const sectionSx = {
    width: "calc(100% - 32px)",
    maxWidth: 1440,
    mx: "auto",
  };

  const spacingSx = {
    section: {
      xs: 5,
      md: 5,
    },
    group: {
      xs: 3,
      md: 4,
    },
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
          mb: 0,
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
          pt: spacingSx.section,
          pb: spacingSx.section,
        }}
      >
        <Typography variant="h6" textAlign="center" sx={{ mb: 3 }}>
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
                  aspectRatio: "2.5 / 1",
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
                  aspectRatio: "2.5 / 1",
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
          pb: spacingSx.section,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            alignItems: "stretch",
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box
            component="img"
            src="/images/insights/insights.jpg"
            alt="Payment Times Reporting public register analysis"
            loading="lazy"
            sx={{
              width: "100%",
              height: { xs: 240, sm: 320, md: "100%" },
              minHeight: { md: 390 },
              objectFit: "cover",
            }}
          />

          <Box
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
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

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.75,
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              See how reporting entities are paying small businesses
            </Typography>

            <Typography
              variant="body1"
              color={theme.palette.text.secondary}
              sx={{
                lineHeight: 1.75,
                mb: theme.spacing(3),
              }}
            >
              Search thousands of Payment Times Reports, compare organisations
              within their industry and review payment performance trends over
              time.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                gap: 1.5,
              }}
            >
              <Button
                variant="contained"
                component={RouterLink}
                to="/regulator-payment-times"
                sx={{
                  px: 3,
                  fontWeight: 800,
                }}
              >
                Search companies
              </Button>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/regulator-payment-times/industries"
                sx={{
                  px: 3,
                  fontWeight: 800,
                }}
              >
                Explore industries
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 2, sm: 4, md: 6 },
          mb: spacingSx.section,
        }}
      >
        <Box sx={{ textAlign: "center", mb: theme.spacing(4) }}>
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 800,
              letterSpacing: 1.4,
            }}
          >
            Our thinking
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 1 }}>
            Understand what is driving the result
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{
              maxWidth: 760,
              mx: "auto",
              lineHeight: 1.7,
            }}
          >
            Practical analysis and plain-English explanations of Payment Times
            Reporting, payment behaviour and the operational issues that
            influence reported outcomes.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {[
            {
              type: "Blog",
              title: "SOPA does not equal PTRS",
              description:
                "Construction payment rules and Payment Times Reporting obligations measure different things and need to be treated separately.",
              image: "/images/services/payment-times-reporting.jpg",
              alt: "Payment reporting documents and financial analysis",
              to: "/insights/blog/why-sopa-compliance-doesnt-guarantee-strong-ptrs-results",
            },
            {
              type: "Knowledge Centre",
              title: "What is a payment run?",
              description:
                "How payment schedules influence supplier outcomes and why a routine weekly process can create avoidable reporting delays.",
              image: "/images/insights/insights2.jpg",
              alt: "Payment behaviour analysis and reporting schedule",
              to: "/insights/knowledge/what-is-a-payment-run",
            },
            {
              type: "Knowledge Centre",
              title: "What does a P95 of 30 days mean?",
              description:
                "A practical explanation of tail performance and what the slowest-paid invoices can reveal about an organisation’s processes.",
              image: "/images/brand/hero3.jpg",
              alt: "Payment performance data and analytical reporting",
              to: "/insights/knowledge/what-does-a-p95-of-30-days-mean",
            },
          ].map((item) => (
            <Grid
              key={item.title}
              size={{ xs: 12, md: 4 }}
              sx={{ display: "flex" }}
            >
              <Card
                variant="outlined"
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: theme.palette.background.paper,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <Box
                  component="img"
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  sx={{
                    width: "100%",
                    aspectRatio: "16 / 7",
                    objectFit: "cover",
                  }}
                />

                <Box
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {item.type}
                  </Typography>

                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                    sx={{
                      lineHeight: 1.7,
                      mb: theme.spacing(3),
                    }}
                  >
                    {item.description}
                  </Typography>

                  <Button
                    variant="text"
                    component={RouterLink}
                    to={item.to}
                    sx={{
                      mt: "auto",
                      px: 0,
                      alignSelf: "flex-start",
                      fontWeight: 800,
                    }}
                  >
                    Read article →
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card
          variant="outlined"
          sx={{
            mt: theme.spacing(5),
            p: { xs: 3, md: 4 },
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 800,
              letterSpacing: 1.4,
            }}
          >
            Join the conversation
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              mt: 0.5,
              mb: 1,
            }}
          >
            Follow Monochrome Compliance on LinkedIn
          </Typography>

          <Typography
            variant="body2"
            color={theme.palette.text.secondary}
            sx={{
              lineHeight: 1.7,
              mb: theme.spacing(4),
              maxWidth: 720,
            }}
          >
            We regularly share practical observations, operational lessons and
            commentary on Payment Times Reporting between our longer articles.
          </Typography>

          <Grid container spacing={2.5}>
            {[
              {
                title:
                  "SOPA compliance does not guarantee a strong PTRS result",
                description:
                  "Why construction payment obligations and Payment Times Reporting measure different things.",
                image: "/images/linkedin/sopa-vs-ptrs.jpg",
                alt: "Construction payment compliance and Payment Times Reporting",
                href: "https://www.linkedin.com/feed/update/urn:li:activity:7482569576363290625/?actorCompanyId=107866673",
              },
              {
                title:
                  "Poor payment metrics do not always mean poor payment behaviour",
                description:
                  "Operational delays can quietly distort reported payment outcomes.",
                image: "/images/linkedin/operational-payment-delays.jpg",
                alt: "Operational payment delays affecting reported payment performance",
                href: "https://www.linkedin.com/feed/update/urn:li:activity:7467059424604438528/?actorCompanyId=107866673",
              },
              {
                title: "Are you watching your tail?",
                description:
                  "A TGIF reminder that averages rarely tell the whole story.",
                image: "/images/linkedin/watching-your-tail.jpg",
                alt: "Tiger representing payment performance tail metrics",
                href: "https://www.linkedin.com/feed/update/urn:li:activity:7465911039914844160/?actorCompanyId=107866673",
              },
            ].map((post) => (
              <Grid
                key={post.title}
                size={{ xs: 12, md: 4 }}
                sx={{ display: "flex" }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    width: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: theme.palette.background.paper,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={post.image}
                    alt={post.alt}
                    loading="lazy"
                    sx={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      objectFit: "cover",
                    }}
                  />

                  <Box
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 800,
                        letterSpacing: 1.2,
                        mb: 0.5,
                      }}
                    >
                      LinkedIn
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                      sx={{
                        flexGrow: 1,
                        lineHeight: 1.7,
                        mb: 2,
                      }}
                    >
                      {post.description}
                    </Typography>

                    <Button
                      component="a"
                      href={post.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        alignSelf: "flex-start",
                        px: 0,
                        fontWeight: 700,
                      }}
                    >
                      View on LinkedIn →
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: theme.spacing(4),
            }}
          >
            <Button
              variant="contained"
              component="a"
              href="https://www.linkedin.com/company/monochrome-compliance/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow Monochrome Compliance
            </Button>
          </Box>
        </Card>

        <Box
          sx={{
            mt: spacingSx.group,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3 },
            flexWrap: "wrap",
          }}
        >
          <Typography
            component={RouterLink}
            to="/insights"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Industry Insights
          </Typography>

          <Typography color={theme.palette.text.secondary}>•</Typography>

          <Typography
            component={RouterLink}
            to="/insights/knowledge"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Knowledge Centre
          </Typography>

          <Typography color={theme.palette.text.secondary}>•</Typography>

          <Typography
            component={RouterLink}
            to="/insights/blog"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Blog
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          ...sectionSx,
          px: { xs: 2, sm: 4, md: 6 },
          mb: spacingSx.section,
        }}
      >
        <Box
          sx={{
            px: { xs: 3, sm: 4, md: 6 },
            py: { xs: 4, md: 5 },
            textAlign: "center",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 800,
              letterSpacing: 1.4,
            }}
          >
            Ready when you are
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mt: 0.5,
              mb: 1.5,
            }}
          >
            Know where you stand before the reporting period closes
          </Typography>

          <Typography
            variant="body1"
            color={theme.palette.text.secondary}
            sx={{
              maxWidth: 760,
              mx: "auto",
              mb: theme.spacing(3),
              lineHeight: 1.7,
            }}
          >
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
              fontWeight: 800,
            }}
          >
            Talk to us
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
