import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useNavigate } from "react-router";

import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { LoadingSpinner } from "components/ui/";
import {
  usePtrsSbiStatus,
  useSbiImportMutation,
  useUpdatePtrsMutation,
} from "v2/ptrs/hooks/usePtrsQueries";
import { exportSbiAbnCsv } from "v2/ptrs/services/sbi.ptrsApi";

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
  if (!stage) return null;

  return {
    affectedRows: stage.affectedRows ?? null,
    matchedAbns: stage.matchedAbns ?? null,
    totalRows: stage.totalRows ?? null,
    missingAbnRows: stage.missingAbnRows ?? null,
    invalidMatchRows: stage.invalidMatchRows ?? null,
    unknownOutcomeRows: stage.unknownOutcomeRows ?? null,
  };
};

export default function SbiPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsV2Context();

  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;
  const navigate = useNavigate();

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
          "error"
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
        "warning"
      );
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/validate?${qs.toString()}`);
  }, [navigate, ptrsId, profileId, showAlert, updatePtrsStep]);

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
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Applied to {counts.affectedRows ?? "—"} row(s). Matched
                      ABNs: {counts.matchedAbns ?? "—"}. Missing ABN rows:{" "}
                      {counts.missingAbnRows ?? "—"}.
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
                  </Box>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
