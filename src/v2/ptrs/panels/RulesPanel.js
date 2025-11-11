import { usePtrsV2Context } from "../context/PtrsV2Context";
import {
  Box,
  Stack,
  Typography,
  Button,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { useStepStatuses } from "../hooks/useStepStatuses";
import {
  previewRules,
  applyRules,
  getStagePreview,
  saveRunMap,
} from "../services/ptrsApi";

import { useState, useMemo, useEffect, useRef } from "react";
// --- Friendly operators + helpers (panel-only) ---
const OP_OPTIONS = [
  { label: "=", value: "eq" },
  { label: "≠", value: "neq" },
  { label: "in", value: "in" },
  { label: "not in", value: "nin" },
  { label: ">", value: "gt" },
  { label: "≥", value: "gte" },
  { label: "<", value: "lt" },
  { label: "≤", value: "lte" },
  { label: "is blank", value: "is_null" },
  { label: "not blank", value: "not_null" },
];
const toSnake = (s) =>
  !s
    ? s
    : String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s\-]+/g, "_")
        .toLowerCase();
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const deriveHeadersFromMap = (map) => {
  if (!map || !map.mappings) return [];
  const fields = Object.values(map.mappings || {}).map((m) => m && m.field);
  return uniq(fields.map(toSnake));
};

