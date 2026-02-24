import { Box } from "@mui/material";
import { Outlet } from "react-router";

export default function ClientsLayout() {
  return (
    <Box>
      {/* <h1>Clients</h1> */}
      <Outlet />
    </Box>
  );
}
