import { Box, Typography, Grid, Card, CardContent, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { userService } from "../../services";

export default function Dashboard() {
  const user = userService.userValue; // Get the current user
  const navigate = useNavigate();
  const theme = useTheme(); // Access the theme

  const productLinks = {
    pulse: {
      seeMore: "https://example.com/pulse",
      signUp: "https://example.com/pulse/signup",
    },
    ptrs: {
      seeMore: "https://example.com/ptrs",
      signUp: "https://example.com/ptrs/signup",
    },
    esg: {
      seeMore: "https://example.com/esg",
      signUp: "https://example.com/esg/signup",
    },
    ms: {
      seeMore: "https://example.com/ms",
      signUp: "https://example.com/ms/signup",
    },
  };

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to Your Solution Dashboard, {user?.firstName} {user?.lastName}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Select a solution below to get started.
      </Typography>

      <Grid container spacing={4} sx={{ marginTop: theme.spacing(2) }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("pulse") && {
              onClick: () => navigate("/pulse-solution"),
            })}
          >
            <CardContent>
              <Typography variant="h6">Pulse</Typography>
              <Typography variant="body2" color="textSecondary">
                Resource & Engagement Management
              </Typography>
              {!userService.hasFeature("pulse") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.pulse.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.pulse.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("ptrs") && {
              onClick: () => navigate("/ptrs"),
            })}
          >
            <CardContent>
              <Typography variant="h6">PTRS</Typography>
              <Typography variant="body2" color="textSecondary">
                Payment Times Reporting Scheme
              </Typography>
              {!userService.hasFeature("ptrs") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.ptrs.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.ptrs.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("esg") && {
              onClick: () => navigate("/esg"),
            })}
          >
            <CardContent>
              <Typography variant="h6">ESG</Typography>
              <Typography variant="body2" color="textSecondary">
                Environmental, Social & Governance Reporting
              </Typography>
              {!userService.hasFeature("esg") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.esg.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.esg.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("ms") && {
              onClick: () => navigate("/ms"),
            })}
          >
            <CardContent>
              <Typography variant="h6">Modern Slavery</Typography>
              <Typography variant="body2" color="textSecondary">
                Modern Slavery Compliance Reporting
              </Typography>
              {!userService.hasFeature("ms") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.ms.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.ms.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
