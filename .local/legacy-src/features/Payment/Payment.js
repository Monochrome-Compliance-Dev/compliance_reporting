import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      const client =
        location.state?.client || JSON.parse(sessionStorage.getItem("client"));

      if (client) {
        navigate("/users/create", { state: client });
      }
    }, 2000); // Simulate 2 second "payment"
    return () => clearTimeout(timer);
  }, [navigate, location]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
    >
      <Typography variant="h5" gutterBottom>
        Redirecting to payment gateway...
      </Typography>
      <CircularProgress />
    </Box>
  );
}
