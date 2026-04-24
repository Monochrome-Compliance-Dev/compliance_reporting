import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from "@mui/material";
import { useSearchParams } from "react-router";
import { useAlert } from "context";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import {
  usePtrsDatasetsQuery,
  useStageLatestExecutionRunQuery,
  useStagePreviewQuery,
  useStageCompletionGateQuery,
  useStagePtrsMutation,
  useUpdatePtrsMutation,
} from "../hooks/usePtrsQueries";
import { LoadingSpinner } from "shared/ui";

// Convert snake_case, camelCase, or other separators to human-friendly labels
const prettifyHeader = (key) => {
  if (key == null) return "";

  const s = String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return s
    .split(/\s+/)
    .map((w) => {
      if (/^(abn|acn|id|vat)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
};

export default function StagePanel() {
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const { goTo } = usePtrsNavigation();
  const ptrsId = params.get("ptrsId");
  const { profileId } = usePtrsContext();

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);
  const stageMutation = useStagePtrsMutation(ptrsId);
  const datasetsQ = usePtrsDatasetsQuery(ptrsId);
  const latestStageRunQ = useStageLatestExecutionRunQuery(ptrsId);
  const stageCompletionGateQ = useStageCompletionGateQuery(ptrsId, {
    profileId,
    enabled: !!profileId,
  });
  const stagePreviewQ = useStagePreviewQuery(ptrsId, {
    profileId,
    limit: 20,
    enabled:
      !!profileId &&
      stageCompletionGateQ.isSuccess &&
      (stageCompletionGateQ.data?.ready === true ||
        stageCompletionGateQ.data?.reason === "stale"),
  });
  const datasets = useMemo(
    () => datasetsQ.data?.items || [],
    [datasetsQ.data?.items],
  );
  const latestStageRun = latestStageRunQ.data ?? null;
  // Stabilise refetch functions so hooks can depend on them safely
  const refetchLatestStageRun = latestStageRunQ.refetch;
  const refetchStagePreview = stagePreviewQ.refetch;
  const refetchStageCompletionGate = stageCompletionGateQ.refetch;
  const refetchDatasets = datasetsQ.refetch;
  const hasSettledStageCompletionGate =
    stageCompletionGateQ.isSuccess && !stageCompletionGateQ.isFetching;

  const completionGateReady =
    hasSettledStageCompletionGate && stageCompletionGateQ.data?.ready === true;

  const completionGateReason = hasSettledStageCompletionGate
    ? stageCompletionGateQ.data?.reason || "missing-stage"
    : "missing-stage";

  const completionGateInputHash = hasSettledStageCompletionGate
    ? stageCompletionGateQ.data?.inputHash || null
    : null;

  const shouldLoadStagePreview =
    !!profileId &&
    hasSettledStageCompletionGate &&
    (completionGateReady || completionGateReason === "stale");

  useEffect(() => {
    console.info("[StagePanel] gate state", {
      ptrsId,
      profileId,
      gateStatus: stageCompletionGateQ.status,
      gateFetchStatus: stageCompletionGateQ.fetchStatus,
      gateIsSuccess: stageCompletionGateQ.isSuccess,
      gateIsFetching: stageCompletionGateQ.isFetching,
      hasSettledStageCompletionGate,
      completionGateReady,
      completionGateReason,
      completionGateInputHash,
      shouldLoadStagePreview,
      rawGateData: stageCompletionGateQ.data || null,
    });
  }, [
    ptrsId,
    profileId,
    stageCompletionGateQ.status,
    stageCompletionGateQ.fetchStatus,
    stageCompletionGateQ.isSuccess,
    stageCompletionGateQ.isFetching,
    stageCompletionGateQ.data,
    hasSettledStageCompletionGate,
    completionGateReady,
    completionGateReason,
    completionGateInputHash,
    shouldLoadStagePreview,
  ]);

  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState({ rows: [], headers: [] });
  const [showPreview, setShowPreview] = useState(true);

  const [lastAutoStageGateKey, setLastAutoStageGateKey] = useState(null);
  const [autoStaging, setAutoStaging] = useState(false);
  const [autoStageMessage, setAutoStageMessage] = useState("");

  // Safely pick a value from a row that may be flat or split across data / standard / custom
  const pickCell = (row, header) => {
    if (!row) return undefined;

    const normaliseKey = (key) =>
      String(key)
        // camelCase -> snake_case
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        // spaces / dashes -> underscores
        .replace(/[\s-]+/g, "_")
        .toLowerCase();

    const materialiseObj = (value) => {
      if (!value) return undefined;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === "object" ? parsed : undefined;
        } catch {
          return undefined;
        }
      }
      if (typeof value === "object") return value;
      return undefined;
    };

    const tryGet = (obj, key) => {
      const o = materialiseObj(obj);
      if (!o) return undefined;

      if (key in o) return o[key];

      const snake = normaliseKey(key);
      if (snake in o) return o[snake];

      return undefined;
    };

    const sources = [row.data, row.standard, row.custom, row];

    for (const src of sources) {
      const value = tryGet(src, header);
      if (value !== undefined) return value;
    }

    return undefined;
  };

  // MUI TableCell children must be a ReactNode. Stage values can be objects/arrays, so normalise.
  const renderCellValue = (value) => {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number") return value;

    if (typeof value === "boolean") return value ? "Yes" : "No";

    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) {
      // render arrays as a simple comma-separated string
      return value
        .map((v) => {
          if (v === null || v === undefined) return "";
          if (typeof v === "string" || typeof v === "number") return String(v);
          if (typeof v === "boolean") return v ? "Yes" : "No";
          if (v instanceof Date) return v.toISOString();
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        })
        .filter((s) => String(s).trim() !== "")
        .join(", ");
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const mountedRef = useRef(true);
  const autoStageInFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    autoStageInFlightRef.current = false;
    setResult(null);
    setPreview({ rows: [], headers: [] });
    setLastAutoStageGateKey(null);
    setAutoStaging(false);
    setAutoStageMessage("");
  }, [ptrsId, profileId]);

  const refetchStageView = useCallback(async () => {
    await Promise.allSettled([
      refetchLatestStageRun(),
      refetchStagePreview(),
      refetchStageCompletionGate(),
      refetchDatasets(),
    ]);
  }, [
    refetchLatestStageRun,
    refetchStagePreview,
    refetchStageCompletionGate,
    refetchDatasets,
  ]);

  useEffect(() => {
    if (!ptrsId || !profileId) {
      console.info("[StagePanel] auto-stage skipped: missing identifiers", {
        ptrsId,
        profileId,
      });
      return;
    }
    if (!hasSettledStageCompletionGate) {
      console.info("[StagePanel] auto-stage skipped: gate not settled", {
        ptrsId,
        profileId,
        gateStatus: stageCompletionGateQ.status,
        gateFetchStatus: stageCompletionGateQ.fetchStatus,
        gateIsSuccess: stageCompletionGateQ.isSuccess,
        gateIsFetching: stageCompletionGateQ.isFetching,
      });
      return;
    }
    if (completionGateReady) {
      console.info("[StagePanel] auto-stage skipped: gate ready", {
        ptrsId,
        profileId,
        completionGateReason,
        completionGateInputHash,
      });
      return;
    }
    if (autoStageInFlightRef.current) {
      console.info("[StagePanel] auto-stage skipped: already in flight", {
        ptrsId,
        profileId,
        completionGateReason,
        completionGateInputHash,
      });
      return;
    }

    const gateKey = `${completionGateReason}:${completionGateInputHash || "no-hash"}`;
    if (lastAutoStageGateKey === gateKey) {
      console.info("[StagePanel] auto-stage skipped: gate already attempted", {
        ptrsId,
        profileId,
        gateKey,
        lastAutoStageGateKey,
      });
      return;
    }

    const reason = completionGateReason;
    const msg =
      reason === "stale"
        ? "Showing the last staged snapshot. Rebuilding staging in the background — this may take a while."
        : "Preparing staged dataset for the first time. This may take a while for large files.";

    console.info("[StagePanel] auto-stage queued", {
      ptrsId,
      profileId,
      gateKey,
      reason,
      completionGateInputHash,
      lastAutoStageGateKey,
    });

    const runAutoStage = async () => {
      autoStageInFlightRef.current = true;
      console.info("[StagePanel] auto-stage starting", {
        ptrsId,
        profileId,
        gateKey,
        reason,
        completionGateInputHash,
      });
      setLastAutoStageGateKey(gateKey);
      setAutoStaging(true);
      setAutoStageMessage(msg);
      showAlert(msg, "info");

      try {
        const res = await stageMutation.mutateAsync({
          profileId,
          persist: true,
          force: false,
        });
        console.info("[StagePanel] auto-stage completed", {
          ptrsId,
          profileId,
          gateKey,
          rowsIn: res?.rowsIn || 0,
          rowsOut: res?.rowsOut || 0,
          skipped: !!res?.skipped,
          reason: res?.reason || null,
          inputHash: res?.inputHash || null,
          previousRunId: res?.previousRunId || null,
        });
        if (!mountedRef.current) return;

        setResult(res);
        await refetchStageView();

        showAlert(`Staged ${res?.rowsOut || 0} rows`, "success");
      } catch (stageErr) {
        console.info("[StagePanel] auto-stage failed", {
          ptrsId,
          profileId,
          gateKey,
          message: stageErr?.message || null,
        });
        console.error("[StagePanel] auto-stage error:", stageErr);
        if (mountedRef.current) {
          showAlert(
            stageErr?.message ||
              "Failed to stage data automatically. You can try running staging again manually.",
            "error",
          );
        }
      } finally {
        console.info("[StagePanel] auto-stage finished", {
          ptrsId,
          profileId,
          gateKey,
          mounted: mountedRef.current,
        });
        autoStageInFlightRef.current = false;
        if (mountedRef.current) setAutoStaging(false);
      }
    };

    void runAutoStage();
  }, [
    ptrsId,
    profileId,
    lastAutoStageGateKey,
    showAlert,
    hasSettledStageCompletionGate,
    completionGateReady,
    completionGateReason,
    completionGateInputHash,
    stageMutation.mutateAsync,
    refetchStageView,
    stageMutation,
    stageCompletionGateQ.status,
    stageCompletionGateQ.fetchStatus,
    stageCompletionGateQ.isSuccess,
    stageCompletionGateQ.isFetching,
  ]);

  useEffect(() => {
    if (!shouldLoadStagePreview) {
      console.info("[StagePanel] preview sync skipped: preview not allowed", {
        ptrsId,
        profileId,
        shouldLoadStagePreview,
        completionGateReady,
        completionGateReason,
      });
      return;
    }
    if (!hasSettledStageCompletionGate) {
      console.info("[StagePanel] preview sync skipped: gate not settled", {
        ptrsId,
        profileId,
      });
      return;
    }
    if (!stagePreviewQ.isSuccess) {
      console.info(
        "[StagePanel] preview sync skipped: preview not successful",
        {
          ptrsId,
          profileId,
          previewStatus: stagePreviewQ.status,
          previewFetchStatus: stagePreviewQ.fetchStatus,
        },
      );
      return;
    }
    if (!mountedRef.current) {
      console.info("[StagePanel] preview sync skipped: component unmounted", {
        ptrsId,
        profileId,
      });
      return;
    }

    const pv = stagePreviewQ.data || { rows: [], headers: [] };
    console.info("[StagePanel] preview sync applying data", {
      ptrsId,
      profileId,
      rows: Array.isArray(pv?.rows) ? pv.rows.length : 0,
      totalRows: pv?.totalRows ?? null,
      headers: Array.isArray(pv?.headers) ? pv.headers.length : 0,
    });
    setPreview(pv);

    if (Array.isArray(pv?.rows) && pv.rows.length > 0) {
      const stagedCount = pv.totalRows ?? pv.rows.length;
      setResult((prev) => {
        if (prev?.rowsOut === stagedCount && prev?.rowsIn === stagedCount) {
          return prev;
        }

        return {
          ...(prev || {}),
          rowsIn: stagedCount,
          rowsOut: stagedCount,
          tookMs: prev?.tookMs ?? null,
        };
      });
    }
  }, [
    shouldLoadStagePreview,
    hasSettledStageCompletionGate,
    stagePreviewQ.isSuccess,
    stagePreviewQ.data,
    completionGateReady,
    completionGateReason,
    ptrsId,
    profileId,
    stagePreviewQ.status,
    stagePreviewQ.fetchStatus,
  ]);

  const datasetSummary = useMemo(() => {
    if (!datasets.length) return [];

    return [...datasets].sort((a, b) => {
      const aTs = new Date(a?.createdAt || 0).getTime();
      const bTs = new Date(b?.createdAt || 0).getTime();
      if (aTs !== bTs) return bTs - aTs;

      const roleCmp = String(a?.role || "").localeCompare(
        String(b?.role || ""),
      );
      if (roleCmp !== 0) return roleCmp;

      return String(a?.fileName || "").localeCompare(String(b?.fileName || ""));
    });
  }, [datasets]);

  const handleStage = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    // Determine if this is a rerun (i.e. "Run again" was clicked)
    const isRerun = !!result;

    showAlert(
      "Running staging for this dataset. If it's a big one, it might take ages — get comfy while we crunch the numbers.",
      "info",
    );

    setAutoStageMessage(
      "Running staging… this can take a minute for large files.",
    );
    setAutoStaging(true);
    try {
      const res = await stageMutation.mutateAsync({
        profileId,
        persist: true,
        force: isRerun,
      });
      if (!mountedRef.current) return;
      setResult(res);

      await refetchStageView();

      showAlert(`Staged ${res.rowsOut || 0} rows`, "success");
    } catch (err) {
      console.error("[StagePanel] stagePtrs error:", err);
      if (mountedRef.current) {
        showAlert(err?.message || "Failed to stage data", "error");
      }
    } finally {
      if (mountedRef.current) setAutoStaging(false);
    }
  };

  const HIDDEN_PREVIEW_HEADERS = useMemo(
    () =>
      new Set([
        "row_no",
        "invoice_payment_terms_raw",
        "invoice_payment_terms_effective",
        "payment_time_reference_date",
        "payment_time_reference_kind",
      ]),
    [],
  );
  const headers = useMemo(
    () =>
      (preview?.headers || []).filter((h) => !HIDDEN_PREVIEW_HEADERS.has(h)),
    [preview?.headers, HIDDEN_PREVIEW_HEADERS],
  );
  const rows = useMemo(() => preview?.rows || [], [preview?.rows]);
  const totalRows = preview?.totalRows ?? rows.length;

  const handleGoToExclusions = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "exclusions" });
    } catch (err) {
      console.error(err);
      showAlert(
        "Failed to update PTRS step. Continuing to Exclusions.",
        "warning",
      );
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`exclusions?${qs.toString()}`, { includeId: false });
  };

  const hasPreview = Array.isArray(preview?.rows) && preview.rows.length > 0;

  if (!ptrsId) return null;

  if (stagePreviewQ.isLoading && !result && !hasPreview) {
    return <LoadingSpinner message="Loading stage preview…" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Stage data
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Merge the uploaded datasets (e.g. Vendor Master, Payment Term Changes,
        Holdings) and apply your column map to produce a clean, unified staging
        table for the PTRS report. You can re-run staging at any time – it is
        idempotent.
      </Typography>

      {/* Datasets checklist */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1">Inputs detected</Typography>
          <Chip size="small" label={datasetSummary.length} />
        </Stack>
        {datasetSummary.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No supporting datasets uploaded yet. You can still stage with just
            the primary CSV, but some enrichments/calculations may be
            unavailable.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {datasetSummary.map((d) => (
              <Stack key={d.id} direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography sx={{ minWidth: 220 }}>{d.role}</Typography>
                <Typography sx={{ flex: 1 }} color="text.secondary">
                  {d.fileName}
                </Typography>
                <Chip size="small" label={`${d.meta?.rowsCount ?? "?"} rows`} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(d.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Profile selector */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Typography variant="subtitle1" sx={{ minWidth: 180 }}>
            Processing profile
          </Typography>
          <Tooltip title="Choose the customer/profile specific logic to use when staging and applying rules.">
            <TextField
              size="small"
              placeholder="e.g. veolia"
              value={profileId || ""}
              disabled
              sx={{ width: 280 }}
            />
          </Tooltip>
        </Stack>
      </Paper>

      {/* Action + Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            {autoStaging ? (
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CircularProgress size={18} />
                  <Typography variant="subtitle1">
                    Auto-staging in progress
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {autoStageMessage ||
                    "Running staging… this can take a minute for large files."}
                </Typography>
              </Stack>
            ) : result ? (
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle1">Staging complete</Typography>
                </Stack>
                <Typography variant="body2">
                  {result.rowsIn || 0} input rows →{" "}
                  {(totalRows || result.rowsOut || 0).toLocaleString()} staged
                  rows.
                </Typography>
                {result.tookMs != null && (
                  <Typography variant="body2" color="text.secondary">
                    Duration: {result.tookMs} ms
                  </Typography>
                )}
                {latestStageRun && (
                  <Typography variant="body2" color="text.secondary">
                    Latest stage run: {latestStageRun.status || "unknown"}
                    {latestStageRun.startedAt
                      ? ` • started ${new Date(latestStageRun.startedAt).toLocaleString()}`
                      : ""}
                    {latestStageRun.finishedAt
                      ? ` • finished ${new Date(latestStageRun.finishedAt).toLocaleString()}`
                      : ""}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Typography variant="subtitle1">
                  Build your staged dataset
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Run staging to merge your mapped PTRS rows with the latest
                  uploaded datasets and create the clean staging table used by
                  the rules engine. You can safely re-run this at any time.
                </Typography>
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              disabled={autoStaging}
              onClick={handleStage}
            >
              {result ? "Run again" : "Run staging"}
            </Button>
            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              disabled={autoStaging || !result}
              onClick={handleGoToExclusions}
            >
              Next: Exclusions
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Typography variant="subtitle1">Preview</Typography>
          <Button
            size="small"
            disabled={autoStaging}
            onClick={() => setShowPreview((s) => !s)}
          >
            {showPreview ? "Hide" : "Show"} preview
          </Button>
        </Stack>
        {showPreview &&
          (rows.length ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {rows.length.toLocaleString()} of{" "}
                {totalRows.toLocaleString()} staged row
                {totalRows === 1 ? "" : "s"}.
              </Typography>
              <Box sx={{ overflow: "auto", maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {headers.map((c) => (
                        <TableCell key={c}>{prettifyHeader(c)}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, idx) => (
                      <TableRow key={idx}>
                        {headers.map((c) => (
                          <TableCell key={c}>
                            {renderCellValue(pickCell(r, c))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview available yet. Run staging to generate a sample.
            </Typography>
          ))}
      </Paper>

      <Divider sx={{ my: 3 }} />
      <Button
        variant="text"
        disabled={autoStaging}
        onClick={() => {
          const qs = new URLSearchParams();
          qs.set("ptrsId", ptrsId);
          if (profileId) qs.set("profileId", profileId);
          goTo(`map?${qs.toString()}`, { includeId: false });
        }}
      >
        Back
      </Button>
    </Box>
  );
}
