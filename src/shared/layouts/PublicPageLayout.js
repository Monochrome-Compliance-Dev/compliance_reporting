import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PublicPageLayout({ children, sx }) {
  return (
    <Box
      component="main"
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function PublicPageSection({
  children,
  component = "section",
  disablePadding = false,
  sx,
}) {
  return (
    <Box
      component={component}
      sx={{
        width: "calc(100% - 32px)",
        maxWidth: 1440,
        mx: "auto",
        px: disablePadding
          ? 0
          : {
              xs: 2,
              sm: 4,
              md: 6,
            },
        py: {
          xs: 5,
          md: 5,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function PublicContent({ children, maxWidth = 1180, sx }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function PublicSurface({ children, component = "div", sx, ...props }) {
  const theme = useTheme();

  return (
    <Box
      component={component}
      {...props}
      sx={{
        p: {
          xs: 2.5,
          md: 3,
        },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
