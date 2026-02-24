import { Box, CssBaseline } from "@mui/material";
import { Outlet } from "react-router";

export default function DataLayout() {
  return (
    <Box>
      <CssBaseline />
      <Outlet />
    </Box>
  );
}
