import { Box, Stack, Typography, useTheme } from "@mui/material";
import {
  PublicContent,
  PublicPageSection,
} from "shared/layouts/PublicPageLayout";

export default function PublicPageHero({
  eyebrow,
  title,
  description,
  metadata,
  children,
  contentMaxWidth,
  image,
  imagePosition = "center",
  imageOverlay,
  sx,
}) {
  const theme = useTheme();

  const resolvedContentMaxWidth =
    contentMaxWidth ?? theme.layout.public.contentWidth;

  const content = (imageLed = false) => (
    <PublicContent maxWidth={resolvedContentMaxWidth}>
      <Stack spacing={2}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{
              color: imageLed
                ? theme.palette.common.white
                : theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: 1.4,
              opacity: imageLed ? 0.9 : 1,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}

        <Typography
          component="h1"
          variant="h3"
          sx={{
            maxWidth: theme.layout.public.textWidth,
            color: imageLed ? theme.palette.common.white : undefined,
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        {description ? (
          <Typography
            component="p"
            variant="h6"
            sx={{
              maxWidth: theme.layout.public.textWidth,
              color: imageLed
                ? "rgba(255,255,255,0.85)"
                : theme.palette.text.secondary,
              fontWeight: 400,
              lineHeight: 1.55,
            }}
          >
            {description}
          </Typography>
        ) : null}

        {metadata ? (
          <Typography
            variant="body2"
            sx={{
              color: imageLed
                ? "rgba(255,255,255,0.78)"
                : theme.palette.text.secondary,
            }}
          >
            {metadata}
          </Typography>
        ) : null}

        {children ? <Box sx={{ pt: 1 }}>{children}</Box> : null}
      </Stack>
    </PublicContent>
  );

  if (image) {
    return (
      <Box
        component="section"
        sx={{
          position: "relative",
          minHeight: {
            xs: 220,
            sm: 280,
            md: 340,
          },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          backgroundImage: `url('${image}')`,
          backgroundPosition: imagePosition,
          backgroundSize: "cover",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background:
              imageOverlay ??
              "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 100%)",
          },
          ...sx,
        }}
      >
        <PublicPageSection
          component="div"
          sx={{
            position: "relative",
            zIndex: 1,
            py: theme.layout.public.sectionPadding,
          }}
        >
          {content(true)}
        </PublicPageSection>
      </Box>
    );
  }

  return (
    <PublicPageSection
      sx={{
        py: theme.layout.public.sectionPadding,
        ...sx,
      }}
    >
      {content()}
    </PublicPageSection>
  );
}
