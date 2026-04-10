import {
  Box,
  Typography,
  Paper,
  Stack,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  Drawer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadMockStagedRows } from "../mock/mockStagedRows";

export default function LearningPanel() {
  const [sortBy, setSortBy] = useState("payment_time_days");
  const [sortDirection, setSortDirection] = useState("desc");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [paymentTermsFilter, setPaymentTermsFilter] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [detailRow, setDetailRow] = useState(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState("exclude");
  const [reasonCode, setReasonCode] = useState("not_reportable");
  const [decisionNote, setDecisionNote] = useState("");

  const [extraVisibleColumns, setExtraVisibleColumns] = useState([]);
  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(false);
  const [showMissingAbnOnly, setShowMissingAbnOnly] = useState(false);
  const [showMissingTermsOnly, setShowMissingTermsOnly] = useState(false);
  const [showNegativeAmountsOnly, setShowNegativeAmountsOnly] = useState(false);
  const [showTinyAmountsOnly, setShowTinyAmountsOnly] = useState(false);
  const [showHighDaysOnly, setShowHighDaysOnly] = useState(false);
  const [similarRowIds, setSimilarRowIds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const rows = await loadMockStagedRows();
        if (!isMounted) return;
        setData(
          rows.slice(0, 100).map((row, idx) => ({
            ...row,
            __mockId: `${row["Document Number"] || row.invoice_reference_number || "row"}-${idx}`,
            __reviewStatus: "unreviewed",
            __decisionType: "",
            __reasonCode: "",
            __decisionNote: "",
          })),
        );
      } catch (err) {
        if (!isMounted) return;
        setData([]);
        setLoadError(err?.message || "Failed to load staged rows");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRows = data.filter((row) => {
    const matchesSupplier = supplierFilter
      ? String(row["Name 1"] || "")
          .toLowerCase()
          .includes(supplierFilter.toLowerCase())
      : true;

    const matchesDocumentType = documentTypeFilter
      ? String(row["Document Type"] || "") === documentTypeFilter
      : true;

    const matchesPaymentTerms = paymentTermsFilter
      ? String(row["Payment terms"] || "") === paymentTermsFilter
      : true;

    const payeeAbn = String(
      row.payee_entity_abn || row["ABN /Tax number"] || "",
    ).trim();
    const paymentTerms = String(
      row["Payment terms"] || row.invoice_payment_terms || "",
    ).trim();
    const amount =
      Number(
        String(row.payment_amount || "0")
          .replace(/[(),]/g, "")
          .replace(/,/g, ""),
      ) || 0;
    const days = Number(row.payment_time_days || 0);

    const matchesUnreviewed = showUnreviewedOnly
      ? row.__reviewStatus !== "reviewed"
      : true;

    const matchesMissingAbn = showMissingAbnOnly ? !payeeAbn : true;

    const matchesMissingTerms = showMissingTermsOnly ? !paymentTerms : true;

    const matchesNegativeAmounts = showNegativeAmountsOnly ? amount < 0 : true;

    const matchesTinyAmountsOnly = showTinyAmountsOnly
      ? Math.abs(amount) > 0 && Math.abs(amount) <= 1
      : true;

    const matchesHighDaysOnly = showHighDaysOnly ? days >= 45 : true;

    return (
      matchesSupplier &&
      matchesDocumentType &&
      matchesPaymentTerms &&
      matchesUnreviewed &&
      matchesMissingAbn &&
      matchesMissingTerms &&
      matchesNegativeAmounts &&
      matchesTinyAmountsOnly &&
      matchesHighDaysOnly
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "payment_amount") {
      const aVal = Number(String(a.payment_amount || "0").replace(/,/g, ""));
      const bVal = Number(String(b.payment_amount || "0").replace(/,/g, ""));
      return (aVal - bVal) * direction;
    }

    if (sortBy === "payment_time_days") {
      return (
        ((a.payment_time_days || 0) - (b.payment_time_days || 0)) * direction
      );
    }

    const aVal = String(a[sortBy] ?? "");
    const bVal = String(b[sortBy] ?? "");

    return aVal.localeCompare(bVal) * direction;
  });

  const excludedColumns = new Set([
    "_ptrsMeta",
    "s4_invoice_key",
    "vendormaster__Region",
    "entitystructure__Notes",
    "vendormaster__Bank Key",
    "entitystructure__Revenue",
    "entitystructure__Trading",
    "entitystructure__column_13",
    "vendormaster__Bank Account",
    "entitystructure__subsidiary",
    "vendormaster__Account Group",
    "vendormaster__Payment Block",
    "vendormaster__Payment Function",
    "vendormaster__E-Mail Address",
    "vendormaster__Liable for VAT",
    "vendormaster__eftSure Status",
    "vendormaster__Payment Methods",
    "vendormaster__Vendor Active ?",
    "vendormaster__Partner Function",
    "vendormaster__Minority Indicator",
    "entitystructure__Reporting Entity",
    "vendormaster__Bank Country/Region",
    "vendormaster__CoCd deletion block",
    "vendormaster__Eval. Receipt Sett.",
    "vendormaster__Clrk's internet add.",
    "vendormaster__GR-Based Inv. Verif.",
    "vendormaster__Central posting block",
    "vendormaster__Central purchasing block",
    "vendormaster__Collection authorization",
    "entitystructure__Entered on Portal -RAM",
    "entitystructure__Ultimate Controlling Entity",
    "vendormaster__Posting block for company code",
    "vendormaster__Purch. block for purchasing organization",
  ]);

  const allColumns = Object.keys(sortedRows[0] || {}).filter(
    (col) => !excludedColumns.has(col),
  );

  const defaultVisibleColumns = [
    "__reviewStatus",
    "Name 1",
    "Document Type",
    "Reference",
    "Document Number",
    "payment_amount",
    "payment_time_days",
    "Payment terms",
    "payment_date",
    "invoice_issue_date",
    "invoice_due_date",
    "payee_entity_name",
    "payee_entity_abn",
    "payer_entity_name",
    "payer_entity_abn",
  ];

  const documentTypeOptions = [
    ...new Set(
      data.map((row) => String(row["Document Type"] || "")).filter(Boolean),
    ),
  ].sort();

  const paymentTermsOptions = [
    ...new Set(
      data.map((row) => String(row["Payment terms"] || "")).filter(Boolean),
    ),
  ].sort();

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  };

  const visibleColumns = [
    ...defaultVisibleColumns.filter((col) =>
      col === "__reviewStatus"
        ? true
        : allColumns.includes(col) || col.startsWith("__"),
    ),
    ...extraVisibleColumns.filter(
      (col) =>
        !defaultVisibleColumns.includes(col) &&
        allColumns.includes(col) &&
        !col.startsWith("__"),
    ),
  ];

  const availableExtraColumns = allColumns.filter(
    (col) => !defaultVisibleColumns.includes(col) && !col.startsWith("__"),
  );

  const isAllSelected =
    sortedRows.length > 0 && selectedRowIds.length === sortedRows.length;

  const isSomeSelected =
    selectedRowIds.length > 0 && selectedRowIds.length < sortedRows.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(sortedRows.map((row) => row.__mockId));
  };

  const handleToggleRow = (rowId) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId],
    );
  };

  const handleOpenDecisionDialog = () => {
    if (!selectedRowIds.length) return;
    setDecisionDialogOpen(true);
  };

  const handleCloseDecisionDialog = () => {
    setDecisionDialogOpen(false);
  };

  const handleApplyMockDecision = () => {
    setData((prev) =>
      prev.map((row) => {
        if (!selectedRowIds.includes(row.__mockId)) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: decisionType,
          __reasonCode: reasonCode,
          __decisionNote: decisionNote,
        };
      }),
    );

    setSelectedRowIds([]);
    setDecisionDialogOpen(false);
    setDecisionType("exclude");
    setReasonCode("not_reportable");
    setDecisionNote("");
  };

  const applyPresetDecisionToIds = ({ rowIds, type, reason, note = "" }) => {
    if (!rowIds.length) return;

    setData((prev) =>
      prev.map((row) => {
        if (!rowIds.includes(row.__mockId)) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: type,
          __reasonCode: reason,
          __decisionNote: note,
        };
      }),
    );

    setSelectedRowIds([]);
  };

  const applyPresetDecisionToDetailRow = ({ type, reason, note = "" }) => {
    if (!detailRow?.__mockId) return;

    setData((prev) =>
      prev.map((row) => {
        if (row.__mockId !== detailRow.__mockId) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: type,
          __reasonCode: reason,
          __decisionNote: note,
        };
      }),
    );

    setDetailRow((prev) =>
      prev
        ? {
            ...prev,
            __reviewStatus: "reviewed",
            __decisionType: type,
            __reasonCode: reason,
            __decisionNote: note,
          }
        : prev,
    );
  };

  const renderReviewedCell = (row) => {
    if (row.__reviewStatus !== "reviewed") {
      return <Chip size="small" label="Unreviewed" variant="outlined" />;
    }

    const label = row.__decisionType
      ? `${row.__decisionType}${row.__reasonCode ? `: ${row.__reasonCode}` : ""}`
      : "Reviewed";

    return <Chip size="small" label={label} color="success" />;
  };

  const getSimilarityScore = (baseRow, compareRow) => {
    let score = 0;

    if (
      (baseRow["Name 1"] || "") &&
      baseRow["Name 1"] === compareRow["Name 1"]
    ) {
      score += 3;
    }

    if (
      (baseRow["Document Type"] || "") &&
      baseRow["Document Type"] === compareRow["Document Type"]
    ) {
      score += 2;
    }

    if (
      (baseRow["Payment terms"] || "") &&
      baseRow["Payment terms"] === compareRow["Payment terms"]
    ) {
      score += 2;
    }

    if (
      (baseRow.Reference || "") &&
      (compareRow.Reference || "") &&
      baseRow.Reference === compareRow.Reference
    ) {
      score += 2;
    }

    if (
      (baseRow.payee_entity_abn || "") &&
      baseRow.payee_entity_abn === compareRow.payee_entity_abn
    ) {
      score += 2;
    }

    return score;
  };

  const handleSuggestSimilarRows = () => {
    if (!detailRow) return;

    const matches = data
      .filter((row) => row.__mockId !== detailRow.__mockId)
      .map((row) => ({
        id: row.__mockId,
        score: getSimilarityScore(detailRow, row),
      }))
      .filter((row) => row.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((row) => row.id);

    setSimilarRowIds(matches);
  };

  const handleClearSimilarRows = () => {
    setSimilarRowIds([]);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Typography variant="h5">Learning & Review</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 3 }} color="text.secondary">
        Review grouped records, identify patterns, and decide how they should be
        treated going forward.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Raw Records (Exploration)</Typography>
            <Typography variant="body2" color="text.secondary">
              {sortedRows.length} rows
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Supplier contains:</Typography>
              <Box
                component="input"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                sx={{
                  px: 1,
                  py: 0.75,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  color: "text.primary",
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Document Type:</Typography>
              <Select
                size="small"
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All</MenuItem>
                {documentTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Payment Terms:</Typography>
              <Select
                size="small"
                value={paymentTermsFilter}
                onChange={(e) => setPaymentTermsFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All</MenuItem>
                {paymentTermsOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 320 }}>
              <InputLabel id="extra-columns-label">Extra Columns</InputLabel>
              <Select
                labelId="extra-columns-label"
                multiple
                value={extraVisibleColumns}
                onChange={(e) => setExtraVisibleColumns(e.target.value)}
                input={<OutlinedInput label="Extra Columns" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {availableExtraColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Checkbox checked={extraVisibleColumns.includes(col)} />
                    <Typography variant="body2">{col}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showUnreviewedOnly}
                    onChange={(e) => setShowUnreviewedOnly(e.target.checked)}
                  />
                }
                label="Unreviewed only"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showMissingAbnOnly}
                    onChange={(e) => setShowMissingAbnOnly(e.target.checked)}
                  />
                }
                label="Missing ABN"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showMissingTermsOnly}
                    onChange={(e) => setShowMissingTermsOnly(e.target.checked)}
                  />
                }
                label="Missing terms"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showNegativeAmountsOnly}
                    onChange={(e) =>
                      setShowNegativeAmountsOnly(e.target.checked)
                    }
                  />
                }
                label="Negative amounts"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showTinyAmountsOnly}
                    onChange={(e) => setShowTinyAmountsOnly(e.target.checked)}
                  />
                }
                label="Zero / tiny amounts"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showHighDaysOnly}
                    onChange={(e) => setShowHighDaysOnly(e.target.checked)}
                  />
                }
                label="45+ days"
              />
            </Stack>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                {selectedRowIds.length} selected
              </Typography>
              <Button
                variant="contained"
                size="small"
                disabled={!selectedRowIds.length}
                onClick={handleOpenDecisionDialog}
              >
                Apply Decision
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "include",
                    reason: "confirmed_include",
                    note: "Included as-is via preset",
                  })
                }
              >
                Include as-is
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "exclude",
                    reason: "duplicate",
                    note: "Excluded via duplicate preset",
                  })
                }
              >
                Exclude duplicate
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "exclude",
                    reason: "transfer",
                    note: "Excluded via transfer preset",
                  })
                }
              >
                Exclude transfer
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "classify",
                    reason: "follow_up",
                    note: "Marked for follow-up via preset",
                  })
                }
              >
                Mark follow-up
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                Click a row to inspect it. Use checkboxes to build a review
                group.
              </Typography>
              {similarRowIds.length ? (
                <Chip
                  size="small"
                  color="info"
                  label={`${similarRowIds.length} similar row(s) highlighted`}
                  onDelete={handleClearSimilarRows}
                />
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        {isLoading ? (
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Loading staged rows...
          </Typography>
        ) : null}

        {loadError ? (
          <Typography variant="body2" sx={{ mt: 2 }} color="error">
            {loadError}
          </Typography>
        ) : null}

        {!isLoading && !loadError ? (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleToggleSelectAll}
                  />
                </TableCell>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col}
                    onClick={() =>
                      col === "__reviewStatus" ? null : handleSortChange(col)
                    }
                    sx={{
                      cursor: col === "__reviewStatus" ? "default" : "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col === "__reviewStatus" ? "Review Status" : col}
                    {sortBy === col
                      ? sortDirection === "asc"
                        ? " ↑"
                        : " ↓"
                      : ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((row) => {
                const isSelected = selectedRowIds.includes(row.__mockId);
                const isSimilar = similarRowIds.includes(row.__mockId);

                return (
                  <TableRow
                    key={row.__mockId}
                    hover
                    selected={isSelected}
                    onClick={() => setDetailRow(row)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isSimilar ? "action.hover" : undefined,
                    }}
                  >
                    <TableCell
                      padding="checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRow(row.__mockId);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col}>
                        {col === "__reviewStatus"
                          ? renderReviewedCell(row)
                          : String(row[col] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
      >
        <Box sx={{ width: 520, p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Row Detail</Typography>
              <Typography variant="body2" color="text.secondary">
                Inspect the record and its current mock review state.
              </Typography>
            </Box>

            {detailRow ? (
              <>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Review Status</Typography>
                    {renderReviewedCell(detailRow)}
                    {detailRow.__decisionNote ? (
                      <Typography variant="body2" color="text.secondary">
                        {detailRow.__decisionNote}
                      </Typography>
                    ) : null}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ pt: 1 }}
                      flexWrap="wrap"
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSuggestSimilarRows}
                      >
                        Suggest Similar Rows
                      </Button>
                      {similarRowIds.length ? (
                        <Button size="small" onClick={handleClearSimilarRows}>
                          Clear Suggestions
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "include",
                            reason: "confirmed_include",
                            note: "Included as-is via preset",
                          })
                        }
                      >
                        Include as-is
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "exclude",
                            reason: "duplicate",
                            note: "Excluded via duplicate preset",
                          })
                        }
                      >
                        Exclude duplicate
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "exclude",
                            reason: "transfer",
                            note: "Excluded via transfer preset",
                          })
                        }
                      >
                        Exclude transfer
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "classify",
                            reason: "follow_up",
                            note: "Marked for follow-up via preset",
                          })
                        }
                      >
                        Mark follow-up
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Key Fields</Typography>
                    {defaultVisibleColumns
                      .filter((col) => col !== "__reviewStatus")
                      .map((col) => (
                        <Typography key={col} variant="body2">
                          <strong>{col}:</strong> {String(detailRow[col] ?? "")}
                        </Typography>
                      ))}
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Raw Record</Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        overflow: "auto",
                        bgcolor: "background.default",
                        borderRadius: 1,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {JSON.stringify(detailRow, null, 2)}
                    </Box>
                  </Stack>
                </Paper>
              </>
            ) : null}
          </Stack>
        </Box>
      </Drawer>

      <Dialog
        open={decisionDialogOpen}
        onClose={handleCloseDecisionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Apply Mock Review Decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This is frontend-only for now. We are pretending the backend
              exists and saves the review group and decision.
            </Typography>

            <Typography variant="body2">
              {selectedRowIds.length} row(s) selected
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="decision-type-label">Decision Type</InputLabel>
              <Select
                labelId="decision-type-label"
                value={decisionType}
                label="Decision Type"
                onChange={(e) => setDecisionType(e.target.value)}
              >
                <MenuItem value="include">Include</MenuItem>
                <MenuItem value="exclude">Exclude</MenuItem>
                <MenuItem value="classify">Classify</MenuItem>
                <MenuItem value="terms_override">Terms Override</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="reason-code-label">Reason Code</InputLabel>
              <Select
                labelId="reason-code-label"
                value={reasonCode}
                label="Reason Code"
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <MenuItem value="not_reportable">Not reportable</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
                <MenuItem value="intra_group">Intra-group</MenuItem>
                <MenuItem value="employee_related">Employee related</MenuItem>
                <MenuItem value="government_related">
                  Government related
                </MenuItem>
                <MenuItem value="duplicate">Duplicate</MenuItem>
                <MenuItem value="confirmed_include">Confirmed include</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
                <MenuItem value="partial_payment">Partial payment</MenuItem>
                <MenuItem value="prepayment">Prepayment</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Note"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDecisionDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyMockDecision}>
            Save Mock Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
