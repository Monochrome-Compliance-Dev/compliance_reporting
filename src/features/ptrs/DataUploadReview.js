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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tcpService, dcService, ptrsService } from "../../services";
import { useAlert } from "../../context/AlertContext";
import PayeesMissingAbnTable from "./PayeesMissingAbnTable";
import { PTRS_FIELD_LABELS } from "./ingestConfig";

const DataUploadReview = ({
  errors = [],
  validRecordsPreview = [],
  onErrorsUpdated,
  onRecordsUpdated,
  onRefreshClick, // <-- new optional callback
}) => {
  // console.log(
  //   "errors, validRecordsPreview, onErrorsUpdated,  onRecordsUpdated,  onRefreshClick:",
  //   errors,
  //   validRecordsPreview,
  //   onErrorsUpdated,
  //   onRecordsUpdated,
  //   onRefreshClick
  // );
  const [remoteErrors, setRemoteErrors] = useState([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [validRows, setValidRows] = useState(validRecordsPreview);
  const [editedRows, setEditedRows] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Collapsed state for hiding the card after validation
  const [collapse, setCollapse] = useState(false);
  // Handler for confirming validation and navigating
  const navigate = useNavigate();

  // Accepts "dashboard" or "ptrs"
  const handleConfirm = async (destination) => {
    try {
      // Use localStorage for ptrsDetails
      const stored = localStorage.getItem("ptrsDetails");
      const parsed = JSON.parse(stored);
      const ptrsDetails = Array.isArray(parsed) ? parsed : [parsed];
      // Get ptrsService from window (keep as is for now)
      const latestPtrs = Array.isArray(ptrsDetails)
        ? ptrsDetails.find((r) => r.code === "ptrs")
        : null;
      if (!latestPtrs?.id) return;

      await ptrsService.patch(latestPtrs.id, { ptrsStatus: "Validated" });

      setConfirmOpen(false);
      setCollapse(true);
      if (destination === "dashboard") {
        navigate("/dashboard");
      } else {
        navigate(`/ptrs/${latestPtrs.id}`);
      }
    } catch (err) {
      console.error("Failed to update ptrs status:", err);
      showAlert("Failed to mark ptrs as validated.", "error");
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

  const fieldLabel = (key, fallback) =>
    (PTRS_FIELD_LABELS && PTRS_FIELD_LABELS[key]) || fallback || key;

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

  const safeErrors = useMemo(() => {
    const source =
      remoteErrors && remoteErrors.length > 0 ? remoteErrors : errors;
    return Array.isArray(source) ? source : [];
  }, [errors, remoteErrors]);

  const preValidatedErrors = useMemo(() => {
    return safeErrors.map((row) => ({
      ...row,
      issues: revalidateRow(row),
    }));
  }, [safeErrors]);

  const currentPtrsId = useMemo(() => {
    try {
      const stored = localStorage.getItem("ptrsDetails");
      const parsed = JSON.parse(stored);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr?.find((r) => r?.code === "ptrs")?.id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchErrorsFromDb = async () => {
    if (!currentPtrsId) return;
    try {
      setLoadingErrors(true);
      const res = await tcpService.getErrorsByPtrsId(currentPtrsId);
      console.log("res: ", res);
      if (Array.isArray(res)) {
        setRemoteErrors(res);
        onErrorsUpdated?.(res); // notify parent if it cares
      }
    } catch (e) {
      console.error("Failed to fetch tcp_error rows:", e);
    } finally {
      setLoadingErrors(false);
    }
  };

  useEffect(() => {
    fetchErrorsFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRecordsPreview]);

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
    setValidRows(validRecordsPreview);
  }, [validRecordsPreview]);

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
                label={`✅ ${validRows.length} valid`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`⚠️ ${safeErrors.length} errors`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`📄 ${validRows.length + safeErrors.length} total`}
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
                    onClick={onRefreshClick || fetchErrorsFromDb}
                    disabled={loadingErrors}
                  >
                    {loadingErrors ? "Refreshing…" : "Refresh Records"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
            {/* )} */}

            {/* Mark as Validated Button */}
            {safeErrors.length === 0 && validRows.length > 0 && (
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
                                                            e.id !== rowCopy.id
                                                        );
                                                      const updatedValid = [
                                                        ...validRows,
                                                        rowCopy,
                                                      ];
                                                      onRecordsUpdated?.(
                                                        updatedErrors,
                                                        updatedValid
                                                      );
                                                      setEditedRows((prev) => {
                                                        const copy = {
                                                          ...prev,
                                                        };
                                                        delete copy[rowCopy.id];
                                                        return copy;
                                                      });
                                                      onRefreshClick?.();
                                                    })
                                                    .catch(console.error);
                                                }}
                                              >
                                                Save
                                              </Button>
                                            </span>
                                          </Tooltip>
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

            {validRows.length > 0 && (
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Preview Valid Rows ({validRows.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
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
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validRows.map((row, index) => (
                          <TableRow key={index}>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
            {/* Confirm Validation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Confirm Validation</DialogTitle>
              <DialogContent>
                This will mark the dataset as validated. Where would you like to
                go next?
              </DialogContent>
              <DialogActions>
                <Button onClick={() => handleConfirm("dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={() => handleConfirm("ptrs")} autoFocus>
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
