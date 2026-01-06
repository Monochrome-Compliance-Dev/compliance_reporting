import { useEffect, useMemo, useRef, useState } from "react";
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
  const [latestStageRun, setLatestStageRun] = useState(null);

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

  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Initial load – fetch ptrs meta and dataset statuses
  useEffect(() => {
    if (!ptrsId) return;
    (async () => {
      try {
        const [ptrs, ds, latestRun] = await Promise.all([
          getPtrs(ptrsId).catch(() => null),
          listDatasets(ptrsId).catch(() => ({ items: [] })),
          getLatestExecutionRun(ptrsId, { step: "stage" }).catch(() => null),
        ]);
        // console.log("[StagePanel] getPtrs:", ptrs);
        // console.log("[StagePanel] listDatasets:", ds);
        if (mountedRef.current) {
          setPtrsMeta(ptrs);
          setDatasets(ds?.items || []);
          setLatestStageRun(latestRun);
        }
      } catch (_) {
        console.warn("[StagePanel] initial load failed", _);
      }
    })();
  }, [ptrsId]);

  // Initial preview load – if staging has already been run for this PTRS, show it.
  // If not, automatically run staging once so the user doesn't have to.
  useEffect(() => {
    if (!ptrsId) return;
    // If we already have a staging result in memory, don't re-fetch or auto-stage
    if (result) return;
    console.log("Got here 1");

    // --- Helper logic for deciding if we need to auto-stage ---
    const needsStageRebuild = () => {
      // If we can't determine run recency, don't force rebuild.
      // Prefer a conservative approach: only rebuild when we have strong signals.
      if (!latestStageRun) return true; // no run recorded yet

      const status = String(latestStageRun?.status || "").toLowerCase();
      if (["pending", "running", "failed", "error"].includes(status))
        return true;

      const ptrsUpdatedAt = ptrsMeta?.updatedAt
        ? new Date(ptrsMeta.updatedAt)
        : null;
      const stageStartedAt = latestStageRun?.startedAt
        ? new Date(latestStageRun.startedAt)
        : null;

      // If PTRS was updated after the last staging run began, assume configuration changed
      // (map saved, mapped build run, etc.) and rebuild stage.
      if (ptrsUpdatedAt && stageStartedAt) {
        return ptrsUpdatedAt > stageStartedAt;
      }

      return false;
    };

    const shouldAutoStage = () => {
      if (autoStageAttempted) return false;
      return needsStageRebuild();
    };

    (async () => {
      try {
        setLoading(true);
        const pv = await getStagePreview(ptrsId, {
          limit: 20,
          profileId: profileId || null,
        });
        if (!mountedRef.current) return;
        console.log("Got here 2");

        if (pv && Array.isArray(pv.rows) && pv.rows.length) {
          // We have staged rows already. Hydrate the preview/result,
          // but re-run staging automatically if we believe the stage is stale.
          setPreview(pv);
          setShowPreview(true);
          console.log("Got here 3");

          const stagedCount = pv.totalRows ?? pv.rows.length;
          setResult(
            (prev) =>
              prev || {
                rowsIn: stagedCount,
                rowsOut: stagedCount,
                tookMs: null,
              }
          );
          console.log("Got here 4");

          if (shouldAutoStage()) {
            console.log(
              "[StagePanel] staged preview exists but appears stale; auto-staging",
              {
                ptrsId,
                profileId,
                ptrsUpdatedAt: ptrsMeta?.updatedAt || null,
                latestStageRun,
              }
            );

            setAutoStageAttempted(true);
            showAlert(
              "Your staging data looks out of date (mapping/config changed). Rebuilding staging now — this may take a while.",
              "info"
            );

            try {
              const res = await stagePtrs(ptrsId, {
                profileId: profileId || null,
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
                  profileId: profileId || null,
                });
                if (!mountedRef.current) return;

                if (pv2 && Array.isArray(pv2.rows) && pv2.rows.length) {
                  setPreview(pv2);
                  setShowPreview(true);
                  console.log(
                    "[StagePanel] stale-stage rebuild preview loaded",
                    {
                      headersCount: pv2.headers?.length || 0,
                      rowsCount: pv2.rows?.length || 0,
                    }
                  );
                }
              } catch (innerErr) {
                console.warn(
                  "[StagePanel] getStagePreview after stale-stage auto-run failed",
                  innerErr
                );
              }
            } catch (stageErr) {
              console.error(
                "[StagePanel] stale-stage auto-run error:",
                stageErr
              );
              if (mountedRef.current) {
                showAlert(
                  stageErr?.message ||
                    "Failed to rebuild staging automatically. You can try running staging again manually.",
                  "error"
                );
              }
            }
          }
        } else if (shouldAutoStage()) {
          // No staged rows yet – automatically run staging once
          console.log("Got here 5");

          setAutoStageAttempted(true);
          showAlert(
            "Preparing staged dataset for the first time. For large files this may take a while.",
            "info"
          );

          console.log("[StagePanel] auto-staging on first visit", {
            ptrsId,
            profileId,
          });

          try {
            console.log("Got here 6");
            const res = await stagePtrs(ptrsId, {
              profileId: profileId || null,
              persist: true,
            });
            console.log("Got here 7");

            if (!mountedRef.current) return;
            console.log("Got here 8");

            setResult(res);

            try {
              const latestRun = await getLatestExecutionRun(ptrsId, {
                step: "stage",
              });
              if (mountedRef.current) setLatestStageRun(latestRun);
            } catch (_) {}

            // After staging, eagerly fetch a small preview
            try {
              console.log("Got here 9");
              const pv2 = await getStagePreview(ptrsId, {
                limit: 20,
                profileId: profileId || null,
              });
              if (!mountedRef.current) return;

              if (pv2 && Array.isArray(pv2.rows) && pv2.rows.length) {
                setPreview(pv2);
                setShowPreview(true);
                console.log("[StagePanel] auto-stage preview loaded", {
                  headersCount: pv2.headers?.length || 0,
                  rowsCount: pv2.rows?.length || 0,
                });
              }
            } catch (innerErr) {
              console.warn(
                "[StagePanel] getStagePreview after auto-stage failed",
                innerErr
              );
            }
          } catch (stageErr) {
            console.error("[StagePanel] auto-stage error:", stageErr);
            if (mountedRef.current) {
              showAlert(
                stageErr?.message ||
                  "Failed to stage data automatically. You can try running staging again manually.",
                "error"
              );
            }
          }
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
    result,
    autoStageAttempted,
    showAlert,
    latestStageRun,
    ptrsMeta,
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
      "info"
    );

    console.log("[StagePanel] stagePtrs ->", { ptrsId, profileId });
    setLoading(true);
    try {
      const res = await stagePtrs(ptrsId, {
        profileId: profileId || null,
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
          profileId: profileId || null,
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
      if (mountedRef.current) setLoading(false);
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

  const handleGoToRules = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "rules" });
    } catch (err) {
      console.error(err);
      showAlert("Failed to update PTRS step. Continuing to Rules.", "warning");
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/rules?${qs.toString()}`);
  };

  if (!ptrsId) return null;
  if (loading) {
    return (
      <LoadingSpinner message="Preparing staged dataset… this can take a little while." />
    );
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
            {loading ? (
              <Stack alignItems="center" spacing={2}>
                <CircularProgress />
                <Typography>Preparing staged dataset…</Typography>
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
              disabled={loading}
              onClick={handleStage}
            >
              {result ? "Run again" : "Run staging"}
            </Button>
            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              disabled={loading || !result}
              onClick={handleGoToRules}
            >
              Next: Apply rules
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
            disabled={loading}
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
                          <TableCell key={c}>{pickCell(r, c)}</TableCell>
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
        disabled={loading}
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
