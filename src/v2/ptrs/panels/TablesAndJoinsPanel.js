import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router";
import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import JoinsDesigner from "v2/ptrs/components/JoinsDesigner";
import { listDatasets } from "v2/ptrs/services/data.ptrsApi";
import {
  getPtrsMap,
  savePtrsMap,
  getUnifiedSample,
} from "v2/ptrs/services/tablesAndMaps.ptrsApi";
import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";

export default function TablesAndJoinsPanel() {
  const [params] = useSearchParams();
  const debugJoins =
    params.get("debug") === "1" || params.get("debug") === "joins";
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsV2Context();

  const ptrsId = params.get("ptrsId");
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [datasets, setDatasets] = useState([]);
  const [joins, setJoins] = useState({ conditions: [], customFields: [] });
  const [headers, setHeaders] = useState([]);
  const [mainHeaders, setMainHeaders] = useState([]);
  const [examples, setExamples] = useState({});
  const [mainHeadersByRole, setMainHeadersByRole] = useState({});
  const [loading, setLoading] = useState(false);

  // ---- Autosave (joins + computed fields) ----
  const saveTimerRef = useRef(null);
  const lastSavedHashRef = useRef(null);
  const dirtyRef = useRef(false);
  const autosaveNoticeShownRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const savePromiseRef = useRef(null);

  const computeJoinsHash = (j) => {
    const safe = {
      conditions: Array.isArray(j?.conditions) ? j.conditions : [],
      customFields: Array.isArray(j?.customFields) ? j.customFields : [],
    };
    return JSON.stringify(safe);
  };

  const performSave = async (nextJoins, opts = {}) => {
    if (!ptrsId) return;
    if (isSavingRef.current) return;

    const { silent = true } = opts;

    const targetJoins = nextJoins || joins;
    const nextHash = computeJoinsHash(targetJoins);
    if (lastSavedHashRef.current === nextHash) {
      dirtyRef.current = false;
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    let resolveSave;
    savePromiseRef.current = new Promise((resolve) => {
      resolveSave = resolve;
    });

    try {
      // Load existing mappings so we don't overwrite them when saving joins
      const mapRes = await getPtrsMap(ptrsId).catch(() => ({}));
      const existingMappings =
        (mapRes && (mapRes.mappings || mapRes.map?.mappings)) || {};

      const conditions = Array.isArray(targetJoins?.conditions)
        ? targetJoins.conditions
        : [];
      const customFields = Array.isArray(targetJoins?.customFields)
        ? targetJoins.customFields
        : [];

      const payload = {
        mappings: existingMappings,
        joins: { conditions },
        customFields,
        profileId,
      };

      await savePtrsMap(ptrsId, payload);

      lastSavedHashRef.current = nextHash;
      dirtyRef.current = false;

      if (!silent) {
        showAlert("Saved joins", "success");
      }
    } catch (e) {
      // Autosave should never be silent on failure.
      showAlert(e?.message || "Failed to save joins", "error");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      if (savePromiseRef.current) {
        // Resolve anyone awaiting the in-flight save
        savePromiseRef.current = null;
        resolveSave?.();
      }
    }
  };

  const scheduleAutosave = (nextJoins) => {
    if (!ptrsId) return;

    // One-time info notice so the user understands what’s happening.
    if (!autosaveNoticeShownRef.current) {
      autosaveNoticeShownRef.current = true;
      showAlert("Joins and computed fields are autosaved.", "info");
    }

    dirtyRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      performSave(nextJoins, { silent: true });
    }, 800);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!ptrsId) return;
      setLoading(true);
      try {
        // Datasets
        const dsRes = await listDatasets(ptrsId);
        const items = dsRes?.items || [];
        if (!mounted) return;
        setDatasets(items);

        // Existing joins + custom fields
        const mapRes = await getPtrsMap(ptrsId);

        // Normalise joins from any of the historical shapes into { conditions: [], customFields: [] }
        const normaliseJoins = (raw) => {
          if (!raw || typeof raw !== "object") {
            return { conditions: [], customFields: [] };
          }

          // joins can be:
          // - an array of conditions (new shape)
          // - an object with { conditions, customFields }
          // - nested under map.joins
          const joinsSource = raw.joins ||
            raw.map?.joins || {
              conditions: [],
              customFields: [],
            };

          let conditions = [];
          let customFields = [];

          if (Array.isArray(joinsSource)) {
            // already an array of conditions
            conditions = joinsSource;
          } else if (joinsSource && typeof joinsSource === "object") {
            if (Array.isArray(joinsSource.conditions)) {
              conditions = joinsSource.conditions;
            }
            if (Array.isArray(joinsSource.customFields)) {
              customFields = joinsSource.customFields;
            }
          }

          // Top-level customFields take precedence if present
          const topLevelCustomFields =
            raw.customFields || raw.map?.customFields || null;
          if (Array.isArray(topLevelCustomFields)) {
            customFields = topLevelCustomFields;
          }

          return {
            conditions,
            customFields,
          };
        };

        const {
          conditions: initialConditions,
          customFields: initialCustomFields,
        } = normaliseJoins(mapRes || {});

        console.log("[TablesAndJoinsPanel] existing map", mapRes);
        console.log("[TablesAndJoinsPanel] initial joins/customFields", {
          initialConditions,
          initialCustomFields,
        });

        setJoins({
          conditions: initialConditions,
          customFields: initialCustomFields,
        });

        const initialHash = computeJoinsHash({
          conditions: initialConditions,
          customFields: initialCustomFields,
        });
        lastSavedHashRef.current = initialHash;
        dirtyRef.current = false;

        console.log("[TablesAndJoinsPanel] joins state after load", {
          conditionsCount: initialConditions.length,
          customFieldsCount: initialCustomFields.length,
        });

        // Unified sample for headers/examples (main + supporting)
        // Why do we need unified here? Because joins can reference columns
        // from any dataset, so we need to know all possible headers.
        const unified = await getUnifiedSample(ptrsId, { limit: 5, offset: 0 });
        const inferred = unified?.headers || [];
        const headerMeta = unified?.headerMeta || {};

        // Derive main-only headers per main role from unified headerMeta.
        // We need this because supporting datasets may be linked to only one of the main datasets.
        const byRole = {};
        for (const h of inferred) {
          const srcs = headerMeta[h]?.sources || [];
          if (!Array.isArray(srcs) || !srcs.length) continue;

          // Any source with kind === "main" is a main dataset column.
          // Track which main roles it belongs to (e.g. main_xero vs main_excel).
          const mainSrcs = srcs.filter((s) => s && s.kind === "main" && s.role);
          if (!mainSrcs.length) continue;

          for (const s of mainSrcs) {
            const role = String(s.role);
            if (!byRole[role]) byRole[role] = new Set();
            byRole[role].add(h);
          }
        }

        const finalByRole = {};
        for (const [role, set] of Object.entries(byRole)) {
          finalByRole[role] = Array.from(set).sort((a, b) =>
            a.localeCompare(b),
          );
        }

        // Backwards/defensive: if something goes wrong, fall back to inferred headers.
        setMainHeadersByRole(finalByRole);

        // Keep `mainHeaders` for any legacy callers, but prefer role-scoped headers in JoinsDesigner.
        // This is the union of all main-role headers.
        const mains = Array.from(
          new Set(Object.values(finalByRole).flatMap((arr) => arr || [])),
        );
        setMainHeaders(mains);

        const ex = {};
        for (const h of inferred) {
          const meta = headerMeta[h] || {};
          const example =
            meta.example ??
            (meta.examples
              ? (meta.examples.main ?? Object.values(meta.examples)[0])
              : "");
          ex[h] = example == null ? "" : String(example);
        }

        setHeaders(inferred);
        setExamples(ex);

        console.log("[TablesAndJoinsPanel] loaded data", {
          datasets: items,
          // joins: existingJoins,
          headers: inferred,
          examples: ex,
          mainHeaders: mains,
          mainHeadersByRole: finalByRole,
        });
      } catch (e) {
        showAlert(e?.message || "Failed to load tables & joins", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [ptrsId, showAlert]);

  const datasetSummary = useMemo(() => {
    return (datasets || []).map((d) => ({
      id: d.id,
      role: d.role,
      name: d.sourceName || d.fileName,
      rows: d.meta?.rowsCount ?? d.rowCount ?? 0,
    }));
  }, [datasets]);

  const joinsCount = Array.isArray(joins?.conditions)
    ? joins.conditions.length
    : 0;

  const hasSupportingDatasets = useMemo(() => {
    return (datasets || []).some((d) => {
      const role = String(d?.role || "").toLowerCase();
      return role && role !== "main";
    });
  }, [datasets]);

  const mustHaveJoin = hasSupportingDatasets;
  const canProceedToMap = !mustHaveJoin || joinsCount > 0;

  const saveJoins = async () => {
    if (!ptrsId) return showAlert("Missing ptrsId", "error");
    setLoading(true);
    try {
      await performSave(joins, { silent: false });
    } finally {
      setLoading(false);
    }
  };

  const goToMap = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    // Flush any pending autosave and ensure joins/custom fields are saved before moving on.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (dirtyRef.current) {
      await performSave(joins, { silent: true });
    } else if (isSavingRef.current && savePromiseRef.current) {
      // If a save is in-flight, await its completion.
      await savePromiseRef.current;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "map" });
    } catch (e) {
      // Surface the error but still allow navigation so the user isn't blocked
      showAlert(e?.message || "Failed to update PTRS step", "error");
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/map?${qs.toString()}`);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tables & joins
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Inputs detected
        </Typography>
        <Stack spacing={1}>
          {datasetSummary.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No datasets uploaded yet.
            </Typography>
          ) : (
            datasetSummary.map((d) => (
              <Stack
                key={d.id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={d.role || "unknown"} />
                  <Typography>{d.name}</Typography>
                </Stack>
                <Chip size="small" label={`${d.rows} rows`} />
              </Stack>
            ))
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">Joins</Typography>
            <Chip size="small" label={`${joinsCount} defined`} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={saveJoins}
              disabled={loading || isSaving || !ptrsId}
            >
              {isSaving ? "Saving…" : "Save joins"}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={goToMap}
              disabled={!canProceedToMap || loading || !ptrsId}
            >
              Next: Map columns
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {mustHaveJoin && joinsCount === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            You’ve uploaded supporting datasets, so you need to define at least
            one join before you can continue.
          </Typography>
        ) : null}
        <JoinsDesigner
          ptrsId={ptrsId}
          joins={joins}
          onChange={(next) => {
            if (!next || typeof next !== "object") {
              const cleared = { conditions: [], customFields: [] };
              setJoins(cleared);
              scheduleAutosave(cleared);
              return;
            }

            const nextJoins = {
              conditions: Array.isArray(next.conditions) ? next.conditions : [],
              customFields: Array.isArray(next.customFields)
                ? next.customFields
                : [],
            };

            setJoins(nextJoins);
            scheduleAutosave(nextJoins);
          }}
          headers={headers}
          examples={examples}
          leftHeaders={mainHeaders}
          leftHeadersByRole={mainHeadersByRole}
          debug={debugJoins}
        />
      </Paper>
    </Box>
  );
}
