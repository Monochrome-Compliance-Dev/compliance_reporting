import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
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
import { useSearchParams, useNavigate } from "react-router";
import { useAlert } from "context";
import { getPtrs } from "v2/ptrs/services/ptrsApi";
import {
  stagePtrs,
  getStagePreview,
  getLatestExecutionRun,
} from "v2/ptrs/services/stage.ptrsApi";
import { listDatasets } from "v2/ptrs/services/data.ptrsApi";
import { getPtrsMap } from "v2/ptrs/services/tablesAndMaps.ptrsApi";

import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";
import { LoadingSpinner } from "components/ui/LoadingSpinner";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";

// Convert snake_case (or other separators) to human-friendly labels
const prettifyHeader = (key) => {
  if (key == null) return "";
  const s = String(key)
    .replace(/[_\-]+/g, " ")
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
  const navigate = useNavigate();
  const ptrsId = params.get("ptrsId");
  const { profileId } = usePtrsV2Context();

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [ptrsMeta, setPtrsMeta] = useState(null);
  const [preview, setPreview] = useState({ rows: [], headers: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [autoStageAttempted, setAutoStageAttempted] = useState(false);
  // `undefined` means "not loaded yet". `null` means "loaded and there is no run".
  const [latestStageRun, setLatestStageRun] = useState(undefined);
  const [inputsLoaded, setInputsLoaded] = useState(false);
  const [autoStaging, setAutoStaging] = useState(false);
  const [autoStageMessage, setAutoStageMessage] = useState("");
  const [mapMeta, setMapMeta] = useState(null);

  const mapUpdatedAt = useMemo(() => {
    const ts = mapMeta?.updatedAt || null;
    if (!ts) return null;
    const dt = new Date(ts);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }, [mapMeta]);

  // Safely pick a value from a row that may be flat or split across data / standard / custom
  const pickCell = (row, header) => {
    if (!row) return undefined;

    const normaliseKey = (key) =>
      String(key)
        // camelCase -> snake_case
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        // spaces / dashes -> underscores
        .replace(/[\s\-]+/g, "_")
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
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial load – fetch ptrs meta and dataset statuses
  useEffect(() => {
    if (!ptrsId) return;
    (async () => {
      try {
        const [ptrs, ds, latestRun, map] = await Promise.all([
          getPtrs(ptrsId).catch(() => null),
          listDatasets(ptrsId).catch(() => ({ items: [] })),
          getLatestExecutionRun(ptrsId, { step: "stage" }).catch(() => null),
          getPtrsMap(ptrsId).catch(() => null),
        ]);

        if (mountedRef.current) {
          setPtrsMeta(ptrs);
          setDatasets(ds?.items || []);

          // Keep a tri-state: undefined (not loaded), null (loaded but none), or an object.
          setLatestStageRun(latestRun ?? null);

          const meta =
            map?.extras?.mapMeta || map?.map?.extras?.mapMeta || null;
          setMapMeta(meta);

          // Mark that the initial inputs are now known.
          setInputsLoaded(true);
        }
      } catch (_) {
        console.warn("[StagePanel] initial load failed", _);
      }
    })();
  }, [ptrsId]);

  const datasetsMaxUpdatedAt = useMemo(() => {
    if (!Array.isArray(datasets) || datasets.length === 0) return null;

    let max = null;
    for (const d of datasets) {
      const ts = d?.updatedAt || d?.createdAt || null;
      if (!ts) continue;
      const dt = new Date(ts);
      if (Number.isNaN(dt.getTime())) continue;
      if (!max || dt > max) max = dt;
    }

    return max;
  }, [datasets]);

  const needsStageRebuild = useCallback(() => {
    // If we haven't loaded inputs yet, we can't decide staleness reliably.
    // Returning false here prevents auto-staging loops while navigating.
    if (latestStageRun === undefined) return false;

    // If we loaded and there is no known last run, we need to build.
    if (latestStageRun === null) return true;

    const status = String(latestStageRun?.status || "").toLowerCase();
    if (["pending", "running", "failed", "error"].includes(status)) return true;

    const stageStartedAt = latestStageRun?.startedAt
      ? new Date(latestStageRun.startedAt)
      : null;

    if (!stageStartedAt || Number.isNaN(stageStartedAt.getTime())) return true;

    // Inputs that should invalidate stage:
    // - supporting datasets changed
    // - map changed (mapMeta.updatedAt bumped when signature changes)
    let inputsMax = stageStartedAt; // baseline
    if (datasetsMaxUpdatedAt && datasetsMaxUpdatedAt > inputsMax) {
      inputsMax = datasetsMaxUpdatedAt;
    }
    if (mapUpdatedAt && mapUpdatedAt > inputsMax) {
      inputsMax = mapUpdatedAt;
    }

    return inputsMax > stageStartedAt;
  }, [latestStageRun, datasetsMaxUpdatedAt, mapUpdatedAt]);

  // Initial preview load – if staging has already been run for this PTRS, show it.
  // If not, automatically run staging once so the user doesn't have to.
  // IMPORTANT: don't permanently skip this effect just because `result` was set from a preview.
  // We still need to re-evaluate staleness once map/dataset timestamps are loaded.
  const previewLoadedRef = useRef(false);

  useEffect(() => {
    if (!ptrsId) return;

    const shouldAutoStage = ({ hasPreview }) => {
      if (autoStageAttempted) return false;

      // If we already have a preview snapshot, wait until the initial inputs have loaded
      // before doing a staleness-driven rebuild.
      if (hasPreview && !inputsLoaded) return false;

      // If we DON'T have any preview yet, allow first-time staging immediately.
      if (!hasPreview && !inputsLoaded) return true;

      return needsStageRebuild();
    };

    const runAutoStage = async ({ reason }) => {
      if (!ptrsId) return;

      const msg =
        reason === "stale"
          ? "Showing the last staged snapshot. Rebuilding staging in the background — this may take a while."
          : "Preparing staged dataset for the first time. This may take a while for large files.";

      setAutoStageAttempted(true);
      setAutoStaging(true);
      setAutoStageMessage(msg);
      showAlert(msg, "info");

      try {
        const res = await stagePtrs(ptrsId, {
          profileId: profileId,
          persist: true,
        });
        if (!mountedRef.current) return;

        setResult(res);

        try {
          const latestRun = await getLatestExecutionRun(ptrsId, {
            step: "stage",
          });
          if (mountedRef.current) setLatestStageRun(latestRun);
        } catch (_) {}

        try {
          const pv2 = await getStagePreview(ptrsId, {
            limit: 20,
            profileId: profileId,
          });
          if (!mountedRef.current) return;
          if (pv2?.rows?.length) {
            setPreview(pv2);
            setShowPreview(true);
            previewLoadedRef.current = true;
          }
        } catch (_) {}

        showAlert(`Staged ${res?.rowsOut || 0} rows`, "success");
      } catch (stageErr) {
        console.error("[StagePanel] auto-stage error:", stageErr);
        if (mountedRef.current) {
          showAlert(
            stageErr?.message ||
              "Failed to stage data automatically. You can try running staging again manually.",
            "error",
          );
        }
      } finally {
        if (mountedRef.current) setAutoStaging(false);
      }
    };

    (async () => {
      // If we've already loaded a preview, don't re-fetch it on every dependency change.
      // BUT do allow a stale-check to kick off auto-staging once inputs timestamps are known.
      if (previewLoadedRef.current) {
        if (shouldAutoStage({ hasPreview: true })) {
          void runAutoStage({ reason: "stale" });
        }
        return;
      }

      setLoading(true);
      try {
        const pv = await getStagePreview(ptrsId, {
          limit: 20,
          profileId: profileId,
        });
        if (!mountedRef.current) return;

        if (pv?.rows?.length) {
          setPreview(pv);
          setShowPreview(true);
          previewLoadedRef.current = true;

          const stagedCount = pv.totalRows ?? pv.rows.length;

          // Only set a lightweight result if we don't already have a real one.
          setResult(
            (prev) =>
              prev || {
                rowsIn: stagedCount,
                rowsOut: stagedCount,
                tookMs: null,
              },
          );

          if (shouldAutoStage({ hasPreview: true })) {
            // don’t block UI — kick off in background
            void runAutoStage({ reason: "stale" });
          }
        } else if (shouldAutoStage({ hasPreview: false })) {
          void runAutoStage({ reason: "first" });
        }
      } catch (err) {
        console.warn("[StagePanel] initial stage preview load failed", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [
    ptrsId,
    profileId,
    autoStageAttempted,
    showAlert,
    needsStageRebuild,
    inputsLoaded,
  ]);

  const datasetSummary = useMemo(() => {
    if (!datasets || !datasets.length) return [];
    // Expect each item like { id, role, fileName, meta, createdAt }
    // Group by role and pick latest
    const map = new Map();
    datasets.forEach((d) => {
      const prev = map.get(d.role);
      if (!prev || new Date(d.createdAt) > new Date(prev.createdAt)) {
        map.set(d.role, d);
      }
    });
    const summary = Array.from(map.values());
    console.log("[StagePanel] datasetSummary:", summary);
    return summary;
  }, [datasets]);

  const handleStage = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    showAlert(
      "Running staging for this dataset. If it's a big one, it might take ages — get comfy while we crunch the numbers.",
      "info",
    );

    console.log("[StagePanel] stagePtrs ->", { ptrsId, profileId });
    setAutoStageMessage(
      "Running staging… this can take a minute for large files.",
    );
    setAutoStaging(true);
    try {
      const res = await stagePtrs(ptrsId, {
        profileId: profileId,
        persist: true,
      });
      console.log("[StagePanel] stagePtrs result:", res);
      if (!mountedRef.current) return;
      setResult(res);

      try {
        const latestRun = await getLatestExecutionRun(ptrsId, {
          step: "stage",
        });
        if (mountedRef.current) setLatestStageRun(latestRun);
      } catch (_) {}
      showAlert(`Staged ${res.rowsOut || 0} rows`, "success");
      // Eager-load a tiny preview for confidence
      try {
        const pv = await getStagePreview(ptrsId, {
          limit: 20,
          profileId: profileId,
        });
        console.log("[StagePanel] getStagePreview raw:", pv);
        console.log("[StagePanel] getStagePreview summary:", {
          headersCount: pv?.headers?.length || 0,
          rowsCount: pv?.rows?.length || 0,
          firstRowRaw: Array.isArray(pv?.rows) ? pv.rows[0] : undefined,
        });
        if (mountedRef.current && pv) {
          setPreview(pv);
          setShowPreview(true);
        }
      } catch (_) {}
    } catch (err) {
      console.error("[StagePanel] stagePtrs error:", err);
      if (mountedRef.current) {
        showAlert(err?.message || "Failed to stage data", "error");
      }
    } finally {
      if (mountedRef.current) setAutoStaging(false);
    }
  };

  const headers = useMemo(() => preview?.headers || [], [preview?.headers]);
  const rows = useMemo(() => preview?.rows || [], [preview?.rows]);
  const totalRows = preview?.totalRows ?? rows.length;

  useEffect(() => {
    if (!headers.length && !rows.length) return;
    console.log("[StagePanel] preview updated", {
      headers,
      rowsCount: rows.length,
      firstRowRaw: rows[0],
      firstRowResolved: rows[0]
        ? headers.reduce((acc, h) => {
            acc[h] = pickCell(rows[0], h);
            return acc;
          }, {})
        : undefined,
    });
  }, [headers, rows]);

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
    navigate(`/v2/ptrs/exclusions?${qs.toString()}`);
  };

  if (!ptrsId) return null;
  const hasPreview = Array.isArray(preview?.rows) && preview.rows.length > 0;

  if (loading && !result && !hasPreview) {
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
          {ptrsMeta?.label && (
            <Chip
              size="small"
              variant="outlined"
              label={`Ptrs: ${ptrsMeta.label}`}
            />
          )}
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
              disabled={loading || autoStaging}
              onClick={handleStage}
            >
              {result ? "Run again" : "Run staging"}
            </Button>
            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              disabled={loading || autoStaging || !result}
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
            disabled={loading || autoStaging}
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
        disabled={loading || autoStaging}
        onClick={() => {
          const qs = new URLSearchParams();
          qs.set("ptrsId", ptrsId);
          if (profileId) qs.set("profileId", profileId);
          navigate(`/v2/ptrs/map?${qs.toString()}`);
        }}
      >
        Back
      </Button>
    </Box>
  );
}
