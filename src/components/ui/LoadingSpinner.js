import { Box, CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const LoadingSpinner = ({ message = "Loading compliance magic…" }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        textAlign: "center",
        color: theme.palette.text.secondary,
      }}
    >
      <CircularProgress
        thickness={4}
        size={60}
        sx={{
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
};

export default LoadingSpinner;