export default function RulesPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const {
    runId: ctxRunId,
    profileId: ctxProfileId,
    runMap: ctxRunMap,
  } = usePtrsV2Context();
  const runId = ctxRunId || "";
  const profileId = ctxProfileId || null;
  console.log(
    "[RulesPanel] render, runId=",
    runId,
    "profileId=",
    profileId,
    "map=",
    ctxRunMap
  );

  // Load step/status context so we can enable/disable actions appropriately
  const { gates, rules, validate, map } = useStepStatuses(runId, "rules");
  const hasCtxMap = !!(
    ctxRunMap &&
    ctxRunMap.mappings &&
    Object.keys(ctxRunMap.mappings || {}).length
  );
  const hasHookMap = !!(
    map &&
    map.mappings &&
    Object.keys(map.mappings || {}).length
  );
  const effectiveMap = hasCtxMap ? ctxRunMap : hasHookMap ? map : null;

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [headers, setHeaders] = useState([]);
  const [rowsPreviewed, setRowsPreviewed] = useState(0);
  const [rulesState, setRulesState] = useState(() => {
    const initial = Array.isArray(ctxRunMap?.rowRules)
      ? ctxRunMap.rowRules
      : [];
    return initial.map((r, idx) => ({ id: r.id || `r${idx + 1}`, ...r }));
  });

  const fetchedOnceRef = useRef({});

  // load staged headers for field pickers (seed from map; then try server)
  useEffect(() => {
    let mounted = true;

    // Seed from map immediately so the dropdown isn't empty
    const seed = deriveHeadersFromMap(ctxRunMap);
    if (seed.length) setHeaders(seed);

    (async () => {
      if (!runId) return;
      // Avoid duplicate fetches in dev double-render or route churn
      if (fetchedOnceRef.current[runId]) return;
      fetchedOnceRef.current[runId] = true;

      try {
        const prev = await getStagePreview(runId, { limit: 1 });
        if (!mounted) return;
        const fromSrv = Array.isArray(prev?.headers) ? prev.headers : [];
        const combined = fromSrv.length ? fromSrv : seed;
        if (combined.length) setHeaders(combined);
      } catch (e) {
        // Graceful fallback: keep map-derived headers if any
        if (seed.length && mounted) setHeaders(seed);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [runId, ctxRunMap]);

  // keep in sync if map updates externally
  useEffect(() => {
    if (Array.isArray(ctxRunMap?.rowRules)) {
      setRulesState(
        ctxRunMap.rowRules.map((r, idx) => ({
          id: r.id || `r${idx + 1}`,
          ...r,
        }))
      );
    }
  }, [ctxRunMap?.rowRules]);

  const canApply = useMemo(() => {
    // Require that mapping exists and staging has run; relax further as needed
    return Boolean(
      effectiveMap?.mappings && Object.keys(effectiveMap.mappings).length > 0
    );
  }, [effectiveMap]);

  console.log("[RulesPanel] gate", {
    hasCtxMap,
    hasHookMap,
    canApply,
    ctxMapKeys: ctxRunMap?.mappings
      ? Object.keys(ctxRunMap.mappings).length
      : 0,
    hookMapKeys: map?.mappings ? Object.keys(map.mappings).length : 0,
  });

  const blankRule = () => ({
    id: `r${rulesState.length + 1}`,
    label: "",
    enabled: true,
    when: [{ field: "", op: "eq", value: "" }],
    then: [
      { op: "add", field: "", valueField: "", round: 2 },
      { op: "exclude", reason: "" },
    ],
  });

  const updateRule = (idx, patch) => {
    setRulesState((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const updateRuleWhen = (idx, patch) => {
    setRulesState((prev) => {
      const next = [...prev];
      const cond = {
        ...(next[idx]?.when?.[0] || { field: "", op: "eq", value: "" }),
        ...patch,
      };
      next[idx] = { ...next[idx], when: [cond] };
      return next;
    });
  };

  const updateRuleAddAction = (idx, patch) => {
    setRulesState((prev) => {
      const next = [...prev];
      const acts = Array.isArray(next[idx]?.then) ? next[idx].then : [];
      const addIdx = acts.findIndex((a) => a.op === "add");
      const addAct = {
        ...(acts[addIdx] || { op: "add", field: "", valueField: "", round: 2 }),
        ...patch,
      };
      const newActs = [...acts];
      if (addIdx >= 0) newActs[addIdx] = addAct;
      else newActs.unshift(addAct);
      next[idx] = { ...next[idx], then: newActs };
      return next;
    });
  };

  const toggleExclude = (idx, checked) => {
    setRulesState((prev) => {
      const next = [...prev];
      const acts = Array.isArray(next[idx]?.then) ? next[idx].then : [];
      const exclIdx = acts.findIndex((a) => a.op === "exclude");
      if (checked) {
        const existing = acts[exclIdx] || { op: "exclude", reason: "" };
        const newActs = exclIdx >= 0 ? acts : [...acts, existing];
        next[idx] = { ...next[idx], then: newActs };
      } else {
        const newActs = acts.filter((a) => a.op !== "exclude");
        next[idx] = { ...next[idx], then: newActs };
      }
      return next;
    });
  };

  const removeRule = (idx) => {
    setRulesState((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      showAlert("Generating rules preview…", "info");
      // Pull a small header set for the builder later (not shown yet)
      const prev = await previewRules(runId, { limit: 20 });
      const actions = prev?.stats?.rules?.actions ?? 0;
      const affected = prev?.stats?.rules?.rowsAffected ?? 0;
      showAlert(
        `Preview ready — ${affected} row(s) affected, ${actions} action(s).`,
        "success"
      );
    } catch (err) {
      showAlert(err?.message || "Failed to generate preview.", "error");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      showAlert("Applying rules and transformations…", "info");
      const res = await applyRules(runId, {});
      const persisted = res?.persisted ?? res?.rowsOut ?? 0;
      const actions = res?.stats?.rules?.actions ?? 0;
      const affected = res?.stats?.rules?.rowsAffected ?? 0;
      showAlert(
        `Rules applied — persisted ${persisted} row(s), ${affected} affected, ${actions} action(s).`,
        "success"
      );
    } catch (err) {
      showAlert(err?.message || "Failed to apply rules.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveRules = async () => {
    try {
      const payload = rulesState.map((r) => ({
        id: r.id,
        label: r.label || r.id,
        enabled: r.enabled !== false,
        when: r.when,
        then: r.then,
      }));
      await saveRunMap(runId, { rowRules: payload });
      showAlert(`Saved ${payload.length} rule(s).`, "success");
    } catch (err) {
      showAlert(err?.message || "Failed to save rules.", "error");
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Apply rules &amp; transformations
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Run: {runId || "—"}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Configure and run your PTRS rules. We’ll add field-level transforms,
          exclusions, and dataset operations here in the next pass.
        </Typography>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Row rules
            </Typography>
            <Button
              size="small"
              onClick={() => setRulesState((r) => [...r, blankRule()])}
            >
              Add rule
            </Button>
          </Stack>

          <Stack spacing={2}>
            {rulesState.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                No rules yet. Click “Add rule” to create your first one.
              </Typography>
            )}

            {rulesState.map((r, idx) => {
              const addAct = (r.then || []).find((a) => a.op === "add") || {
                field: "",
                valueField: "",
                round: 2,
              };
              const excludeOn = (r.then || []).some((a) => a.op === "exclude");
              return (
                <Paper key={r.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Label"
                      size="small"
                      value={r.label || ""}
                      onChange={(e) =>
                        updateRule(idx, { label: e.target.value })
                      }
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`when-field-${idx}`}>Field</InputLabel>
                        <Select
                          labelId={`when-field-${idx}`}
                          label="Field"
                          value={r.when?.[0]?.field || ""}
                          onChange={(e) =>
                            updateRuleWhen(idx, { field: e.target.value })
                          }
                        >
                          {headers.map((h) => (
                            <MenuItem key={h} value={h}>
                              {h}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel id={`when-op-${idx}`}>Operator</InputLabel>
                        <Select
                          labelId={`when-op-${idx}`}
                          label="Operator"
                          value={r.when?.[0]?.op || "eq"}
                          onChange={(e) =>
                            updateRuleWhen(idx, { op: e.target.value })
                          }
                        >
                          {OP_OPTIONS.map(({ label, value }) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        value={r.when?.[0]?.value ?? ""}
                        onChange={(e) =>
                          updateRuleWhen(idx, { value: e.target.value })
                        }
                        disabled={["is_null", "not_null"].includes(
                          r.when?.[0]?.op
                        )}
                      />
                    </Stack>

                    <Typography variant="subtitle2">Actions</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`add-target-${idx}`}>
                          Add to field
                        </InputLabel>
                        <Select
                          labelId={`add-target-${idx}`}
                          label="Add to field"
                          value={addAct.field || ""}
                          onChange={(e) =>
                            updateRuleAddAction(idx, { field: e.target.value })
                          }
                        >
                          {headers.map((h) => (
                            <MenuItem key={h} value={h}>
                              {h}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel id={`add-src-${idx}`}>
                          Value from field
                        </InputLabel>
                        <Select
                          labelId={`add-src-${idx}`}
                          label="Value from field"
                          value={addAct.valueField || ""}
                          onChange={(e) =>
                            updateRuleAddAction(idx, {
                              valueField: e.target.value,
                            })
                          }
                        >
                          {headers.map((h) => (
                            <MenuItem key={h} value={h}>
                              {h}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        size="small"
                        label="Round (dp)"
                        type="number"
                        value={addAct.round ?? 2}
                        onChange={(e) =>
                          updateRuleAddAction(idx, {
                            round: Number(e.target.value || 0),
                          })
                        }
                        sx={{ width: 140 }}
                      />
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={excludeOn}
                          onChange={(e) => toggleExclude(idx, e.target.checked)}
                        />
                      }
                      label="Exclude matching rows"
                    />

                    <Stack direction="row" spacing={1}>
                      {Array.isArray(r.then) &&
                        r.then.map((a, i) => (
                          <Chip
                            key={`${r.id}-${i}`}
                            size="small"
                            label={`${a.op}${a.field ? `:${a.field}` : ""}`}
                          />
                        ))}
                      <Box sx={{ flex: 1 }} />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeRule(idx)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleSaveRules}
              disabled={!rulesState.length}
            >
              Save rules
            </Button>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={handlePreview}
            disabled={isPreviewing || !canApply}
            startIcon={isPreviewing ? <CircularProgress size={18} /> : null}
          >
            {isPreviewing ? "Previewing…" : "Preview rules"}
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={isApplying || !canApply}
            startIcon={isApplying ? <CircularProgress size={18} /> : null}
          >
            {isApplying ? "Applying…" : "Apply rules"}
          </Button>
        </Stack>

        {!canApply && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.warning.main }}
          >
            You’ll need a saved column map (and staged data) before running
            rules.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
