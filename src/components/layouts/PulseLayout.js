import {
  Box,
  Stack,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";

/**
 * Minimal layout for Pulse screens.
 * Props:
 * - title: string (required)
 * - subtitle?: string
 * - headerRight?: ReactNode (optional actions area on the right)
 * - maxWidth?: number (defaults to 1400)
 * - children: ReactNode
 */
export default function PulseLayout({
  title,
  subtitle,
  headerRight = null,
  maxWidth = 1400,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Box
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 }, mx: "auto", maxWidth }}
    >
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{ mb: 1, fontSize: "0.85rem", color: "text.secondary" }}
      >
        <MuiLink
          underline="hover"
          color="inherit"
          onClick={() => navigate("/dashboard")}
          sx={{ cursor: "pointer" }}
        >
          Main Dashboard
        </MuiLink>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label = decodeURIComponent(value)
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return isLast ? (
            <Typography color="text.secondary" variant="body2" key={to}>
              {label}
            </Typography>
          ) : (
            <MuiLink
              underline="hover"
              variant="body2"
              color="text.secondary"
              onClick={() => navigate(to)}
              key={to}
              sx={{ cursor: "pointer" }}
            >
              {label}
            </MuiLink>
          );
        })}
      </Breadcrumbs>

      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        mb={2}
      >
        {/* <Box>
          {title && (
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box> */}
        {headerRight}
      </Stack>

      <Box>{children}</Box>
    </Box>
  );
}
