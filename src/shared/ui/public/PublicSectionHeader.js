import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PublicSectionHeader({
  eyebrow,
  title,
  introduction,
  align = "left",
  component = "div",
  titleComponent = "h2",
  titleVariant = "h3",
  textMaxWidth,
  sx,
}) {
  const theme = useTheme();
  const isCentred = align === "center";
  const resolvedTextMaxWidth = textMaxWidth ?? theme.layout.public.textWidth;

  return (
    <Stack
      component={component}
      spacing={1.5}
      alignItems={isCentred ? "center" : "flex-start"}
      sx={{
        width: "100%",
        maxWidth: resolvedTextMaxWidth,
        mx: isCentred ? "auto" : 0,
        textAlign: align,
        ...sx,
      }}
    >
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

      {title ? (
        <Typography component={titleComponent} variant={titleVariant}>
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
  );
}
