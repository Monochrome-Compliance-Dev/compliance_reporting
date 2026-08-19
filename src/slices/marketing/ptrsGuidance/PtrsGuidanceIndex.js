import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ptrsGuidanceContent from "./ptrsGuidanceContent";

const ALL_CATEGORIES = "All";

const PtrsGuidanceIndex = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(
        new Set(ptrsGuidanceContent.map((item) => item.category)),
      ).sort(),
    ],
    [],
  );

  const filteredGuidance = useMemo(() => {
    const normalisedSearchTerm = searchTerm.trim().toLowerCase();

    return ptrsGuidanceContent.filter((item) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES ||
        item.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalisedSearchTerm) {
        return true;
      }

      const searchableText = [
        item.title,
        item.shortAnswer,
        item.explanation,
        item.practicalNote,
        item.category,
        item.type,
        ...(item.searchTerms || []),
        ...(item.alternateQuestions || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalisedSearchTerm);
    });
  }, [searchTerm, selectedCategory]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ maxWidth: 820, mb: 5 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          PTRS Guidance Explorer
        </Typography>

        <Typography
          variant="h6"
          sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}
        >
          Plain-English answers to common Payment Times Reporting questions,
          grounded in the Regulator&apos;s published guidance and worked
          example.
        </Typography>
      </Box>

      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          mb: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <TextField
          fullWidth
          label="Search PTRS guidance"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Try ‘direct debit’, ‘partial payment’ or ‘payment time’"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 2 }}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              clickable
              color={selectedCategory === category ? "primary" : "default"}
              variant={selectedCategory === category ? "filled" : "outlined"}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </Stack>
      </Box>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: 2 }}
      >
        {filteredGuidance.length === 1
          ? "1 guidance result"
          : `${filteredGuidance.length} guidance results`}
      </Typography>

      <Stack spacing={2.5}>
        {filteredGuidance.map((item) => (
          <Box
            key={item.slug}
            component="article"
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Chip label={item.category} size="small" variant="outlined" />
              <Chip
                label={item.type}
                size="small"
                sx={{ textTransform: "capitalize" }}
              />
            </Stack>

            <Typography component="h2" variant="h5" sx={{ mb: 1 }}>
              {item.title}
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, mb: 2 }}
            >
              {item.shortAnswer}
            </Typography>

            <Button
              component={Link}
              to={`/ptrs-guidance/${item.slug}`}
              variant="text"
              sx={{ px: 0 }}
            >
              Read guidance
            </Button>
          </Box>
        ))}
      </Stack>

      {filteredGuidance.length === 0 && (
        <Box
          sx={{
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 3,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No matching guidance yet
          </Typography>

          <Typography sx={{ color: theme.palette.text.secondary }}>
            Try a broader search or another category.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          mt: 6,
          pt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          This information is general in nature and is not legal, financial or
          professional advice. It is based on published Payment Times Reporting
          Regulator guidance and should be read together with the official
          guidance and applicable legislation.
        </Typography>
      </Box>
    </Container>
  );
};

export default PtrsGuidanceIndex;
