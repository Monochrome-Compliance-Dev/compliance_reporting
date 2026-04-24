import {
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Collapse,
  Chip,
  Tooltip,
  IconButton,
  TextField,
  Grid,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { useMemo, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RuleIcon from "@mui/icons-material/Rule";
import { usePtrsContext } from "../context/PtrsContext";
import {
  useApplyExclusionsMutation,
  useCreateExclusionKeywordMutation,
  useDeleteExclusionKeywordMutation,
  useExclusionKeywordsQuery,
  useExclusionsPreviewQuery,
  useExclusionsSummaryQuery,
  useUpdateExclusionKeywordMutation,
} from "../hooks/usePtrsQueries";

function SampleTable({ rows }) {
  if (!Array.isArray(rows) || !rows.length) return null;

  return (
    <Box sx={{ mt: 1, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Payee</TableCell>
            <TableCell>Payee ABN</TableCell>
            <TableCell>Invoice ref</TableCell>
            <TableCell>Account</TableCell>
            <TableCell>Payment date</TableCell>
            <TableCell align="right">Payment amt</TableCell>
            <TableCell>Note</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => {
            const rowKey = [
              r?.row_no,
              r?.payment_date,
              r?.payment_amount,
              r?.invoice_reference_number,
              r?.payee_entity_abn,
              r?.account_code,
              idx,
            ]
              .map((value) => String(value ?? ""))
              .join("|");

            return (
              <TableRow key={rowKey}>
                <TableCell>{r?.payee_entity_name || "-"}</TableCell>
                <TableCell>{r?.payee_entity_abn || "-"}</TableCell>
                <TableCell>{r?.invoice_reference_number || "-"}</TableCell>
                <TableCell>{r?.account_code || "-"}</TableCell>
                <TableCell>{r?.payment_date || "-"}</TableCell>
                <TableCell align="right">{r?.payment_amount || "-"}</TableCell>
                <TableCell>{r?.exclude_comment || "-"}</TableCell>
                <TableCell>{r?.description || "-"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

function ExclusionCard({
  title,
  description,
  category,
  enabled,
  previewCount,
  previewRows,
  onPreview,
  onApply,
  busy,
  isApplying,
  isPreviewing,
  isInitialising,
  canApply,
  statusMessage,
}) {
  const [showSample, setShowSample] = useState(false);
  const hasRows = Array.isArray(previewRows) && previewRows.length > 0;

  const showLoadingState = isInitialising || isPreviewing || isApplying;
  const loadingLabel = isApplying
    ? "Applying exclusion…"
    : isPreviewing
      ? "Loading preview…"
      : isInitialising
        ? "Preparing exclusion checks…"
        : "";

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>

          {showLoadingState ? (
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="caption" color="text.secondary">
                  {loadingLabel}
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  label={isApplying ? "Applying…" : "Loading…"}
                />
              </Stack>
              <LinearProgress />
            </Stack>
          ) : null}

          {enabled ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Preview:{" "}
              <strong>
                {previewCount == null ? "—" : `${previewCount} row(s)`}
              </strong>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coming soon.
            </Typography>
          )}

          {enabled && previewCount === 0 && (
            <Typography variant="body2" color="text.secondary">
              No records matched this exclusion category.
            </Typography>
          )}

          {enabled && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1 }}
            >
              {hasRows ? (
                <>
                  <Chip
                    size="small"
                    label={`${previewRows.length} sample row(s)`}
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowSample((v) => !v)}
                    endIcon={
                      showSample ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                  >
                    {showSample ? "Hide sample" : "Show sample"}
                  </Button>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No sample rows to display.
                </Typography>
              )}
            </Stack>
          )}

          <Collapse
            in={enabled && hasRows && showSample}
            timeout="auto"
            unmountOnExit
          >
            <SampleTable rows={previewRows} />
          </Collapse>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: "space-between" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ minHeight: 20, display: "block" }}
        >
          {statusMessage || " "}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => onPreview(category)}
            disabled={!enabled || busy}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<RuleIcon />}
            onClick={() => onApply(category, title)}
            disabled={!enabled || busy || !canApply}
          >
            {isApplying ? "Applying..." : "Apply"}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

function ExclusionsSummaryCard({ summary, loading }) {
  const entries = Object.entries(summary?.byReason || {});

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6" fontWeight={600}>
            Applied exclusions summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Checking persisted exclusion counts for this PTRS report…"
              : "Persisted exclusion counts for this PTRS report."}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              color="primary"
              label={`Total excluded: ${loading ? "…" : Number(summary?.totalExcludedRows || 0)}`}
            />
            {entries.map(([reason, count]) => (
              <Chip
                key={reason}
                variant="outlined"
                label={`${reason}: ${Number(count || 0)}`}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ExclusionsPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { goTo } = usePtrsNavigation();

  const { ptrsId, profileId } = usePtrsContext();

  const applyMutation = useApplyExclusionsMutation(ptrsId);

  const exclusionsSummaryQuery = useExclusionsSummaryQuery(ptrsId, {
    profileId,
    enabled: true,
  });

  const previewQueries = {
    gov: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "gov",
      limit: 5,
      enabled: false,
    }),
    intra_company: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "intra_company",
      limit: 5,
      enabled: false,
    }),
    employee: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "employee",
      limit: 5,
      enabled: false,
    }),
    doc_type: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "doc_type",
      limit: 5,
      enabled: false,
    }),
    prepaid: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "prepaid",
      limit: 5,
      enabled: false,
    }),
    payment_terms: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "payment_terms",
      limit: 5,
      enabled: false,
    }),
    international: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "international",
      limit: 5,
      enabled: false,
    }),
    keyword: useExclusionsPreviewQuery(ptrsId, {
      profileId,
      category: "keyword",
      limit: 5,
      enabled: false,
    }),
  };

  const keywordListQuery = useExclusionKeywordsQuery(ptrsId, { profileId });
  const createKeywordMutation = useCreateExclusionKeywordMutation(ptrsId);
  const updateKeywordMutation = useUpdateExclusionKeywordMutation(ptrsId);
  const deleteKeywordMutation = useDeleteExclusionKeywordMutation(ptrsId);

  const [newKeyword, setNewKeyword] = useState("");
  const [newField, setNewField] = useState("any");
  const [newMatchType, setNewMatchType] = useState("contains");
  const [newNotes, setNewNotes] = useState(""); // <-- add this
  const [editKeywordId, setEditKeywordId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [applyingCategory, setApplyingCategory] = useState(null);

  const getAlreadyExcludedCount = (query, key) => {
    const total = query?.data?.result?.alreadyExcludedCounts?.[key] ?? null;
    if (Number.isFinite(total)) return Number(total);

    const rows = query?.data?.result?.samples?.[key] || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  };

  const busy =
    applyMutation.isPending ||
    applyingCategory !== null ||
    Object.values(previewQueries).some((q) => q.isFetching) ||
    exclusionsSummaryQuery.isFetching ||
    keywordListQuery.isFetching ||
    createKeywordMutation.isPending ||
    updateKeywordMutation.isPending ||
    deleteKeywordMutation.isPending;

  const initialLoadInProgress =
    exclusionsSummaryQuery.isLoading || keywordListQuery.isLoading;

  const getPreviewCount = (query, key) => {
    const countFromResult = query?.data?.result?.counts?.[key];
    if (Number.isFinite(countFromResult)) return Number(countFromResult);

    const sampleRows = query?.data?.result?.samples?.[key];
    if (Array.isArray(sampleRows)) return sampleRows.length;

    return 0;
  };

  const getToBeAffectedCount = (query, key) => {
    const matched = getPreviewCount(query, key);
    const alreadyExcluded = getAlreadyExcludedCount(query, key);
    return Math.max(Number(matched || 0) - Number(alreadyExcluded || 0), 0);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      gov: "government entity",
      intra_company: "intra-company",
      employee: "employee & payroll",
      doc_type: "document type",
      prepaid: "pre-payment",
      payment_terms: "payment terms",
      international: "international supplier",
      keyword: "custom keyword",
    };

    return labels[category] || category;
  };

  const getReasonCodeForCategory = (category) => {
    const map = {
      gov: "GOV_ENTITY",
      intra_company: "INTRA_COMPANY",
      employee: "EMPLOYEE",
      doc_type: "DOC_TYPE",
      prepaid: "PREPAID",
      payment_terms: "PAYMENT_TERMS",
      international: "INTERNATIONAL",
      keyword: "KEYWORD",
    };

    return map[category] || null;
  };

  const getAppliedCountForCategory = (category) => {
    const reasonCode = getReasonCodeForCategory(category);
    if (!reasonCode) return 0;
    return Number(exclusionsSummaryQuery.data?.byReason?.[reasonCode] || 0);
  };

  const handlePreviewCategory = async (category) => {
    const query = previewQueries[category];
    if (!query) return;

    try {
      showAlert(`Previewing ${getCategoryLabel(category)} exclusions…`, "info");
      const out = await query.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handleApplyCategory = async (category, title) => {
    try {
      setApplyingCategory(category);
      showAlert(`Applying ${title.toLowerCase()}…`, "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category,
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      await previewQueries[category]?.refetch?.();
      await exclusionsSummaryQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    } finally {
      setApplyingCategory(null);
    }
  };

  const refreshKeywordList = async () => {
    if (!keywordListQuery?.refetch) return;
    await keywordListQuery.refetch();
  };

  const handleAddKeyword = async () => {
    try {
      const keyword = String(newKeyword || "").trim();
      if (!keyword) {
        showAlert("Enter a keyword or phrase first.", "error");
        return;
      }
      if (!newField) {
        showAlert("Select a field to match.", "error");
        return;
      }
      if (!newMatchType) {
        showAlert("Select a match type.", "error");
        return;
      }

      showAlert("Saving keyword…", "info");
      await createKeywordMutation.mutateAsync({
        profileId,
        keyword,
        field: newField,
        matchType: newMatchType,
        notes: newNotes,
      });
      setNewKeyword("");
      setNewField("any");
      setNewMatchType("contains");
      setNewNotes("");
      showAlert("Keyword saved.", "success");

      await refreshKeywordList();
      await previewQueries.keyword.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to save keyword.", "error");
    }
  };

  const handleEditKeyword = (k) => {
    setEditKeywordId(k.id);
    setEditFields({
      keyword: k.keyword,
      field: k.field,
      matchType: k.matchType,
      notes: k.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditKeywordId(null);
    setEditFields({});
  };

  const handleSaveEdit = async (k) => {
    try {
      const { keyword, field, matchType, notes } = editFields;
      if (!keyword || !field || !matchType) {
        showAlert("Keyword, field, and match type are required.", "error");
        return;
      }
      showAlert("Updating keyword…", "info");
      await updateKeywordMutation.mutateAsync({
        profileId,
        keywordId: k.id,
        keyword,
        field,
        matchType,
        notes,
      });
      showAlert("Keyword updated.", "success");
      setEditKeywordId(null);
      setEditFields({});
      await refreshKeywordList();
      await previewQueries.keyword.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to update keyword.", "error");
    }
  };

  const handleDeleteKeyword = async (keywordId) => {
    try {
      if (!keywordId) return;

      showAlert("Removing keyword…", "info");
      await deleteKeywordMutation.mutateAsync({ profileId, keywordId });
      showAlert("Keyword removed.", "success");

      await refreshKeywordList();
      await previewQueries.keyword.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to remove keyword.", "error");
    }
  };

  const handleNext = () => {
    if (!ptrsId) return;

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);

    goTo(`rules?${qs.toString()}`, { includeId: false });
  };

  const sections = useMemo(
    () => [
      {
        title: "Eligibility & relationship exclusions",
        items: [
          {
            title: "Government entities",
            description:
              "Exclude payments to government entities using a shared ABN reference list.",
            category: "gov",
            enabled: true,
          },
          {
            title: "Intra-company payments",
            description:
              "Exclude payments between related entities (profile-scoped reference).",
            category: "intra_company",
            enabled: true,
          },
          {
            title: "Employee & expense payments",
            description:
              "Exclude wages, reimbursements, and employee-related payments (profile-scoped reference + keywords).",
            category: "employee",
            enabled: true,
          },
        ],
      },
      {
        title: "Document classification exclusions",
        items: [
          {
            title: "Document type exclusions",
            description:
              "Exclude K1 employee T&E, clearing documents beginning 2000, and document types Z, KZ, or AB only when the clearing document begins with 5.",
            category: "doc_type",
            enabled: true,
          },
        ],
      },
      {
        title: "Supplier classification exclusions",
        items: [
          {
            title: "International suppliers",
            description:
              "Exclude suppliers identified as international based on non-AUD document currency. Missing or invalid ABNs should be reviewed separately as a data-quality issue.",
            category: "international",
            enabled: true,
          },
        ],
      },
      {
        title: "Payment structure exclusions",
        items: [
          {
            title: "Pre-payments",
            description:
              "Exclude payments with prepaid terms such as PREPAID (where applicable).",
            category: "prepaid",
            enabled: true,
          },
          {
            title: "Immediate payment terms",
            description:
              "Exclude non-trade-credit rows where the staged payment terms resolve to 0 days.",
            category: "payment_terms",
            enabled: true,
          },
        ],
      },
      {
        title: "Custom exclusions",
        items: [
          {
            title: "Custom keyword exclusions",
            description:
              "Exclude rows when a keyword/phrase matches key fields (seed via tbl_ptrs_exclusion_keyword_customer_ref).",
            category: "keyword",
            enabled: true,
          },
        ],
      },
    ],
    [],
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={600}>
          Exclusions & eligibility
        </Typography>

        <Divider />

        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Preview each exclusion category, review a sample of impacted rows,
          then apply the exclusions. Excluded records will not appear in metrics
          or reports.
        </Typography>

        <ExclusionsSummaryCard
          summary={exclusionsSummaryQuery.data}
          loading={exclusionsSummaryQuery.isFetching}
        />

        {initialLoadInProgress ? (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Loading exclusion state
                  </Typography>
                  <Chip size="small" color="primary" label="Checking…" />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  The platform is checking previously applied exclusions and any
                  saved keyword rules for this PTRS report. The exclusion cards
                  will become actionable once that finishes.
                </Typography>

                <LinearProgress />
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Stack spacing={2} sx={{ mt: 1 }}>
          {sections.map((section) => (
            <Stack key={section.title} spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {section.title}
              </Typography>

              <Grid container spacing={2}>
                {section.items.map((item) => {
                  const query = previewQueries[item.category];
                  const previewCount = query?.isFetched
                    ? getPreviewCount(query, item.category)
                    : null;
                  const previewRows =
                    query?.data?.result?.samples?.[item.category] ?? [];
                  const alreadyExcludedCount = getAlreadyExcludedCount(
                    query,
                    item.category,
                  );
                  const toBeAffectedCount = getToBeAffectedCount(
                    query,
                    item.category,
                  );
                  const hasPreview = query?.isFetched === true;
                  const canApply = hasPreview && toBeAffectedCount > 0;
                  const appliedCount = getAppliedCountForCategory(
                    item.category,
                  );
                  const summarySuffix = appliedCount
                    ? ` • ${appliedCount} applied in total`
                    : "";

                  if (item.category === "keyword") {
                    const keywordRows = keywordListQuery.data?.rows || [];

                    return (
                      <Grid key={item.category} size={{ xs: 12 }}>
                        <Stack spacing={1}>
                          <ExclusionCard
                            title={item.title}
                            description={item.description}
                            category={item.category}
                            enabled={item.enabled}
                            previewCount={previewCount}
                            previewRows={previewRows}
                            busy={busy}
                            isApplying={applyingCategory === item.category}
                            isPreviewing={
                              query?.isFetching === true &&
                              applyingCategory !== item.category
                            }
                            isInitialising={initialLoadInProgress}
                            onPreview={handlePreviewCategory}
                            onApply={handleApplyCategory}
                            canApply={canApply}
                            statusMessage={
                              applyingCategory === item.category
                                ? `Applying ${item.title.toLowerCase()} — this may take a while for large datasets.`
                                : query?.isFetched
                                  ? toBeAffectedCount > 0
                                    ? `${toBeAffectedCount} row(s) to be affected • ${alreadyExcludedCount} already excluded${summarySuffix}`
                                    : `No remaining rows to affect${summarySuffix}`
                                  : "Preview this category before applying."
                            }
                          />

                          <Card variant="outlined">
                            <CardContent>
                              <Stack spacing={1}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                  >
                                    Manage keywords
                                  </Typography>

                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={refreshKeywordList}
                                    disabled={!ptrsId || !profileId || busy}
                                  >
                                    Refresh
                                  </Button>
                                </Stack>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Add words or phrases that should exclude rows
                                  (matches payee name, description, invoice ref,
                                  account name/code).
                                </Typography>

                                <Stack spacing={1}>
                                  <Stack direction="row" spacing={1}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Keyword or phrase"
                                      value={newKeyword}
                                      onChange={(e) =>
                                        setNewKeyword(e.target.value)
                                      }
                                      disabled={!ptrsId || !profileId || busy}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddKeyword();
                                        }
                                      }}
                                    />
                                    <TextField
                                      select
                                      size="small"
                                      label="Field"
                                      value={newField}
                                      onChange={(e) =>
                                        setNewField(e.target.value)
                                      }
                                      disabled={!ptrsId || !profileId || busy}
                                      SelectProps={{ native: true }}
                                      sx={{ minWidth: 120 }}
                                    >
                                      <option value="any">Any</option>
                                      <option value="payee_entity_name">
                                        Payee Name
                                      </option>
                                      <option value="description">
                                        Description
                                      </option>
                                      <option value="invoice_reference_number">
                                        Invoice Ref
                                      </option>
                                      <option value="account_name">
                                        Account Name
                                      </option>
                                      <option value="account_code">
                                        Account Code
                                      </option>
                                    </TextField>
                                    <TextField
                                      select
                                      size="small"
                                      label="Match Type"
                                      value={newMatchType}
                                      onChange={(e) =>
                                        setNewMatchType(e.target.value)
                                      }
                                      disabled={!ptrsId || !profileId || busy}
                                      SelectProps={{ native: true }}
                                      sx={{ minWidth: 120 }}
                                    >
                                      <option value="contains">Contains</option>
                                      <option value="equals">Equals</option>
                                    </TextField>
                                    <Button
                                      variant="contained"
                                      startIcon={<AddIcon />}
                                      onClick={handleAddKeyword}
                                      disabled={!ptrsId || !profileId || busy}
                                    >
                                      Add
                                    </Button>
                                  </Stack>

                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Notes (optional)"
                                    value={newNotes}
                                    onChange={(e) =>
                                      setNewNotes(e.target.value)
                                    }
                                    disabled={!ptrsId || !profileId || busy}
                                  />
                                </Stack>

                                <Divider />

                                {Array.isArray(keywordRows) &&
                                keywordRows.length ? (
                                  <Box sx={{ overflowX: "auto" }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Keyword</TableCell>
                                          <TableCell>Field</TableCell>
                                          <TableCell>Match Type</TableCell>
                                          <TableCell>Notes</TableCell>
                                          <TableCell align="right">
                                            Actions
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {keywordRows.map((k) => (
                                          <TableRow key={k.id}>
                                            {editKeywordId === k.id ? (
                                              <>
                                                <TableCell>
                                                  <TextField
                                                    size="small"
                                                    value={editFields.keyword}
                                                    onChange={(e) =>
                                                      setEditFields((f) => ({
                                                        ...f,
                                                        keyword: e.target.value,
                                                      }))
                                                    }
                                                    disabled={busy}
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <TextField
                                                    select
                                                    size="small"
                                                    value={editFields.field}
                                                    onChange={(e) =>
                                                      setEditFields((f) => ({
                                                        ...f,
                                                        field: e.target.value,
                                                      }))
                                                    }
                                                    disabled={busy}
                                                    SelectProps={{
                                                      native: true,
                                                    }}
                                                  >
                                                    <option value="any">
                                                      Any
                                                    </option>
                                                    <option value="payee_entity_name">
                                                      Payee Name
                                                    </option>
                                                    <option value="description">
                                                      Description
                                                    </option>
                                                    <option value="invoice_reference_number">
                                                      Invoice Ref
                                                    </option>
                                                    <option value="account_name">
                                                      Account Name
                                                    </option>
                                                    <option value="account_code">
                                                      Account Code
                                                    </option>
                                                  </TextField>
                                                </TableCell>
                                                <TableCell>
                                                  <TextField
                                                    select
                                                    size="small"
                                                    value={editFields.matchType}
                                                    onChange={(e) =>
                                                      setEditFields((f) => ({
                                                        ...f,
                                                        matchType:
                                                          e.target.value,
                                                      }))
                                                    }
                                                    disabled={busy}
                                                    SelectProps={{
                                                      native: true,
                                                    }}
                                                  >
                                                    <option value="contains">
                                                      Contains
                                                    </option>
                                                    <option value="equals">
                                                      Equals
                                                    </option>
                                                  </TextField>
                                                </TableCell>
                                                <TableCell>
                                                  <TextField
                                                    size="small"
                                                    value={
                                                      editFields.notes || ""
                                                    }
                                                    onChange={(e) =>
                                                      setEditFields((f) => ({
                                                        ...f,
                                                        notes: e.target.value,
                                                      }))
                                                    }
                                                    disabled={busy}
                                                  />
                                                </TableCell>
                                                <TableCell align="right">
                                                  <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    sx={{ mr: 1 }}
                                                    onClick={() =>
                                                      handleSaveEdit(k)
                                                    }
                                                    disabled={busy}
                                                  >
                                                    Save
                                                  </Button>
                                                  <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={handleCancelEdit}
                                                    disabled={busy}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </TableCell>
                                              </>
                                            ) : (
                                              <>
                                                <TableCell>
                                                  {k.keyword}
                                                </TableCell>
                                                <TableCell>
                                                  {{
                                                    any: "Any",
                                                    payee_entity_name:
                                                      "Payee Name",
                                                    description: "Description",
                                                    invoice_reference_number:
                                                      "Invoice Ref",
                                                    account_name:
                                                      "Account Name",
                                                    account_code:
                                                      "Account Code",
                                                  }[k.field] || k.field}
                                                </TableCell>
                                                <TableCell>
                                                  {{
                                                    contains: "Contains",
                                                    equals: "Equals",
                                                  }[k.matchType] || k.matchType}
                                                </TableCell>
                                                <TableCell>
                                                  {k.notes || ""}
                                                </TableCell>
                                                <TableCell align="right">
                                                  <Tooltip title="Edit">
                                                    <span
                                                      style={{
                                                        display: "inline-flex",
                                                      }}
                                                    >
                                                      <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                          handleEditKeyword(k)
                                                        }
                                                        disabled={
                                                          busy ||
                                                          editKeywordId !== null
                                                        }
                                                      >
                                                        <RuleIcon fontSize="small" />
                                                      </IconButton>
                                                    </span>
                                                  </Tooltip>
                                                  <Tooltip title="Delete">
                                                    <span
                                                      style={{
                                                        display: "inline-flex",
                                                      }}
                                                    >
                                                      <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                          handleDeleteKeyword(
                                                            k.id,
                                                          )
                                                        }
                                                        disabled={
                                                          busy ||
                                                          editKeywordId !== null
                                                        }
                                                      >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                      </IconButton>
                                                    </span>
                                                  </Tooltip>
                                                </TableCell>
                                              </>
                                            )}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    No keywords saved yet.
                                  </Typography>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Stack>
                      </Grid>
                    );
                  }

                  return (
                    <Grid key={item.category} size={{ xs: 12, md: 6 }}>
                      <ExclusionCard
                        title={item.title}
                        description={item.description}
                        category={item.category}
                        enabled={item.enabled}
                        previewCount={previewCount}
                        previewRows={previewRows}
                        busy={busy}
                        isApplying={applyingCategory === item.category}
                        isPreviewing={
                          query?.isFetching === true &&
                          applyingCategory !== item.category
                        }
                        isInitialising={initialLoadInProgress}
                        onPreview={handlePreviewCategory}
                        onApply={handleApplyCategory}
                        canApply={canApply}
                        statusMessage={
                          applyingCategory === item.category
                            ? `Applying ${item.title.toLowerCase()} — this may take a while for large datasets.`
                            : query?.isFetched
                              ? toBeAffectedCount > 0
                                ? `${toBeAffectedCount} row(s) to be affected • ${alreadyExcludedCount} already excluded${summarySuffix}`
                                : `No remaining rows to affect${summarySuffix}`
                              : "Preview this category before applying."
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ mt: 1 }} />

        <Box>
          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            disabled={!ptrsId}
            onClick={handleNext}
          >
            Next: Rules
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
