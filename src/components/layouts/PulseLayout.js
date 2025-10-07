import {
  Box,
  Stack,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Tooltip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";

import { usePulseContext } from "../../context/PulseContext";

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

  const { serverStatus } = usePulseContext();
  const statusLabel =
    serverStatus === "online"
      ? "Server: Online"
      : serverStatus === "degraded"
        ? "Server: Degraded"
        : serverStatus === "offline"
          ? "Server: Offline"
          : "Server: …";
  const statusColor =
    serverStatus === "online"
      ? "success"
      : serverStatus === "degraded"
        ? "warning"
        : serverStatus === "offline"
          ? "error"
          : "default";
  const statusTooltip =
    serverStatus === "online"
      ? "Connected to live server"
      : serverStatus === "degraded"
        ? "Server responded with unexpected data, showing cache"
        : serverStatus === "offline"
          ? "Server unreachable, showing cache"
          : "Checking server…";

  return (
    <Box
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 }, mx: "auto", maxWidth }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        mb={1}
      >
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            mb: { xs: 1, sm: 0 },
            fontSize: "0.85rem",
            color: "text.secondary",
          }}
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={statusTooltip}>
            <Chip size="small" color={statusColor} label={statusLabel} />
          </Tooltip>
          {headerRight}
        </Box>
      </Stack>

      <Box>{children}</Box>
    </Box>
  );
}
