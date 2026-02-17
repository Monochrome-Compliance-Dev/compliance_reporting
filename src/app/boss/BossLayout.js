import { Box, Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { useLocation, useNavigate, Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";

import { RequireRoles } from "app/routes/RequireRoles";
import Role from "context/role";
import BossNav from "app/boss/BossNav";

export default function BossLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);
  const crumbParts = pathnames.filter((p) => p !== "app" && p !== "boss");

  const labelFor = (value) =>
    decodeURIComponent(value)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <RequireRoles allowed={[Role.Boss]}>
      <BossNav />

      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 3,
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink
            underline="hover"
            color="inherit"
            onClick={() => navigate("/app")}
            sx={{ cursor: "pointer" }}
          >
            Homebase
          </MuiLink>

          {crumbParts.map((value, index) => {
            const isLast = index === crumbParts.length - 1;
            const to = `/app/boss/${crumbParts.slice(0, index + 1).join("/")}`;

            return isLast ? (
              <Typography color="text.primary" key={to}>
                {labelFor(value)}
              </Typography>
            ) : (
              <MuiLink
                underline="hover"
                color="inherit"
                onClick={() => navigate(to)}
                key={to}
                sx={{ cursor: "pointer" }}
              >
                {labelFor(value)}
              </MuiLink>
            );
          })}
        </Breadcrumbs>

        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            p: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </RequireRoles>
  );
}
