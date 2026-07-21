import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "../../../context";

const SEARCH_INDEX_URL = "/data/regulator-payment-times/search-index.json";

const MAX_RESULTS = 25;

function normaliseSearchValue(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normaliseAbn(value) {
  return value.replace(/\D/g, "");
}

function formatAbn(abn) {
  if (!abn || abn.length !== 11) {
    return abn;
  }

  return [abn.slice(0, 2), abn.slice(2, 5), abn.slice(5, 8), abn.slice(8)].join(
    " ",
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function RegulatorPaymentTimesSearchPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [companies, setCompanies] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSearchIndex() {
      try {
        setIsLoading(true);

        const response = await fetch(SEARCH_INDEX_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Search index request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The regulator payment times search index is invalid",
          );
        }

        setCompanies(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);

          showAlert(
            "The regulator payment times search could not be loaded.",
            "error",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSearchIndex();

    return () => {
      controller.abort();
    };
  }, [showAlert]);

  const searchResults = useMemo(() => {
    const textSearch = normaliseSearchValue(searchValue);
    const abnSearch = normaliseAbn(searchValue);

    if (textSearch.length < 2 && abnSearch.length < 2) {
      return [];
    }

    return companies
      .filter((company) => {
        const businessName = normaliseSearchValue(company.businessName);

        const abn = normaliseAbn(company.abn);

        return (
          businessName.includes(textSearch) ||
          (abnSearch && abn.includes(abnSearch))
        );
      })
      .slice(0, MAX_RESULTS);
  }, [companies, searchValue]);

  const hasSearch = normaliseSearchValue(searchValue).length >= 2;

  const handleCompanySelect = (slug) => {
    navigate(`/regulator-payment-times/${slug}`);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Stack spacing={2}>
            <Typography
              component="h1"
              variant="h2"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Regulator Payment Times
            </Typography>

            <Typography
              variant="h6"
              sx={{
                maxWidth: 760,
                color: theme.palette.text.secondary,
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Search published Australian Payment Times Reporting Scheme data by
              business name or ABN.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                maxWidth: 760,
                color: theme.palette.text.secondary,
                lineHeight: 1.7,
              }}
            >
              The information shown is sourced from Standard reports published
              in the Australian Government Payment Times Reports Register.
              Rankings and comparisons are calculated by Monochrome Compliance
              from that published data.
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <TextField
              fullWidth
              autoComplete="off"
              label="Search by business name or ABN"
              placeholder="For example, ACME Corp or 12 345 678 901"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Paper>

          {isLoading && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              sx={{ py: 5 }}
            >
              <CircularProgress size={24} />

              <Typography color="text.secondary">
                Loading regulator data…
              </Typography>
            </Stack>
          )}

          {!isLoading && hasSearch && (
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                {searchResults.length > 0
                  ? `${searchResults.length} result${
                      searchResults.length === 1 ? "" : "s"
                    } shown`
                  : "No matching businesses found"}
              </Typography>

              {searchResults.map((company) => (
                <Paper
                  key={company.abn}
                  component="button"
                  type="button"
                  onClick={() => handleCompanySelect(company.slug)}
                  elevation={0}
                  sx={{
                    width: "100%",
                    p: { xs: 2.5, sm: 3 },
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                    transition:
                      "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      transform: "translateY(-1px)",
                      boxShadow: theme.shadows[2],
                    },
                    "&:focus-visible": {
                      outline: `3px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Stack spacing={1}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {company.businessName}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                      }}
                    >
                      ABN {formatAbn(company.abn)}
                    </Typography>

                    {company.industrySubdivision && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {company.industrySubdivision}
                      </Typography>
                    )}

                    {company.latestReportingPeriodEndDate && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Latest reporting period ended{" "}
                        {formatDate(company.latestReportingPeriodEndDate)}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {!isLoading && !hasSearch && (
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
                py: 2,
              }}
            >
              Enter at least two characters to begin searching.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default RegulatorPaymentTimesSearchPage;
