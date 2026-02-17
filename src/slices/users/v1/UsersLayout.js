import { Box } from "@mui/material";
import { Outlet } from "react-router";

export default function UsersLayout() {
  return (
    <Box>
      {/* <h1>Users</h1> */}
      <Outlet />
    </Box>
  );
}
