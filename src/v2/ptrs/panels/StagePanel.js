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
import { stagePtrs, getStagePreview } from "v2/ptrs/services/stage.ptrsApi";
import { listDatasets } from "v2/ptrs/services/data.ptrsApi";

import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";

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
        const [ptrs, ds] = await Promise.all([
          getPtrs(ptrsId).catch(() => null),
          listDatasets(ptrsId).catch(() => ({ items: [] })),
        ]);
        // console.log("[StagePanel] getPtrs:", ptrs);
        // console.log("[StagePanel] listDatasets:", ds);
        if (mountedRef.current) {
          setPtrsMeta(ptrs);
          setDatasets(ds?.items || []);
        }
      } catch (_) {
        console.warn("[StagePanel] initial load failed", _);
      }
    })();
  }, [ptrsId]);

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
                  {result.rowsIn || 0} input rows → {result.rowsOut || 0} staged
                  rows.
                </Typography>
                {result.tookMs != null && (
                  <Typography variant="body2" color="text.secondary">
                    Duration: {result.tookMs} ms
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
          <Button size="small" onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? "Hide" : "Show"} preview
          </Button>
        </Stack>
        {showPreview &&
          (rows.length ? (
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
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview available yet. Run staging to generate a sample.
            </Typography>
          ))}
      </Paper>

      <Divider sx={{ my: 3 }} />
      <Button
        variant="text"
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
