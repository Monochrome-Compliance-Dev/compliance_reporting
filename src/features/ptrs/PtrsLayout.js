import { Box, CssBaseline } from "@mui/material";
import { Outlet } from "react-router";

export default function PtrsLayout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          mt: "72px", // offset for navbar
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
