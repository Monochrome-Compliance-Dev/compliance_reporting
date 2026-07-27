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
  sx,
}) {
  const theme = useTheme();

  const resolvedContentMaxWidth =
    contentMaxWidth ?? theme.layout.public.contentWidth;

  return (
    <PublicPageSection
      sx={{
        pt: {
          xs: theme.spacing(5),
          md: theme.spacing(7),
        },
        pb: {
          xs: theme.spacing(3),
          md: theme.spacing(4),
        },
        ...sx,
      }}
    >
      <PublicContent maxWidth={resolvedContentMaxWidth}>
        <Stack spacing={2}>
          {eyebrow ? (
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 700,
                letterSpacing: 1.4,
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
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>

          {description ? (
            <Typography
              variant="h6"
              sx={{
                maxWidth: theme.layout.public.textWidth,
                color: theme.palette.text.secondary,
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
                color: theme.palette.text.secondary,
              }}
            >
              {metadata}
            </Typography>
          ) : null}

          {children ? <Box sx={{ pt: 1 }}>{children}</Box> : null}
        </Stack>
      </PublicContent>
    </PublicPageSection>
  );
}
