import { Box, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { useNavigate, useLocation, Outlet } from "react-router";

export default function PartnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Box px={4} mt={3}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
        <MuiLink
          underline="hover"
          color="inherit"
          onClick={() => navigate("/")}
          sx={{ cursor: "pointer" }}
        >
          Home
        </MuiLink>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label = decodeURIComponent(value)
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return isLast ? (
            <Typography color="text.primary" key={to}>
              {label}
            </Typography>
          ) : (
            <MuiLink
              underline="hover"
              color="inherit"
              onClick={() => navigate(to)}
              key={to}
              sx={{ cursor: "pointer" }}
            >
              {label}
            </MuiLink>
          );
        })}
      </Breadcrumbs>

      <Box mt={2}>
        <Outlet />
      </Box>
    </Box>
  );
}
