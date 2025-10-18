import { useEffect, useState, useMemo, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Helmet } from "react-helmet-async";
import Navbar from "../navigation/Navbar";
import Footer from "../navigation/Footer";
import { Alert, Snackbar } from "@mui/material";
import globalTheme from "theme/globalTheme"; // Ensure the import matches the export
import { useAlert } from "context/AlertContext";
import { LoadingSpinner } from "../ui/"; // If you have a spinner component
import useGtagPageview from "hooks/useGtagPageview";

export default function Layout() {
  useGtagPageview();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const theme = useMemo(() => {
    const mode = isDarkTheme ? "dark" : "light"; // Determine the mode
    return globalTheme(mode); // Use the globalTheme function
  }, [isDarkTheme]);

  // Scroll to the top of the screen when the pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onGoLogin = () => {
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    };
    window.addEventListener("auth:go-login", onGoLogin);
    return () => window.removeEventListener("auth:go-login", onGoLogin);
  }, [navigate]);

  const toggleTheme = () => setIsDarkTheme((prev) => !prev); // Toggle between light and dark modes

  const { alertOpen, alertMessage, alertSeverity, closeAlert } = useAlert();

  return (
    <ThemeProvider theme={theme}>
      <Helmet>
        <title>Monochrome Compliance</title>
        <meta
          name="description"
          content="Automate compliance reporting and governance workflows with Monochrome Compliance."
        />
      </Helmet>
      <CssBaseline />
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={closeAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeAlert}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Navbar isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} />
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </Box>
        <Box
          sx={{ display: "flex", justifyContent: "flex-start", mt: 2, px: 2 }}
        ></Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
