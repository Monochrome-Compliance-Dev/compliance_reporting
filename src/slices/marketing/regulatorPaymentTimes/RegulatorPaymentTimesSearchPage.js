import { useEffect, useMemo, useState } from "react";
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
import { Link as RouterLink } from "react-router";
import { useAlert } from "context";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicPageHero, PublicPageSection } from "shared/ui";

const SEARCH_INDEX_URL = "/data/regulator-payment-times/search-index.json";
const MAX_RESULTS = 25;

function normaliseSearchValue(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normaliseAbn(value) {
  return value.replace(/\D/g, "");
}

function formatAbn(abn) {
  if (!abn || abn.length !== 11) return abn;

  return [abn.slice(0, 2), abn.slice(2, 5), abn.slice(5, 8), abn.slice(8)].join(
    " ",
  );
}

function formatDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function RegulatorPaymentTimesSearchPage() {
  const theme = useTheme();
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
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadSearchIndex();
    return () => controller.abort();
  }, [showAlert]);

  const searchResults = useMemo(() => {
    const textSearch = normaliseSearchValue(searchValue);
    const abnSearch = normaliseAbn(searchValue);

    if (textSearch.length < 2 && abnSearch.length < 2) return [];

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
    <>
      <PageMeta
        title="Payment Times Explorer"
        description="Search published Australian Payment Times Reporting Scheme data by business name or ABN."
        path="/regulator-payment-times"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Published payment data"
          title="Payment Times Explorer"
          description="Search published Australian Payment Times Reporting Scheme data by business name or ABN."
          contentMaxWidth={960}
          sx={{
            "&&": {
              paddingTop: { xs: theme.spacing(3), md: theme.spacing(4) },
              paddingBottom: 0,
            },
          }}
        >
          <Stack spacing={{ xs: 1.5, md: 2 }}>
            <Button
              variant="text"
              component={RouterLink}
              to="/"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ alignSelf: "flex-start" }}
            >
              Home
            </Button>

            <Typography
              variant="body2"
              sx={{
                maxWidth: theme.layout.public.textWidth,
                color: theme.palette.text.secondary,
                lineHeight: 1.7,
              }}
            >
              The information shown is sourced from Standard reports published
              in the Australian Government Payment Times Reports Register.
              Rankings and comparisons are calculated by Monochrome Compliance
              from that published data.
            </Typography>

            <PublicSurface component="search">
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
                        <SearchRoundedIcon aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </PublicSurface>
          </Stack>
        </PublicPageHero>

        <PublicPageSection
          contentMaxWidth={960}
          sx={{
            "&&": {
              paddingTop: 0,
              paddingBottom: {
                xs: theme.spacing(4),
                md: theme.spacing(6),
              },
            },
          }}
        >
          <Stack spacing={{ xs: 1.5, md: 2 }}>
            <Box aria-live="polite" aria-busy={isLoading}>
              {isLoading ? (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                  role="status"
                  sx={{ py: { xs: 2, md: 3 } }}
                >
                  <CircularProgress size={24} />
                  <Typography color="text.secondary">
                    Loading Payment Times Explorer…
                  </Typography>
                </Stack>
              ) : null}

              {!isLoading && hasSearch ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" color="text.secondary">
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
              ) : null}

              {!isLoading && !hasSearch ? (
                <Typography
                  variant="body2"
                  sx={{
                    py: { xs: 1, md: 1.5 },
                    color: theme.palette.text.secondary,
                    textAlign: "center",
                  }}
                >
                  Enter at least two characters to begin searching.
                </Typography>
              ) : null}
            </Box>

            <PublicSurface
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderColor: alpha(theme.palette.primary.main, 0.22),
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="overline" color="primary.main">
                    Explore by industry
                  </Typography>
                  <Typography component="h2" variant="h6" sx={{ mt: 0.5 }}>
                    Compare payment times across Australian industries
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.75,
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
                  sx={{ flexShrink: 0 }}
                >
                  Explore industries
                </Button>
              </Stack>
            </PublicSurface>

            <Typography variant="caption" color="text.secondary">
              Source: Australian Government Payment Times Reports Register
              Standard report data. Monochrome Compliance is not affiliated with
              or endorsed by the Australian Government or the Payment Times
              Reporting Regulator.
            </Typography>
          </Stack>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}

export default RegulatorPaymentTimesSearchPage;
