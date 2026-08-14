import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  PublicContent,
  PublicPageSection as PublicPageSectionLayout,
} from "shared/layouts/PublicPageLayout";
import PublicSectionHeader from "./PublicSectionHeader";

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
            <PublicSectionHeader
              eyebrow={eyebrow}
              title={title}
              introduction={introduction}
              textMaxWidth={resolvedTextMaxWidth}
            />
          ) : null}

          {children}
        </Stack>
      </PublicContent>
    </PublicPageSectionLayout>
  );
}
