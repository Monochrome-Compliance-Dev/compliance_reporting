import { Box } from "@mui/material";
import { Outlet } from "react-router";

export default function CustomersLayout() {
  return (
    <Box>
      {/* <h1>Customers</h1> */}
      <Outlet />
    </Box>
  );
}
