import { Box, Stack, Typography } from "@mui/material";

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
  return (
    <Box
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 }, mx: "auto", maxWidth }}
    >
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        mb={2}
      >
        <Box>
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
        </Box>
        {headerRight}
      </Stack>

      <Box>{children}</Box>
    </Box>
  );
}
