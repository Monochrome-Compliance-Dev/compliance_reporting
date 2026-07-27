import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import PublicPageLayout, {
  PublicContent,
  PublicPageSection,
  PublicSurface,
} from "shared/layouts/PublicPageLayout";

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

function createUtcDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = createUtcDate(dateValue);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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
            "The Payment Times Explorer search could not be loaded.",
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

  const hasSearch =
    normaliseSearchValue(searchValue).length >= 2 ||
    normaliseAbn(searchValue).length >= 2;

  return (
    <PublicPageLayout>
      <PublicPageSection
        sx={{
          pt: {
            xs: 4,
            md: 5,
          },
        }}
      >
        <PublicContent maxWidth={960}>
          <Stack spacing={{ xs: 4, md: 5 }}>
            <Box>
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/")}
                sx={{ mb: 3 }}
              >
                Home
              </Button>

              <Stack spacing={2}>
                <Typography
                  component="h1"
                  variant="h3"
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: {
                      xs: "1.8rem",
                      sm: "2.2rem",
                      md: "2.6rem",
                    },
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  Payment Times Explorer
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: 780,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  Search published Australian Payment Times Reporting Scheme
                  data by business name or ABN.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 780,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  The information shown is sourced from Standard reports
                  published in the Australian Government Payment Times Reports
                  Register. Rankings and comparisons are calculated by
                  Monochrome Compliance from that published data.
                </Typography>
              </Stack>
            </Box>

            <PublicSurface>
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
            </PublicSurface>

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
                  Loading Payment Times Explorer…
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
                  <PublicSurface
                    key={company.abn}
                    component={RouterLink}
                    to={`/regulator-payment-times/${company.slug}`}
                    sx={{
                      width: "100%",
                      display: "block",
                      textAlign: "left",
                      color: "inherit",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition:
                        "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        transform: "translateY(-1px)",
                        boxShadow: theme.shadows[2],
                      },
                      "&:focus-visible": {
                        outline: `3px solid ${alpha(
                          theme.palette.primary.main,
                          0.35,
                        )}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 700,
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

                      {company.industryDivision && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                          }}
                        >
                          ANZSIC Industry Division: {company.industryDivision}
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
                  </PublicSurface>
                ))}
              </Stack>
            )}

            {!isLoading && !hasSearch && (
              <Typography
                variant="body2"
                sx={{
                  py: 2,
                  color: theme.palette.text.secondary,
                  textAlign: "center",
                }}
              >
                Enter at least two characters to begin searching.
              </Typography>
            )}

            <PublicSurface
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderColor: alpha(theme.palette.primary.main, 0.22),
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      letterSpacing: 1.3,
                    }}
                  >
                    Explore by industry
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mt: 0.5,
                      mb: 0.75,
                      color: theme.palette.text.primary,
                      fontWeight: 800,
                    }}
                  >
                    Compare payment times across Australian industries
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 600,
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    Review industry-level P95 results, reporting trends and the
                    range of payment performance across published reporting
                    entities.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/regulator-payment-times/industries"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    flexShrink: 0,
                    px: 3,
                    fontWeight: 800,
                  }}
                >
                  Explore industries
                </Button>
              </Stack>
            </PublicSurface>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              Source: Australian Government Payment Times Reports Register
              Standard report data. Monochrome Compliance is not affiliated with
              or endorsed by the Australian Government or the Payment Times
              Reporting Regulator.
            </Typography>
          </Stack>
        </PublicContent>
      </PublicPageSection>
    </PublicPageLayout>
  );
}

export default RegulatorPaymentTimesSearchPage;
