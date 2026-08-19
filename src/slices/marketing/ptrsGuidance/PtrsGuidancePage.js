import { Link, useParams } from "react-router";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ptrsGuidanceContent from "./ptrsGuidanceContent";

const formatList = (items) => {
  if (!items?.length) {
    return null;
  }

  return items.join(", ");
};

const PtrsGuidancePage = () => {
  const theme = useTheme();
  const { slug } = useParams();

  const guidance = ptrsGuidanceContent.find((item) => item.slug === slug);

  if (!guidance) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Typography component="h1" variant="h3" sx={{ mb: 2 }}>
          Guidance not found
        </Typography>

        <Typography
          sx={{
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          We couldn&apos;t find a PTRS guidance page matching this address.
        </Typography>

        <Button
          component={Link}
          to="/ptrs-guidance"
          startIcon={<ArrowBackIcon />}
        >
          Back to PTRS Guidance Explorer
        </Button>
      </Container>
    );
  }

  const relatedGuidance = guidance.related
    .map((relatedSlug) =>
      ptrsGuidanceContent.find((item) => item.slug === relatedSlug),
    )
    .filter(Boolean);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Button
        component={Link}
        to="/ptrs-guidance"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 4 }}
      >
        Back to PTRS Guidance Explorer
      </Button>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Chip label={guidance.category} size="small" variant="outlined" />
        <Chip
          label={guidance.type}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      </Stack>

      <Typography
        component="h1"
        variant="h3"
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        {guidance.title}
      </Typography>

      <Box
        sx={{
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.background.paper,
          px: { xs: 2.5, md: 3 },
          py: 2.5,
          mb: 4,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 700,
          }}
        >
          Quick answer
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mt: 0.5,
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {guidance.shortAnswer}
        </Typography>
      </Box>

      <Typography
        component="h2"
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        What does this mean?
      </Typography>

      <Typography
        variant="body1"
        sx={{
          lineHeight: 1.8,
          mb: 4,
        }}
      >
        {guidance.explanation}
      </Typography>

      {guidance.practicalNote && (
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            p: { xs: 2.5, md: 3 },
            mb: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography
            component="h2"
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Practical point
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.8,
            }}
          >
            {guidance.practicalNote}
          </Typography>
        </Box>
      )}

      {guidance.sourceNote && (
        <Box sx={{ mb: 4 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            About this interpretation
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.8,
            }}
          >
            {guidance.sourceNote}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography
        component="h2"
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Official sources
      </Typography>

      <Stack spacing={2}>
        {guidance.sourceReferences.map((reference, index) => (
          <Box
            key={`${reference.source}-${reference.section}-${index}`}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2.5,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              {reference.source}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb:
                  reference.paragraphs ||
                  reference.examples ||
                  reference.pages ||
                  reference.reference
                    ? 1
                    : 0,
              }}
            >
              {reference.section}
            </Typography>

            <Stack spacing={0.5}>
              {reference.paragraphs && (
                <Typography variant="body2">
                  <strong>Paragraphs:</strong>{" "}
                  {formatList(reference.paragraphs)}
                </Typography>
              )}

              {reference.examples && (
                <Typography variant="body2">
                  <strong>Examples:</strong> {formatList(reference.examples)}
                </Typography>
              )}

              {reference.pages && (
                <Typography variant="body2">
                  <strong>Pages:</strong> {formatList(reference.pages)}
                </Typography>
              )}

              {reference.reference && (
                <Typography variant="body2">
                  <strong>Reference:</strong> {reference.reference}
                </Typography>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>

      {relatedGuidance.length > 0 && (
        <>
          <Divider sx={{ my: 5 }} />

          <Typography
            component="h2"
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Related guidance
          </Typography>

          <Stack spacing={1}>
            {relatedGuidance.map((relatedItem) => (
              <Button
                key={relatedItem.slug}
                component={Link}
                to={`/ptrs-guidance/${relatedItem.slug}`}
                variant="text"
                sx={{
                  justifyContent: "flex-start",
                  px: 0,
                  textAlign: "left",
                }}
              >
                {relatedItem.title}
              </Button>
            ))}
          </Stack>
        </>
      )}

      <Box
        sx={{
          mt: 6,
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          component="h2"
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Preparing a Payment Times Report?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 2,
          }}
        >
          Monochrome Compliance can help with the data preparation, validation,
          reconciliation and reporting process.
        </Typography>

        <Button component={Link} to="/contact" variant="contained">
          Get in touch
        </Button>
      </Box>

      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.7,
          }}
        >
          This information is general in nature and is not legal, financial or
          professional advice. It is based on published Payment Times Reporting
          Regulator guidance and should be read together with the official
          guidance, applicable legislation and your organisation&apos;s own
          circumstances.
        </Typography>
      </Box>
    </Container>
  );
};

export default PtrsGuidancePage;
