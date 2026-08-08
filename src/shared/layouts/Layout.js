import { useEffect, useState, useMemo, Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Alert, Snackbar } from "@mui/material";
import { useAlert } from "context";
import globalTheme from "shared/theme/globalTheme";
import Navbar from "shared/navigation/Navbar";
import { LoadingSpinner } from "shared/ui";
import Footer from "shared/navigation/Footer";
import PageMeta from "shared/ui/PageMeta";

export default function Layout() {
  const [isDarkTheme, setIsDarkTheme] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const location = useLocation();

  const theme = useMemo(() => {
    const mode = isDarkTheme ? "dark" : "light";
    return globalTheme(mode);
  }, [isDarkTheme]);

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event) => {
      setIsDarkTheme(event.matches);
    };

    systemTheme.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleTheme = () => setIsDarkTheme((previous) => !previous);

  const { alertOpen, alertMessage, alertSeverity, closeAlert } = useAlert();

  return (
    <ThemeProvider theme={theme}>
      <PageMeta path={location.pathname} />
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
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: theme.zIndex.appBar,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Navbar isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} />
          </Box>
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet key={location.pathname} />
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
