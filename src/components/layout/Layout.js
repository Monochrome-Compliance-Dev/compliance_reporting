import { useEffect, useState, useMemo, Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { Box, CssBaseline, Container } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Helmet } from "react-helmet-async";
import Navbar from "../navigation/Navbar";
import Footer from "../navigation/Footer";
import ProcessFlow from "../../features/reports/ptrs/ProcessFlow";
import { Alert, Snackbar } from "@mui/material";
import globalTheme from "../../theme/globalTheme"; // Ensure the import matches the export
import { useAlert } from "../../context/AlertContext";
import LoadingSpinner from "../ui/LoadingSpinner"; // If you have a spinner component
import useGtagPageview from "../../hooks/useGtagPageview";

export default function Layout() {
  useGtagPageview();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const location = useLocation();

  const theme = useMemo(() => {
    const mode = isDarkTheme ? "dark" : "light"; // Determine the mode
    return globalTheme(mode); // Use the globalTheme function
  }, [isDarkTheme]);

  // useEffect(() => {
  //   const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  //   setIsDarkTheme(mediaQuery.matches); // Set initial theme based on system preference
  //
  //   const handleChange = (event) => setIsDarkTheme(event.matches);
  //   mediaQuery.addEventListener("change", handleChange); // Listen for system theme changes
  //
  //   return () => mediaQuery.removeEventListener("change", handleChange);
  // }, []);

  // Scroll to the top of the screen when the pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
