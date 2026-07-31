import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PublicSurface } from "shared/layouts/PublicPageLayout";

export default function PublicCallToAction({
  eyebrow,
  title,
  description,
  children,
  align = "center",
  component = "section",
  textMaxWidth,
  sx,
}) {
  const theme = useTheme();
  const isCentred = align === "center";
  const resolvedTextMaxWidth = textMaxWidth ?? theme.layout.public.textWidth;

  return (
    <PublicSurface
      component={component}
      sx={{
        px: theme.layout.public.sectionPadding,
        py: theme.layout.public.sectionPadding,
        textAlign: align,
        ...sx,
      }}
    >
      <Stack spacing={2} alignItems={isCentred ? "center" : "flex-start"}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 800,
              letterSpacing: 1.4,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}

        <Typography component="h2" variant="h4">
          {title}
        </Typography>

        {description ? (
          <Typography
            variant="body1"
            sx={{
              maxWidth: resolvedTextMaxWidth,
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
            }}
          >
            {description}
          </Typography>
        ) : null}

        {children ? (
          <Box
            sx={{
              display: "flex",
              width: {
                xs: "100%",
                sm: "auto",
              },
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              justifyContent: isCentred ? "center" : "flex-start",
              gap: 1.5,
              pt: 1,
              "& > *": {
                width: {
                  xs: "100%",
                  sm: "auto",
                },
              },
            }}
          >
            {children}
          </Box>
        ) : null}
      </Stack>
    </PublicSurface>
  );
}
