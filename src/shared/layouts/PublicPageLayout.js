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
  const theme = useTheme();

  return (
    <Box
      component={component}
      sx={{
        width: "100%",
        maxWidth: theme.layout.public.maxWidth,
        mx: "auto",
        px: disablePadding ? 0 : theme.layout.public.pageGutter,
        py: theme.layout.public.sectionSpacing,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function PublicContent({ children, maxWidth, sx }) {
  const theme = useTheme();
  const resolvedMaxWidth = maxWidth ?? theme.layout.public.contentWidth;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: resolvedMaxWidth,
        mx: "auto",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function PublicSurface({ children, component = "div", sx }) {
  const theme = useTheme();

  return (
    <Box
      component={component}
      sx={{
        p: theme.layout.public.cardPadding,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.layout.public.borderRadius,
        backgroundColor: theme.palette.background.paper,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
