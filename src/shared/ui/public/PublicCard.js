import { Box, Card, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PublicCard({
  image,
  imageAlt = "",
  imageLoading = "lazy",
  media,
  eyebrow,
  title,
  description,
  children,
  actions,
  component = "article",
  titleComponent = "h3",
  titleVariant = "h6",
  interactive = false,
  imageSx,
  contentSx,
  sx,
}) {
  const theme = useTheme();

  return (
    <Card
      component={component}
      variant="outlined"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: theme.layout.public.borderRadius,
        backgroundColor: theme.palette.background.paper,
        transition: interactive
          ? "transform 0.2s ease, box-shadow 0.2s ease"
          : undefined,
        ...(interactive && {
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[4],
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            "&:hover": {
              transform: "none",
            },
          },
        }),
        ...sx,
      }}
    >
      {media ??
        (image ? (
          <Box
            component="img"
            src={image}
            alt={imageAlt}
            loading={imageLoading}
            sx={{
              display: "block",
              width: "100%",
              aspectRatio: "16 / 7",
              objectFit: "cover",
              ...imageSx,
            }}
          />
        ) : null)}

      <Stack
        spacing={1}
        sx={{
          flexGrow: 1,
          p: theme.layout.public.cardPadding,
          ...contentSx,
        }}
      >
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}

        {title ? (
          <Typography
            component={titleComponent}
            variant={titleVariant}
            sx={{ fontWeight: 800 }}
          >
            {title}
          </Typography>
        ) : null}

        {description ? (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
            }}
          >
            {description}
          </Typography>
        ) : null}

        {children}

        {actions ? <Box sx={{ mt: "auto", pt: 2 }}>{actions}</Box> : null}
      </Stack>
    </Card>
  );
}
