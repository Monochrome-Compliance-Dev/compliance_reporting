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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import {
  useApplyExclusionsMutation,
  useExclusionsPreviewQuery,
  useExclusionKeywordsQuery,
  useCreateExclusionKeywordMutation,
  useUpdateExclusionKeywordMutation,
  useDeleteExclusionKeywordMutation,
} from "v2/ptrs/hooks/usePtrsQueries";
import { useNavigate } from "react-router";
import { useMemo, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RuleIcon from "@mui/icons-material/Rule";

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
          {rows.map((r, idx) => (
            <TableRow key={`${r?.row_no ?? idx}`}>
              <TableCell>{r?.payee_entity_name || "-"}</TableCell>
              <TableCell>{r?.payee_entity_abn || "-"}</TableCell>
              <TableCell>{r?.invoice_reference_number || "-"}</TableCell>
              <TableCell>{r?.account_code || "-"}</TableCell>
              <TableCell>{r?.payment_date || "-"}</TableCell>
              <TableCell align="right">{r?.payment_amount || "-"}</TableCell>
              <TableCell>{r?.exclude_comment || "-"}</TableCell>
              <TableCell>{r?.description || "-"}</TableCell>
            </TableRow>
          ))}
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
  statusMessage,
}) {
  const [showSample, setShowSample] = useState(false);
  const hasRows = Array.isArray(previewRows) && previewRows.length > 0;
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

      <CardActions sx={{ px: 2, pb: 2 }}>
        {statusMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 2, alignSelf: "center" }}
          >
            {statusMessage}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onPreview}
            disabled={!enabled || busy}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<RuleIcon />}
            onClick={onApply}
            disabled={!enabled || busy}
          >
            Apply
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

