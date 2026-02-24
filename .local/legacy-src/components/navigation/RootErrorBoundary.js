import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Box, Button, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router";
import { useTheme } from "@mui/material/styles";
import { userService } from "../../services";
// import { useAuthContext } from "../../context/AuthContext";

export default function RootErrorBoundary({ status, title, message } = {}) {
  const theme = useTheme();
  const navigate = useNavigate?.() || (() => {}); // Fallback to a no-op function
  const user = userService.userValue; // Get the current user
  const { isSignedIn } = user || { isSignedIn: false }; // Fallback to default values
  // const { isSignedIn } = useAuthContext?.() || { isSignedIn: false }; // Fallback to default values
  const error = useRouteError?.() || null; // Fallback to null if useRouteError is unavailable

  if (isRouteErrorResponse?.(error)) {
    status = error.status;
    if (!title || !message) {
      switch (error.status) {
        case 404:
          title = "Page Not Found";
          message = "Sorry, we couldn't find what you were looking for.";
          break;
        case 401:
          title = "Unauthorised";
          message = "You must be logged in to view this page.";
          break;
        case 403:
          title = "Forbidden";
          message = "You don't have permission to view this page.";
          break;
        default:
          title = `${error.status} ${error.statusText}`;
          message =
            error.data?.message || "An error occurred while loading the page.";
      }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  useEffect(() => {
    if (error) {
      console.error("Route error:", error);
      Sentry.captureException(error, {
        tags: { location: "RootErrorBoundary" },
        extra: {
          pathname: window.location.pathname,
          isSignedIn,
        },
      });
    }
  }, [error, isSignedIn]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: 3,
      }}
    >
      {status === 403 ? (
        <>
          <LockOutlinedIcon
            sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" gutterBottom>
            You don’t have permission to view this page.
          </Typography>
        </>
      ) : status === 404 ? (
        <>
          <ErrorOutlineIcon
            sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" gutterBottom>
            Sorry, we couldn't find what you were looking for.
          </Typography>
        </>
      ) : status === 401 ? (
        <>
          <ReportProblemOutlinedIcon
            sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Unauthorised
          </Typography>
          <Typography variant="body1" gutterBottom>
            You must be logged in to view this page.
          </Typography>
        </>
      ) : status === 500 ? (
        <>
          <HighlightOffOutlinedIcon
            sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Server Error
          </Typography>
          <Typography variant="body1" gutterBottom>
            An unexpected error occurred on the server.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {message}
          </Typography>
        </>
      )}
      <Box sx={{ display: "flex", gap: 2, marginTop: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/")}
        >
          Home
        </Button>
        {isSignedIn && (
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate("/user/dashboard")}
          >
            Dashboard
          </Button>
        )}
      </Box>
    </Box>
  );
}
