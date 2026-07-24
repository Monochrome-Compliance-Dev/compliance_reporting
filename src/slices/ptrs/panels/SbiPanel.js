import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";

import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import {
  usePtrsSbiStatus,
  useSbiImportMutation,
  useUpdatePtrsMutation,
} from "../hooks/usePtrsQueries";
import { exportSbiAbnCsv } from "../services/sbi.ptrsApi";
import { LoadingSpinner } from "shared/ui";

const formatWhen = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const formatStatus = (status) => {
  if (!status) return "—";
  const s = String(status).trim();
  if (!s) return "—";

  // Turn APPLIED_WITH_WARNINGS into "Applied with warnings"
  const words = s.replace(/_/g, " ").toLowerCase().split(" ").filter(Boolean);

  if (!words.length) return "—";

  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
};

const getSummaryCounts = (lastImport) => {
  const stage = lastImport?.summary?.stage || null;
  const outcomes = lastImport?.summary?.outcomes || null;
  const samples = lastImport?.summary?.samples || null;

  if (!stage && !outcomes && !samples) return null;

  return {
    affectedRows: stage?.affectedRows ?? null,
    matchedAbns: stage?.matchedAbns ?? null,
    totalRows: stage?.totalRows ?? null,
    missingAbnRows: stage?.missingAbnRows ?? null,
    invalidMatchRows: stage?.invalidMatchRows ?? null,
    unknownOutcomeRows: stage?.unknownOutcomeRows ?? null,
    abnMissingFromSbiResultsCount: stage?.abnMissingFromSbiResultsCount ?? null,
    smallBusinessCount: outcomes?.smallBusinessCount ?? null,
    notSmallBusinessCount: outcomes?.notSmallBusinessCount ?? null,
    invalidAbns: outcomes?.invalidAbns ?? null,
    unknownOutcomes: outcomes?.unknownOutcomes ?? null,
    missingFromSbiResults: Array.isArray(samples?.missingFromSbiResults)
      ? samples.missingFromSbiResults
      : [],
  };
};