export default function ExclusionsPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId, profileId } = usePtrsV2Context();

  const applyMutation = useApplyExclusionsMutation(ptrsId);
  const govPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "gov",
    limit: 5,
  });

  const intraPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "intra_company",
    limit: 5,
  });

  const employeePreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "employee",
    limit: 5,
  });

  const partialPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "partial",
    limit: 5,
  });

  const prepaidPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "prepaid",
    limit: 5,
  });

  const keywordPreviewQuery = useExclusionsPreviewQuery(ptrsId, {
    profileId,
    category: "keyword",
    limit: 5,
  });

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

  const employeeAlreadyExcludedCount = useMemo(() => {
    const total =
      employeePreviewQuery.data?.result?.alreadyExcludedCounts?.employee ??
      null;

    if (Number.isFinite(total)) return Number(total);

    const rows = employeePreviewQuery.data?.result?.samples?.employee || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [employeePreviewQuery.data]);

  const govAlreadyExcludedCount = useMemo(() => {
    const total =
      govPreviewQuery.data?.result?.alreadyExcludedCounts?.gov ?? null;

    // Prefer backend-provided total (covers the whole dataset, not just the sample)
    if (Number.isFinite(total)) return Number(total);

    // Fallback: sample-based estimate (only used if backend doesn't provide totals)
    const rows = govPreviewQuery.data?.result?.samples?.gov || [];

    if (!rows.length) return 0;

    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [govPreviewQuery.data]);

  const intraAlreadyExcludedCount = useMemo(() => {
    const total =
      intraPreviewQuery.data?.result?.alreadyExcludedCounts?.intra_company ??
      null;

    if (Number.isFinite(total)) return Number(total);

    const rows = intraPreviewQuery.data?.result?.samples?.intra_company || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [intraPreviewQuery.data]);

  const partialAlreadyExcludedCount = useMemo(() => {
    const total =
      partialPreviewQuery.data?.result?.alreadyExcludedCounts?.partial ?? null;

    if (Number.isFinite(total)) return Number(total);

    const rows = partialPreviewQuery.data?.result?.samples?.partial || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [partialPreviewQuery.data]);

  const prepaidAlreadyExcludedCount = useMemo(() => {
    const total =
      prepaidPreviewQuery.data?.result?.alreadyExcludedCounts?.prepaid ?? null;

    if (Number.isFinite(total)) return Number(total);

    const rows = prepaidPreviewQuery.data?.result?.samples?.prepaid || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [prepaidPreviewQuery.data]);

  const busy =
    applyMutation.isLoading ||
    govPreviewQuery.isFetching ||
    intraPreviewQuery.isFetching ||
    employeePreviewQuery.isFetching ||
    partialPreviewQuery.isFetching ||
    prepaidPreviewQuery.isFetching ||
    keywordPreviewQuery.isFetching ||
    keywordListQuery.isFetching ||
    createKeywordMutation.isLoading ||
    deleteKeywordMutation.isLoading;

  const keywordAlreadyExcludedCount = useMemo(() => {
    const total =
      keywordPreviewQuery.data?.result?.alreadyExcludedCounts?.keyword ?? null;
    if (Number.isFinite(total)) return Number(total);
    const rows = keywordPreviewQuery.data?.result?.samples?.keyword || [];
    if (!rows.length) return 0;
    return rows.filter((r) => r?.alreadyExcluded === true).length;
  }, [keywordPreviewQuery.data]);

  const handlePreviewKeyword = async () => {
    try {
      showAlert("Previewing custom keyword exclusions…", "info");
      const out = await keywordPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handleApplyKeyword = async () => {
    try {
      showAlert("Applying custom keyword exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "keyword",
      });
      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");
      keywordPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handlePreviewGov = async () => {
    try {
      showAlert("Previewing government entity exclusions…", "info");
      const out = await govPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handlePreviewIntra = async () => {
    try {
      showAlert("Previewing intra-company exclusions…", "info");
      const out = await intraPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handlePreviewEmployee = async () => {
    try {
      showAlert("Previewing employee & payroll exclusions…", "info");
      const out = await employeePreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handlePreviewPartial = async () => {
    try {
      showAlert("Previewing partial payments…", "info");
      const out = await partialPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handlePreviewPrepaid = async () => {
    try {
      showAlert("Previewing pre-payments…", "info");
      const out = await prepaidPreviewQuery.refetch();
      if (out?.error) throw out.error;
      showAlert("Preview loaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to preview exclusions.", "error");
    }
  };

  const handleApplyPrepaid = async () => {
    try {
      showAlert("Applying pre-payment exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "prepaid",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      prepaidPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleApplyGov = async () => {
    try {
      showAlert("Applying government entity exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "gov",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      // Refresh preview so inline counts reflect the new state
      govPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleApplyIntra = async () => {
    try {
      showAlert("Applying intra-company exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "intra_company",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      intraPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleApplyEmployee = async () => {
    try {
      showAlert("Applying employee & payroll exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "employee",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      employeePreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
    }
  };

  const handleApplyPartial = async () => {
    try {
      showAlert("Applying partial payment exclusions…", "info");
      const res = await applyMutation.mutateAsync({
        profileId,
        category: "partial",
      });

      const persisted = res?.persisted ?? 0;
      showAlert(`Applied. ${persisted} row(s) re-evaluated.`, "success");

      partialPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to apply exclusions.", "error");
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
      await keywordPreviewQuery.refetch();
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
      await keywordPreviewQuery.refetch();
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
      await keywordPreviewQuery.refetch();
    } catch (err) {
      showAlert(err?.message || "Failed to remove keyword.", "error");
    }
  };

  const handleNext = () => {
    navigate(
      `/v2/ptrs/rules?ptrsId=${ptrsId}${profileId ? `&profileId=${profileId}` : ""}`,
    );
  };

  const cards = useMemo(
    () => [
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
      {
        title: "Custom keyword exclusions",
        description:
          "Exclude rows when a keyword/phrase matches key fields (seed via tbl_ptrs_exclusion_keyword_customer_ref).",
        category: "keyword",
        enabled: true,
      },
      {
        title: "Partial payments",
        description:
          "Exclude earlier payments where multiple payments exist for the same invoice reference.",
        category: "partial",
        enabled: true,
      },
      {
        title: "Pre-payments",
        description:
          "Exclude payments with prepaid terms such as PREPAID (where applicable).",
        category: "prepaid",
        enabled: true,
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

        <Stack spacing={2} sx={{ mt: 1 }}>
          {cards.map((c) => {
            if (c.category === "gov") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    govPreviewQuery.isFetched
                      ? (govPreviewQuery.data?.result?.counts?.gov ?? 0)
                      : null
                  }
                  previewRows={govPreviewQuery.data?.result?.samples?.gov ?? []}
                  busy={busy}
                  onPreview={handlePreviewGov}
                  onApply={handleApplyGov}
                  statusMessage={
                    govPreviewQuery.isFetched
                      ? `${govAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }
            if (c.category === "intra_company") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    intraPreviewQuery.isFetched
                      ? (intraPreviewQuery.data?.result?.counts
                          ?.intra_company ?? 0)
                      : null
                  }
                  previewRows={
                    intraPreviewQuery.data?.result?.samples?.intra_company ?? []
                  }
                  busy={busy}
                  onPreview={handlePreviewIntra}
                  onApply={handleApplyIntra}
                  statusMessage={
                    intraPreviewQuery.isFetched
                      ? `${intraAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }

            if (c.category === "employee") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    employeePreviewQuery.isFetched
                      ? (employeePreviewQuery.data?.result?.counts?.employee ??
                        0)
                      : null
                  }
                  previewRows={
                    employeePreviewQuery.data?.result?.samples?.employee ?? []
                  }
                  busy={busy}
                  onPreview={handlePreviewEmployee}
                  onApply={handleApplyEmployee}
                  statusMessage={
                    employeePreviewQuery.isFetched
                      ? `${employeeAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }

            if (c.category === "partial") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    partialPreviewQuery.isFetched
                      ? (partialPreviewQuery.data?.result?.counts?.partial ?? 0)
                      : null
                  }
                  previewRows={
                    partialPreviewQuery.data?.result?.samples?.partial ?? []
                  }
                  busy={busy}
                  onPreview={handlePreviewPartial}
                  onApply={handleApplyPartial}
                  statusMessage={
                    partialPreviewQuery.isFetched
                      ? `${partialAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }

            if (c.category === "keyword") {
              const keywordRows = keywordListQuery.data?.rows || [];

              return (
                <Stack key={c.category} spacing={1}>
                  <ExclusionCard
                    title={c.title}
                    description={c.description}
                    category={c.category}
                    enabled={c.enabled}
                    previewCount={
                      keywordPreviewQuery.isFetched
                        ? (keywordPreviewQuery.data?.result?.counts?.keyword ??
                          0)
                        : null
                    }
                    previewRows={
                      keywordPreviewQuery.data?.result?.samples?.keyword ?? []
                    }
                    busy={busy}
                    onPreview={handlePreviewKeyword}
                    onApply={handleApplyKeyword}
                    statusMessage={
                      keywordPreviewQuery.isFetched
                        ? `${keywordAlreadyExcludedCount} row(s) already excluded`
                        : null
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
                          <Typography variant="subtitle1" fontWeight={600}>
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

                        <Typography variant="body2" color="text.secondary">
                          Add words or phrases that should exclude rows (matches
                          payee name, description, invoice ref, account
                          name/code).
                        </Typography>

                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Keyword or phrase"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
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
                              onChange={(e) => setNewField(e.target.value)}
                              disabled={!ptrsId || !profileId || busy}
                              SelectProps={{ native: true }}
                              sx={{ minWidth: 120 }}
                            >
                              <option value="any">Any</option>
                              <option value="payee_entity_name">
                                Payee Name
                              </option>
                              <option value="description">Description</option>
                              <option value="invoice_reference_number">
                                Invoice Ref
                              </option>
                              <option value="account_name">Account Name</option>
                              <option value="account_code">Account Code</option>
                            </TextField>
                            <TextField
                              select
                              size="small"
                              label="Match Type"
                              value={newMatchType}
                              onChange={(e) => setNewMatchType(e.target.value)}
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
                            onChange={(e) => setNewNotes(e.target.value)}
                            disabled={!ptrsId || !profileId || busy}
                          />
                        </Stack>

                        <Divider />

                        {Array.isArray(keywordRows) && keywordRows.length ? (
                          <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Keyword</TableCell>
                                  <TableCell>Field</TableCell>
                                  <TableCell>Match Type</TableCell>
                                  <TableCell>Notes</TableCell>
                                  <TableCell align="right">Actions</TableCell>
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
                                            SelectProps={{ native: true }}
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
                                        </TableCell>
                                        <TableCell>
                                          <TextField
                                            select
                                            size="small"
                                            value={editFields.matchType}
                                            onChange={(e) =>
                                              setEditFields((f) => ({
                                                ...f,
                                                matchType: e.target.value,
                                              }))
                                            }
                                            disabled={busy}
                                            SelectProps={{ native: true }}
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
                                            value={editFields.notes || ""}
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
                                            onClick={() => handleSaveEdit(k)}
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
                                        <TableCell>{k.keyword}</TableCell>
                                        <TableCell>
                                          {{
                                            any: "Any",
                                            payee_entity_name: "Payee Name",
                                            description: "Description",
                                            invoice_reference_number:
                                              "Invoice Ref",
                                            account_name: "Account Name",
                                            account_code: "Account Code",
                                          }[k.field] || k.field}
                                        </TableCell>
                                        <TableCell>
                                          {{
                                            contains: "Contains",
                                            equals: "Equals",
                                          }[k.matchType] || k.matchType}
                                        </TableCell>
                                        <TableCell>{k.notes || ""}</TableCell>
                                        <TableCell align="right">
                                          <Tooltip title="Edit">
                                            <span
                                              style={{ display: "inline-flex" }}
                                            >
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleEditKeyword(k)
                                                }
                                                disabled={
                                                  busy || editKeywordId !== null
                                                }
                                              >
                                                <RuleIcon fontSize="small" />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                          <Tooltip title="Delete">
                                            <span
                                              style={{ display: "inline-flex" }}
                                            >
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleDeleteKeyword(k.id)
                                                }
                                                disabled={
                                                  busy || editKeywordId !== null
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
                          <Typography variant="body2" color="text.secondary">
                            No keywords saved yet.
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              );
            }

            if (c.category === "prepaid") {
              return (
                <ExclusionCard
                  key={c.category}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  enabled={c.enabled}
                  previewCount={
                    prepaidPreviewQuery.isFetched
                      ? (prepaidPreviewQuery.data?.result?.counts?.prepaid ?? 0)
                      : null
                  }
                  previewRows={
                    prepaidPreviewQuery.data?.result?.samples?.prepaid ?? []
                  }
                  busy={busy}
                  onPreview={handlePreviewPrepaid}
                  onApply={handleApplyPrepaid}
                  statusMessage={
                    prepaidPreviewQuery.isFetched
                      ? `${prepaidAlreadyExcludedCount} row(s) already excluded`
                      : null
                  }
                />
              );
            }

            return (
              <ExclusionCard
                key={c.category}
                title={c.title}
                description={c.description}
                category={c.category}
                enabled={c.enabled}
                previewCount={null}
                previewRows={[]}
                busy={busy}
                onPreview={() => {}}
                onApply={() => {}}
              />
            );
          })}
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
