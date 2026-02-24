import { Box, CircularProgress } from "@mui/material";

export default function Fallback({ size = "3rem", fullHeight = true }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: fullHeight ? "100vh" : "100%",
        width: "100%",
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
}