export default function SbiPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsContext();

  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;
  const { goTo } = usePtrsNavigation();

  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { status: sbiStatus, lastImport, error } = usePtrsSbiStatus(ptrsId);
  const importMut = useSbiImportMutation(ptrsId);
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const isBusy = importMut.isPending || isExporting;

  const counts = useMemo(() => getSummaryCounts(lastImport), [lastImport]);

  const pickFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const downloadAbnExport = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    setIsExporting(true);

    try {
      showAlert("Preparing ABN export…", "info");

      const csvText = await exportSbiAbnCsv(ptrsId);
      if (!csvText || typeof csvText !== "string") {
        throw new Error("Export returned no data");
      }

      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");

      a.download = `sbi_export_${ptrsId}_${yyyy}-${mm}-${dd}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showAlert("ABN export downloaded.", "success");
    } catch (err) {
      showAlert(err?.message || "Failed to download ABN export.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e?.target?.files?.[0] || null;
    if (!file) return;
    if (isBusy) return;

    setSelectedFileName(file.name);

    try {
      showAlert("Uploading SBI results…", "info");
      const res = await importMut.mutateAsync({ file });

      const uploadId = res?.sbiUploadId ? ` (${res.sbiUploadId})` : "";

      if (res?.status === "BLOCKED") {
        showAlert(
          `SBI import blocked${uploadId}. Check the summary for details.`,
          "error",
        );
      } else if (res?.status === "APPLIED_WITH_WARNINGS") {
        showAlert(`SBI import applied with warnings${uploadId}.`, "warning");
      } else {
        showAlert(`SBI import applied${uploadId}.`, "success");
      }

      // clear input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      showAlert(err?.message || "Failed to import SBI results.", "error");
    }
  };

  const handleGoToValidate = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "validate" });
    } catch (err) {
      console.error(err);
      showAlert(
        "Failed to update PTRS step. Continuing to Validate.",
        "warning",
      );
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`validate?${qs.toString()}`, { includeId: false });
  }, [goTo, ptrsId, profileId, showAlert, updatePtrsStep]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          SBI Check
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Ptrs: {ptrsId || "—"}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Upload the results CSV from the external Small Business Identification
          (SBI) tool. This step writes the final small business classification
          back to your staged rows.
        </Typography>

        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <Button
              variant="outlined"
              onClick={downloadAbnExport}
              disabled={!ptrsId || isBusy}
            >
              Download ABN export CSV
            </Button>

            <Button
              variant="contained"
              onClick={pickFile}
              disabled={!ptrsId || isBusy}
            >
              Upload SBI results CSV
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              onClick={handleGoToValidate}
              disabled={!ptrsId || isBusy}
            >
              Next: Validate
            </Button>

            {isBusy ? <LoadingSpinner /> : null}

            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {selectedFileName || lastImport?.fileName || "No file selected"}
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              Latest SBI import
            </Typography>

            {!ptrsId && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Select or resume a PTRS run to view SBI status.
              </Typography>
            )}

            {ptrsId && sbiStatus === "loading" && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Loading SBI status…
              </Typography>
            )}

            {ptrsId && sbiStatus === "error" && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.error.main }}
              >
                {error || "Failed to load SBI status"}
              </Typography>
            )}

            {ptrsId &&
              sbiStatus !== "loading" &&
              sbiStatus !== "error" &&
              !lastImport && (
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  No SBI results have been uploaded yet.
                </Typography>
              )}

            {lastImport && (
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  Status: <b>{formatStatus(lastImport.status)}</b>
                </Typography>
                <Typography variant="body2">
                  Uploaded: {formatWhen(lastImport.createdAt)}
                </Typography>
                <Typography variant="body2">
                  Parsed ABNs: {lastImport.parsedAbnCount ?? "—"}
                </Typography>

                {counts && (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Applied to {counts.affectedRows ?? "—"} row(s). Matched
                      ABNs: {counts.matchedAbns ?? "—"}. Missing ABN rows:{" "}
                      {counts.missingAbnRows ?? "—"}. Missing from SBI results:{" "}
                      {counts.abnMissingFromSbiResultsCount ?? "—"}.
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Outcome breakdown — Small:{" "}
                      {counts.smallBusinessCount ?? "—"}, Not small:{" "}
                      {counts.notSmallBusinessCount ?? "—"}, Invalid ABNs:{" "}
                      {counts.invalidAbns ?? "—"}, Unknown outcomes:{" "}
                      {counts.unknownOutcomes ?? "—"}.
                    </Typography>

                    {counts.invalidMatchRows || counts.unknownOutcomeRows ? (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: theme.palette.warning.main,
                        }}
                      >
                        Warnings: invalid matches {counts.invalidMatchRows ?? 0}
                        , unknown outcomes {counts.unknownOutcomeRows ?? 0}.
                      </Typography>
                    ) : null}

                    {counts.missingFromSbiResults.length ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: theme.palette.text.secondary,
                            mb: 0.5,
                          }}
                        >
                          Records not found in SBI results (showing first{" "}
                          {counts.missingFromSbiResults.length}):
                        </Typography>

                        <Stack spacing={0.5}>
                          {counts.missingFromSbiResults.map((item, idx) => (
                            <Typography
                              key={`${item.stageRowId || item.rowNo || idx}`}
                              variant="caption"
                              sx={{
                                display: "block",
                                color: theme.palette.text.secondary,
                              }}
                            >
                              Row {item.rowNo ?? "—"}:{" "}
                              {item.payeeEntityName || "Unknown supplier"}
                              {item.payeeAbn ? ` (${item.payeeAbn})` : ""}
                              {item.invoiceReferenceNumber
                                ? ` — Ref ${item.invoiceReferenceNumber}`
                                : ""}
                              {item.documentType
                                ? ` — ${item.documentType}`
                                : ""}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
