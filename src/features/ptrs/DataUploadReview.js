import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Chip,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tcpService, dcService, ptrsService } from "../../services";
import PayeesMissingAbnTable from "./PayeesMissingAbnTable";
import { getFieldLabel } from "./fieldMeta";
import { useAlert, usePtrsContext } from "../../context";

const DataUploadReview = ({
  errors = [],
  validRecordsPreview = [],
  onErrorsUpdated,
  onRecordsUpdated,
  onRefreshClick, // provided by parent
  // optional pagination props from parent
  errorsPage,
  errorsPageSize,
  errorsTotal,
  onErrorsPageChange,
  onErrorsPageSizeChange,
  // optional pagination props for valid records
  validPage,
  validPageSize,
  validTotal,
  onValidPageChange,
  onValidPageSizeChange,
}) => {
  // console.log(
  //   "errors, validRecordsPreview, onErrorsUpdated,  onRecordsUpdated,  onRefreshClick:",
  //   errors,
  //   validRecordsPreview,
  //   onErrorsUpdated,
  //   onRecordsUpdated,
  //   onRefreshClick
  // );
  const [loadingErrors] = useState(false);
  const [validRows, setValidRows] = useState(validRecordsPreview);
  const [editedRows, setEditedRows] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Collapsed state for hiding the card after validation
  const [collapse, setCollapse] = useState(false);
  // Handler for confirming validation and navigating
  const navigate = useNavigate();
  const { activePtrsId } = usePtrsContext();

  // --- Bulk selection for error rows ---
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [selectedValidIds, setSelectedValidIds] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [pendingDeleteType, setPendingDeleteType] = useState("error"); // "error" | "valid"
  const [validCountOverride, setValidCountOverride] = useState(null);
  // --- Delete confirmation dialog helpers ---
  const openDeleteDialog = (ids, type = "error") => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setPendingDeleteIds(ids);
    setPendingDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activePtrsId || pendingDeleteIds.length === 0) {
      setDeleteDialogOpen(false);
      return;
    }
    try {
      setDeleting(true);

      if (pendingDeleteType === "error") {
        // Delete from tcp_error (errors tab)
        await tcpService.bulkDeleteErrors(activePtrsId, pendingDeleteIds);

        const idSet = new Set(pendingDeleteIds);
        const updatedErrors = safeErrors.filter((e) => !idSet.has(e.id));
        const updatedValid = (validRows || []).filter((v) => !idSet.has(v.id));
        onRecordsUpdated?.(updatedErrors, updatedValid);
        onErrorsUpdated?.(updatedErrors);

        setSelectedRowIds((prev) => {
          const next = new Set(prev);
          pendingDeleteIds.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        // Delete from tcp (valid rows)
        await tcpService.bulkDelete(activePtrsId, pendingDeleteIds);

        const idSet = new Set(pendingDeleteIds);
        const updatedValid = (validRows || []).filter((v) => !idSet.has(v.id));
        setValidRows(updatedValid);
        onRecordsUpdated?.(safeErrors, updatedValid);
        setSelectedValidIds(new Set());
      }

      onRefreshClick?.();
      const n = pendingDeleteIds.length;
      showAlert(`Deleted ${n} record${n === 1 ? "" : "s"}.`, "success");
    } catch (err) {
      console.error("Bulk delete failed:", err);
      showAlert("Delete failed. Please try again.", "error");
    } finally {
      setDeleting(false);
      setDeletingIds(new Set());
      setPendingDeleteIds([]);
      setDeleteDialogOpen(false);
    }
  };

  const fieldLabel = (key, fallback) => getFieldLabel(key, fallback || key);

  const revalidateRow = (row) => {
    const issues = [];
    if (!row.payerEntityName || row.payerEntityName.trim() === "")
      issues.push("Missing or invalid Payer Entity Name");
    if (!row.payeeEntityName || row.payeeEntityName.trim() === "")
      issues.push("Missing or invalid Payee Entity Name");
    if (!row.payeeEntityAbn || !/^\d{11}$/.test(row.payeeEntityAbn))
      issues.push("Missing or invalid Payee Entity ABN");
    if (isNaN(parseFloat(row.paymentAmount)))
      issues.push("Missing or invalid Payment Amount");
    if (!row.paymentDate || isNaN(Date.parse(row.paymentDate)))
      issues.push("Missing or invalid Payment Date");
    return issues;
  };

  const safeErrors = useMemo(
    () => (Array.isArray(errors) ? errors : []),
    [errors]
  );

  // Derive paged vs total error counts for chips
  const errorsShown = safeErrors.length;
  const errorsAll = useMemo(
    () => (Number.isFinite(errorsTotal) ? Number(errorsTotal) : errorsShown),
    [errorsTotal, errorsShown]
  );
  const totalRows = useMemo(
    () => (validRows?.length || 0) + errorsAll,
    [validRows, errorsAll]
  );
  const errorsChipLabel = useMemo(
    () =>
      `⚠️ ${errorsAll} errors${errorsAll !== errorsShown ? ` (${errorsShown} shown)` : ""}`,
    [errorsAll, errorsShown]
  );

  const validShown = useMemo(
    () => (Array.isArray(validRows) ? validRows.length : 0),
    [validRows]
  );
  const validAll = useMemo(
    () =>
      Number.isFinite(validTotal)
        ? Number(validTotal)
        : Number.isFinite(validCountOverride)
          ? Number(validCountOverride)
          : validShown,
    [validTotal, validCountOverride, validShown]
  );

  const preValidatedErrors = useMemo(() => {
    return safeErrors.map((row) => ({
      ...row,
      issues: revalidateRow(row),
    }));
  }, [safeErrors]);

  // Accepts "dashboard" or "ptrs"
  const handleConfirm = async (destination) => {
    let ptrsId = activePtrsId;

    // Close dialog immediately
    setConfirmOpen(false);
    setCollapse(true);

    // Navigate non-blocking
    if (destination === "dashboard") {
      navigate("/ptrs");
    } else if (destination === "ptrs") {
      if (ptrsId) {
        navigate(`/ptrs/${ptrsId}`);
      } else {
        navigate("/ptrs");
        showAlert(
          "Couldn't locate your PTRS id — took you to the dashboard instead.",
          "warning"
        );
      }
    }

    // Fire-and-forget status patch
    if (ptrsId) {
      try {
        await ptrsService.patch(ptrsId, { status: "Validated" });
      } catch (err) {
        console.error("Failed to update ptrs status:", err);
        showAlert(
          "Marked validated locally, but server update failed. You can retry from the report.",
          "error"
        );
      }
    }
  };

  // abnSuggestions: { [payeeName]: { loading: bool, candidates: array, error: string|null } }
  const [abnSuggestions, setAbnSuggestions] = useState({});
  const { showAlert } = useAlert();

  // Debounce utility
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // --- Bulk selection helpers ---
  const toggleSelect = (id) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedRowIds(new Set());

  const selectAllErrors = () => {
    const allIds = new Set(
      (preValidatedErrors || []).map((r) => r.id).filter(Boolean)
    );
    setSelectedRowIds(allIds);
  };

  const selectedRowsArray = useMemo(() => {
    const map = new Map((preValidatedErrors || []).map((r) => [r.id, r]));
    return Array.from(selectedRowIds)
      .map((id) => map.get(id))
      .filter(Boolean);
  }, [selectedRowIds, preValidatedErrors]);

  // --- Bulk selection helpers for valid rows ---
  const toggleSelectValid = (id) => {
    setSelectedValidIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearValidSelection = () => setSelectedValidIds(new Set());

  const selectAllValid = () => {
    const all = new Set((validRows || []).map((r) => r.id).filter(Boolean));
    setSelectedValidIds(all);
  };

  // useEffect(() => {
  //   // Prevent repeated alerts by only showing on mount (or initial render)
  //   if (safeErrors.length > 0) {
  //     showAlert(
  //       `${safeErrors.length} record${safeErrors.length !== 1 ? "s" : ""} have issues that need to be fixed.`,
  //       "error"
  //     );
  //   }
  // }, [safeErrors, showAlert]); // Remove errors and showAlert from dependency array to prevent infinite loop

  useEffect(() => {
    // If parent didn't pass validTotal, fetch a tiny page of errors to read validTotal from API
    if (Number.isFinite(validTotal)) return;
    if (!activePtrsId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await tcpService.getErrorsByPtrsId(activePtrsId, {
          page: 1,
          pageSize: 1,
        });
        if (!cancelled && res && typeof res.validTotal === "number") {
          setValidCountOverride(res.validTotal);
        }
      } catch (e) {
        // noop: this is best-effort to show valid count
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePtrsId, validTotal]);

  useEffect(() => {
    // Only adopt the parent's preview when it actually contains rows.
    // Prevents clobbering fetched rows with an empty [] from the parent.
    if (Array.isArray(validRecordsPreview) && validRecordsPreview.length > 0) {
      setValidRows(validRecordsPreview);
    }
  }, [validRecordsPreview]);

  // If parent doesn't provide validRecordsPreview, fetch a preview page of valid rows
  useEffect(() => {
    if (!activePtrsId) return;
    if (!(validAll > 0)) return;

    let cancelled = false;
    (async () => {
      try {
        // Pick whichever service function exists in this branch
        const fetchFn =
          tcpService.getByPtrsId ??
          tcpService.listByPtrsId ??
          tcpService.getValidByPtrsId;

        if (!fetchFn) {
          console.warn(
            "[DataUploadReview] No tcpService preview method found (expected getByPtrsId/listByPtrsId/getValidByPtrsId)"
          );
          setValidRows([]);
          return;
        }

        const res = await fetchFn.call(tcpService, activePtrsId, {
          page: validPage || 1,
          pageSize: validPageSize || 50,
        });
        // console.log("[DataUploadReview] Valid rows response:", res);
        if (cancelled) return;

        // Normalise common API shapes for rows
        const d = res?.data ?? res;
        const rows =
          (Array.isArray(d) && d) ||
          (Array.isArray(d?.rows) && d.rows) ||
          (Array.isArray(res?.rows) && res.rows) ||
          (Array.isArray(d?.items) && d.items) ||
          (Array.isArray(res?.items) && res.items) ||
          [];

        if (
          (validAll || 0) > 0 &&
          (!Array.isArray(rows) || rows.length === 0)
        ) {
          console.warn(
            "[DataUploadReview] BE returned 0 valid rows for this page despite validAll>",
            validAll,
            { page: validPage || 1, pageSize: validPageSize || 50, d: d }
          );
          // Optional UX hint
          try {
            showAlert &&
              showAlert("No valid rows returned for this page.", "warning");
          } catch (_) {}
        }

        setValidRows(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.warn("[DataUploadReview] Failed to fetch valid preview:", err);
        setValidRows([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePtrsId, validAll, validPage, validPageSize]);

  const groupedErrors = useMemo(() => {
    const groups = {};
    preValidatedErrors.forEach((row) => {
      if (Array.isArray(row.issues)) {
        row.issues.forEach((issue) => {
          if (!groups[issue]) groups[issue] = [];
          groups[issue].push(row);
        });
      }
    });
    return groups;
  }, [preValidatedErrors]);

  // --- Known payers for Suggest dropdown ---
  const knownPayers = useMemo(() => {
    const s = new Set();
    (validRows || []).forEach((r) => {
      if (r?.payerEntityName && typeof r.payerEntityName === "string") {
        s.add(r.payerEntityName);
      }
    });
    return Array.from(s).sort();
  }, [validRows]);

  // --- Payees missing ABN grouping and fix handler ---
  const payeesMissingAbn = useMemo(() => {
    const missing = safeErrors.filter((row) =>
      revalidateRow(row).includes("Missing or invalid Payee Entity ABN")
    );

    const grouped = {};
    for (const row of missing) {
      const name = row.payeeEntityName || "Unknown Payee";
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(row);
    }
    return grouped;
  }, [safeErrors]);

  const handleAbnFix = (payeeName, newAbn) => {
    const rowsToUpdate = payeesMissingAbn[payeeName].map((row) => ({
      ...row,
      payeeEntityAbn: newAbn,
      issues: revalidateRow({ ...row, payeeEntityAbn: newAbn }),
    }));

    const validOnes = rowsToUpdate
      .filter((r) => r.issues.length === 0)
      .map((row) => {
        // Remove the specific error reason
        const resolvedError = "Missing or invalid Payee Entity ABN";
        const previousReasons = Array.isArray(row.errorReason)
          ? row.errorReason
          : [];
        const updatedReasons = previousReasons.filter(
          (reason) => reason !== resolvedError
        );
        return {
          ...row,
          errorReason: updatedReasons.length > 0 ? updatedReasons : null,
        };
      });
    if (validOnes.length > 0) {
      const updatedErrors = safeErrors.filter(
        (e) => !validOnes.some((v) => v.id === e.id)
      );
      const updatedValid = [...validRows, ...validOnes];
      onRecordsUpdated?.(updatedErrors, updatedValid);
      tcpService
        .patchRecords(validOnes)
        .catch((err) => console.error("Batch patch failed:", err));
      // Insert the validated rows into the tcp dataset
      tcpService
        .bulkCreate(validOnes)
        .then(() => {
          showAlert(
            `Successfully fixed ABN for ${validOnes.length} record${
              validOnes.length !== 1 ? "s" : ""
            }.`,
            "success"
          );
        })
        .catch((err) => {
          console.error("Error updating records:", err);
          showAlert(
            `Failed to fix ABN for ${validOnes.length} record${
              validOnes.length !== 1 ? "s" : ""
            }. Please try again.`,
            "error"
          );
        });
    }
  };

  const handleAbnSearch = async (payeeName) => {
    setAbnSuggestions((prev) => ({
      ...prev,
      [payeeName]: { loading: true, candidates: [], error: null },
    }));
    try {
      const res = await dcService.getAbnCandidatesForNames([
        { name: payeeName },
      ]);
      // Transform res directly into candidates array with expected structure
      let candidates = [];
      if (Array.isArray(res) && res.length > 0) {
        candidates = res.map((item) => ({
          abn: item["Suggested ABN"],
          name: item["Name"],
          confidence: item["Confidence Level"],
          comments: item["Comments"],
          postcode: item["Postcode"],
          state: item["State"],
          status: item["ABN Status"],
        }));
        console.log(`ABN candidates for "${payeeName}":`, candidates);
      }
      setAbnSuggestions((prev) => ({
        ...prev,
        [payeeName]: { loading: false, candidates, error: null },
      }));
    } catch (err) {
      setAbnSuggestions((prev) => ({
        ...prev,
        [payeeName]: {
          loading: false,
          candidates: [],
          error: "Error fetching ABN",
        },
      }));
    }
  };

  // Debounced ABN search
  const debouncedAbnSearch = useMemo(() => debounce(handleAbnSearch, 500), []);

  return (
    <Box sx={{ mt: 4 }}>
      {!collapse && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Validation Results
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Chip
                label={`✅ ${validAll} valid${validAll !== validShown ? ` (${validShown} shown)` : ""}`}
                color="success"
                variant="outlined"
              />
              <Chip label={errorsChipLabel} color="error" variant="outlined" />
              <Chip
                label={`📄 ${totalRows} total`}
                color="default"
                variant="outlined"
              />
            </Box>

            {/* Refresh Records Button with Tooltip */}
            {/* {safeErrors.length > 0 && ( */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Tooltip title="Force-refresh the records from the database, bypassing any cache.">
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: "auto" }}
                    onClick={() => onRefreshClick && onRefreshClick()}
                    disabled={loadingErrors}
                  >
                    {loadingErrors ? "Refreshing…" : "Refresh Records"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
            {/* )} */}

            {/* Mark as Validated Button */}
            {validRows.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Tooltip title="Mark the dataset as validated and commence the ptrs preparation.">
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Mark as Validated
                  </Button>
                </Tooltip>
              </Box>
            )}

            {/* --- Payees Missing ABNs Table --- */}
            <PayeesMissingAbnTable
              key={
                Object.keys(payeesMissingAbn).length +
                "-" +
                Object.keys(abnSuggestions).length
              }
              payeesMissingAbn={payeesMissingAbn}
              abnSuggestions={abnSuggestions}
              onAbnSearch={debouncedAbnSearch}
              onAbnFix={handleAbnFix}
            />

            {preValidatedErrors.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  mb: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={selectAllErrors}
                >
                  Select all errors
                </Button>
                <Button size="small" variant="text" onClick={clearSelection}>
                  Clear selection ({selectedRowIds.size})
                </Button>
                {knownPayers.length > 0 && (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <select
                      id="bulkSuggestPayer"
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        // Apply suggested payer to all selected rows
                        setEditedRows((prev) => {
                          const copy = { ...prev };
                          selectedRowsArray.forEach((row) => {
                            copy[row.id] = {
                              ...(copy[row.id] || {}),
                              payerEntityName: val,
                              modified: true,
                            };
                          });
                          return copy;
                        });
                        // reset to placeholder to allow repeated use
                        e.target.value = "";
                      }}
                      style={{ minWidth: 160 }}
                    >
                      <option value="">Bulk Suggest…</option>
                      {knownPayers.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Box>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={async () => {
                    if (selectedRowIds.size === 0) return;
                    if (!activePtrsId) {
                      showAlert("No active PTRS selected.", "error");
                      return;
                    }
                    const ids = Array.from(selectedRowIds);
                    openDeleteDialog(ids);
                  }}
                  disabled={selectedRowIds.size === 0 || deleting}
                >
                  Delete selected
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    // Build payload of selected rows that have no issues after edits
                    const idSet = new Set(selectedRowIds);
                    const rows = (preValidatedErrors || []).filter((r) =>
                      idSet.has(r.id)
                    );
                    const toPromote = rows
                      .map((row) => {
                        const rowEdit = editedRows[row.id] || {};
                        const merged = { ...row, ...rowEdit };
                        const issues = revalidateRow(merged);
                        return { merged, issues };
                      })
                      .filter(({ issues }) => issues.length === 0)
                      .map(({ merged }) => {
                        const payload = { ...merged };
                        delete payload.issues;
                        return payload;
                      });

                    if (toPromote.length === 0) {
                      showAlert(
                        "No selected rows are ready to save. Fix issues first.",
                        "warning"
                      );
                      return;
                    }

                    try {
                      const CHUNK_SIZE = 100;
                      for (let i = 0; i < toPromote.length; i += CHUNK_SIZE) {
                        const chunk = toPromote.slice(i, i + CHUNK_SIZE);
                        // eslint-disable-next-line no-await-in-loop
                        await tcpService.resolveErrors(chunk);
                      }
                      const promotedIds = new Set(toPromote.map((r) => r.id));
                      const updatedErrors = safeErrors.filter(
                        (e) => !promotedIds.has(e.id)
                      );
                      const updatedValid = [...validRows, ...toPromote];
                      onRecordsUpdated?.(updatedErrors, updatedValid);
                      // Clear edited state and selection for promoted rows
                      setEditedRows((prev) => {
                        const copy = { ...prev };
                        toPromote.forEach((r) => {
                          delete copy[r.id];
                        });
                        return copy;
                      });
                      clearSelection();
                      onRefreshClick?.();
                      showAlert(
                        `Saved ${toPromote.length} record${toPromote.length === 1 ? "" : "s"}.`,
                        "success"
                      );
                    } catch (err) {
                      console.error("Bulk resolve failed:", err);
                      showAlert("Bulk save failed. Please try again.", "error");
                    }
                  }}
                  disabled={selectedRowIds.size === 0 || deleting}
                >
                  Save selected
                </Button>
              </Box>
            )}

            {preValidatedErrors.length > 0 ? (
              <>
                {Object.entries(groupedErrors).map(([issueType, rows]) => (
                  <Box key={issueType} sx={{ mt: 2 }}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          {issueType} ({rows.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    indeterminate={
                                      selectedRowIds.size > 0 &&
                                      selectedRowIds.size <
                                        preValidatedErrors.length
                                    }
                                    checked={
                                      preValidatedErrors.length > 0 &&
                                      selectedRowIds.size ===
                                        preValidatedErrors.length
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) selectAllErrors();
                                      else clearSelection();
                                    }}
                                    inputProps={{
                                      "aria-label": "select all error rows",
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {fieldLabel(
                                    "payerEntityName",
                                    "Payer Entity Name"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {fieldLabel(
                                    "payeeEntityName",
                                    "Payee Entity Name"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {fieldLabel(
                                    "payeeEntityAbn",
                                    "Payee Entity ABN"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {fieldLabel(
                                    "paymentAmount",
                                    "Payment Amount"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {fieldLabel("paymentDate", "Payment Date")}
                                </TableCell>
                                <TableCell>Issues</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {/* Track edited state for each row in editedRows state */}
                              {rows.map((row, index) => {
                                const rowEdit = editedRows[row.id] || {};
                                // Compose the displayed row: prefer edited values, then original
                                const rowCopy = {
                                  ...row,
                                  ...rowEdit,
                                  issues: revalidateRow({ ...row, ...rowEdit }),
                                };
                                return (
                                  <TableRow key={row.id || index}>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedRowIds.has(row.id)}
                                        onChange={() => toggleSelect(row.id)}
                                        inputProps={{
                                          "aria-label": `select row ${row.id}`,
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <input
                                          value={rowCopy.payerEntityName || ""}
                                          onChange={(e) => {
                                            setEditedRows((prev) => ({
                                              ...prev,
                                              [row.id]: {
                                                ...prev[row.id],
                                                payerEntityName: e.target.value,
                                                modified: true,
                                              },
                                            }));
                                          }}
                                          style={{ width: "100%" }}
                                        />
                                        {knownPayers.length > 0 && (
                                          <select
                                            defaultValue=""
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (!val) return;
                                              setEditedRows((prev) => ({
                                                ...prev,
                                                [row.id]: {
                                                  ...prev[row.id],
                                                  payerEntityName: val,
                                                  modified: true,
                                                },
                                              }));
                                              // reset back to placeholder so user can pick again
                                              e.target.value = "";
                                            }}
                                            style={{ minWidth: 120 }}
                                          >
                                            <option value="">Suggest…</option>
                                            {knownPayers.map((p) => (
                                              <option key={p} value={p}>
                                                {p}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <input
                                        value={rowCopy.payeeEntityName || ""}
                                        onChange={(e) => {
                                          setEditedRows((prev) => ({
                                            ...prev,
                                            [row.id]: {
                                              ...prev[row.id],
                                              payeeEntityName: e.target.value,
                                              modified: true,
                                            },
                                          }));
                                        }}
                                        style={{ width: "100%" }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <input
                                        value={rowCopy.payeeEntityAbn || ""}
                                        onChange={(e) => {
                                          setEditedRows((prev) => ({
                                            ...prev,
                                            [row.id]: {
                                              ...prev[row.id],
                                              payeeEntityAbn: e.target.value,
                                              modified: true,
                                            },
                                          }));
                                        }}
                                        style={{ width: "100%" }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <input
                                        value={rowCopy.paymentAmount || ""}
                                        onChange={(e) => {
                                          setEditedRows((prev) => ({
                                            ...prev,
                                            [row.id]: {
                                              ...prev[row.id],
                                              paymentAmount: e.target.value,
                                              modified: true,
                                            },
                                          }));
                                        }}
                                        style={{ width: "100%" }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <input
                                        value={rowCopy.paymentDate || ""}
                                        onChange={(e) => {
                                          setEditedRows((prev) => ({
                                            ...prev,
                                            [row.id]: {
                                              ...prev[row.id],
                                              paymentDate: e.target.value,
                                              modified: true,
                                            },
                                          }));
                                        }}
                                        style={{ width: "100%" }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <ul
                                        style={{ margin: 0, paddingLeft: 16 }}
                                      >
                                        {Array.isArray(rowCopy.issues) &&
                                          rowCopy.issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                          ))}
                                      </ul>
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const hasIssues =
                                          Array.isArray(rowCopy.issues) &&
                                          rowCopy.issues.length > 0;
                                        const isModified = Boolean(
                                          rowCopy.modified
                                        );
                                        const disabled =
                                          hasIssues || !isModified;
                                        const issueSummary = hasIssues
                                          ? `Fix ${rowCopy.issues.length} issue${rowCopy.issues.length === 1 ? "" : "s"}: ${rowCopy.issues.join(", ")}`
                                          : isModified
                                            ? "Ready to save"
                                            : "Edit a value to enable Save";
                                        return (
                                          <>
                                            <Tooltip title={issueSummary}>
                                              <span>
                                                <Button
                                                  variant="outlined"
                                                  size="small"
                                                  disabled={disabled}
                                                  onClick={() => {
                                                    if (disabled) return;
                                                    const payload = {
                                                      ...rowCopy,
                                                    };
                                                    // Remove UI-only fields
                                                    delete payload.issues;
                                                    // Promote this error row into Tcp and remove from TcpError in one go
                                                    tcpService
                                                      .resolveErrors([payload])
                                                      .then(() => {
                                                        const updatedErrors =
                                                          safeErrors.filter(
                                                            (e) =>
                                                              e.id !==
                                                              rowCopy.id
                                                          );
                                                        const updatedValid = [
                                                          ...validRows,
                                                          rowCopy,
                                                        ];
                                                        onRecordsUpdated?.(
                                                          updatedErrors,
                                                          updatedValid
                                                        );
                                                        setEditedRows(
                                                          (prev) => {
                                                            const copy = {
                                                              ...prev,
                                                            };
                                                            delete copy[
                                                              rowCopy.id
                                                            ];
                                                            return copy;
                                                          }
                                                        );
                                                        setSelectedRowIds(
                                                          (prev) => {
                                                            const next =
                                                              new Set(prev);
                                                            next.delete(
                                                              rowCopy.id
                                                            );
                                                            return next;
                                                          }
                                                        );
                                                        onRefreshClick?.();
                                                      })
                                                      .catch(console.error);
                                                  }}
                                                >
                                                  Save
                                                </Button>
                                              </span>
                                            </Tooltip>
                                            <Tooltip title="Delete this row">
                                              <span>
                                                <Button
                                                  variant="text"
                                                  color="error"
                                                  size="small"
                                                  disabled={deletingIds.has(
                                                    rowCopy.id
                                                  )}
                                                  onClick={async () => {
                                                    if (!rowCopy.id) return;
                                                    if (!activePtrsId) {
                                                      showAlert(
                                                        "No active PTRS selected.",
                                                        "error"
                                                      );
                                                      return;
                                                    }
                                                    setDeletingIds((prev) =>
                                                      new Set(prev).add(
                                                        rowCopy.id
                                                      )
                                                    );
                                                    openDeleteDialog([
                                                      rowCopy.id,
                                                    ]);
                                                  }}
                                                >
                                                  Delete
                                                </Button>
                                              </span>
                                            </Tooltip>
                                          </>
                                        );
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ))}
              </>
            ) : null}

            {validAll > 0 && (
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Valid Rows ({validAll}
                    {validAll !== validShown ? ` (${validShown} shown)` : ""})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      mb: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={selectAllValid}
                    >
                      Select all
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={clearValidSelection}
                    >
                      Clear selection ({selectedValidIds.size})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        if (selectedValidIds.size === 0) return;
                        const ids = Array.from(selectedValidIds);
                        openDeleteDialog(ids, "valid");
                      }}
                      disabled={selectedValidIds.size === 0 || deleting}
                    >
                      Delete selected
                    </Button>
                  </Box>
                  <TablePagination
                    component="div"
                    count={validAll}
                    page={validPage ? validPage - 1 : 0}
                    onPageChange={(e, newPage) =>
                      onValidPageChange?.(newPage + 1)
                    }
                    rowsPerPage={validPageSize || 50}
                    onRowsPerPageChange={(e) =>
                      onValidPageSizeChange?.(parseInt(e.target.value, 10))
                    }
                    rowsPerPageOptions={[10, 25, 50, 100]}
                  />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              indeterminate={
                                selectedValidIds.size > 0 &&
                                selectedValidIds.size < (validRows || []).length
                              }
                              checked={
                                (validRows || []).length > 0 &&
                                selectedValidIds.size ===
                                  (validRows || []).length
                              }
                              onChange={(e) => {
                                if (e.target.checked) selectAllValid();
                                else clearValidSelection();
                              }}
                              inputProps={{
                                "aria-label": "select all valid rows",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {fieldLabel("payerEntityName", "Payer Entity Name")}
                          </TableCell>
                          <TableCell>
                            {fieldLabel("payeeEntityName", "Payee Entity Name")}
                          </TableCell>
                          <TableCell>
                            {fieldLabel("payeeEntityAbn", "Payee Entity ABN")}
                          </TableCell>
                          <TableCell>
                            {fieldLabel("paymentAmount", "Payment Amount")}
                          </TableCell>
                          <TableCell>
                            {fieldLabel("paymentDate", "Payment Date")}
                          </TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validRows.map((row, index) => (
                          <TableRow key={row.id || index}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedValidIds.has(row.id)}
                                onChange={() => toggleSelectValid(row.id)}
                                inputProps={{
                                  "aria-label": `select valid row ${row.id}`,
                                }}
                              />
                            </TableCell>
                            <TableCell>{row.payerEntityName}</TableCell>
                            <TableCell>{row.payeeEntityName}</TableCell>
                            <TableCell>{row.payeeEntityAbn}</TableCell>
                            <TableCell>{row.paymentAmount}</TableCell>
                            <TableCell>
                              {row.paymentDate
                                ? new Date(row.paymentDate)
                                    .toISOString()
                                    .split("T")[0]
                                : ""}
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Delete this row">
                                <span>
                                  <Button
                                    variant="text"
                                    color="error"
                                    size="small"
                                    disabled={deletingIds.has(row.id)}
                                    onClick={() => {
                                      if (!row.id) return;
                                      setDeletingIds((prev) =>
                                        new Set(prev).add(row.id)
                                      );
                                      openDeleteDialog([row.id], "valid");
                                      setSelectedValidIds((prev) => {
                                        const next = new Set(prev);
                                        next.delete(row.id);
                                        return next;
                                      });
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
            {/* Confirm Delete Dialog */}
            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
            >
              <DialogTitle>
                Delete {pendingDeleteIds.length} record
                {pendingDeleteIds.length === 1 ? "" : "s"}?
              </DialogTitle>
              <DialogContent>
                This action cannot be undone. The selected record
                {pendingDeleteIds.length === 1 ? "" : "s"} will be permanently
                removed from the dataset.
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </DialogActions>
            </Dialog>
            {/* Confirm Validation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Confirm Validation</DialogTitle>
              <DialogContent>
                This will mark the dataset as validated. Where would you like to
                go next?
              </DialogContent>
              <DialogActions>
                <Button
                  type="button"
                  onClick={() => handleConfirm("dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  type="button"
                  onClick={() => handleConfirm("ptrs")}
                  autoFocus
                >
                  Go to Report
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DataUploadReview;
