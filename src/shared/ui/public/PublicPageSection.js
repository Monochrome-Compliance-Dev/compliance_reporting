import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  PublicContent,
  PublicPageSection as PublicPageSectionLayout,
} from "shared/layouts/PublicPageLayout";

export default function PublicPageSection({
  eyebrow,
  title,
  introduction,
  children,
  contentMaxWidth,
  textMaxWidth,
  component = "section",
  sx,
  contentSx,
}) {
  const theme = useTheme();

  const resolvedContentMaxWidth =
    contentMaxWidth ?? theme.layout.public.contentWidth;

  const resolvedTextMaxWidth = textMaxWidth ?? resolvedContentMaxWidth;

  return (
    <PublicPageSectionLayout component={component} sx={sx}>
      <PublicContent maxWidth={resolvedContentMaxWidth} sx={contentSx}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          {eyebrow || title || introduction ? (
            <Stack
              spacing={1.5}
              sx={{
                maxWidth: resolvedTextMaxWidth,
              }}
            >
              {eyebrow ? (
                <Typography
                  variant="overline"
                  sx={{
                    color: theme.palette.primary.main,
                  }}
                >
                  {eyebrow}
                </Typography>
              ) : null}

              {title ? (
                <Typography component="h2" variant="h3">
                  {title}
                </Typography>
              ) : null}

              {introduction ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: {
                      xs: "1rem",
                      md: "1.075rem",
                    },
                    lineHeight: 1.7,
                  }}
                >
                  {introduction}
                </Typography>
              ) : null}
            </Stack>
          ) : null}

          {children}
        </Stack>
      </PublicContent>
    </PublicPageSectionLayout>
  );
}
