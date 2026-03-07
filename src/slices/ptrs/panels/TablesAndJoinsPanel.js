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
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { useUpdatePtrsMutation } from "../hooks/usePtrsQueries";
import { savePtrsJoins } from "../services/joins.ptrsApi";
import {
  usePtrsDatasetsQuery,
  usePtrsJoinsQuery,
  usePtrsUnifiedSampleQuery,
} from "../hooks/usePtrsQueries";
import JoinsDesigner from "../components/JoinsDesigner";

export default function TablesAndJoinsPanel() {
  const [params] = useSearchParams();
  const debugJoins =
    params.get("debug") === "1" || params.get("debug") === "joins";
  const { goTo } = usePtrsNavigation();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsContext();

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

      const conditions = Array.isArray(targetJoins?.conditions)
        ? targetJoins.conditions
        : [];
      const customFields = Array.isArray(targetJoins?.customFields)
        ? targetJoins.customFields
        : [];

      const payload = {
        joins: { conditions },
        customFields,
        profileId,
      };

      await savePtrsJoins(ptrsId, payload);

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

  const dsQ = usePtrsDatasetsQuery(ptrsId);
  const joinsQ = usePtrsJoinsQuery(ptrsId);

  const mainDatasetId =
    (dsQ.data?.items || []).find(
      (d) => String(d?.role || "").toLowerCase() === "main",
    )?.id ||
    (dsQ.data?.items || [])[0]?.id ||
    null;

  const sampleQ = usePtrsUnifiedSampleQuery(ptrsId, {
    datasetId: mainDatasetId,
    limit: 5,
    offset: 0,
  });

  useEffect(() => {
    setLoading(Boolean(dsQ.isLoading || joinsQ.isLoading || sampleQ.isLoading));
  }, [dsQ.isLoading, joinsQ.isLoading, sampleQ.isLoading]);

  useEffect(() => {
    if (dsQ.isError)
      showAlert(dsQ.error?.message || "Failed to load datasets", "error");
  }, [dsQ.isError, dsQ.error, showAlert]);

  useEffect(() => {
    if (joinsQ.isError)
      showAlert(joinsQ.error?.message || "Failed to load joins", "error");
  }, [joinsQ.isError, joinsQ.error, showAlert]);

  useEffect(() => {
    if (sampleQ.isError)
      showAlert(sampleQ.error?.message || "Failed to load sample", "error");
  }, [sampleQ.isError, sampleQ.error, showAlert]);

  useEffect(() => {
    setDatasets(dsQ.data?.items || []);
  }, [dsQ.data]);

  // normalise joins (same logic you already have)
  const normaliseJoins = (raw) => {
    if (!raw || typeof raw !== "object")
      return { conditions: [], customFields: [] };

    const joinsSource = raw.joins ||
      raw.map?.joins || {
        conditions: [],
        customFields: [],
      };

    let conditions = [];
    let customFields = [];

    if (Array.isArray(joinsSource)) {
      conditions = joinsSource;
    } else if (joinsSource && typeof joinsSource === "object") {
      if (Array.isArray(joinsSource.conditions))
        conditions = joinsSource.conditions;
      if (Array.isArray(joinsSource.customFields))
        customFields = joinsSource.customFields;
    }

    const topLevelCustomFields =
      raw.customFields || raw.map?.customFields || null;
    if (Array.isArray(topLevelCustomFields))
      customFields = topLevelCustomFields;

    return { conditions, customFields };
  };

  useEffect(() => {
    const mapRes = joinsQ.data || null;
    const { conditions, customFields } = normaliseJoins(mapRes || {});
    setJoins({ conditions, customFields });

    const initialHash = computeJoinsHash({ conditions, customFields });
    lastSavedHashRef.current = initialHash;
    dirtyRef.current = false;
  }, [joinsQ.data]);

  useEffect(() => {
    const unified = sampleQ.data || null;

    if (debugJoins) {
      console.log("[TablesAndJoinsPanel] unified sample raw", unified);
    }
    const inferred = Array.isArray(unified?.headers) ? unified.headers : [];
    const meta =
      unified && typeof unified.headerMeta === "object"
        ? unified.headerMeta
        : {};

    // Derive main-only headers per main role from unified headerMeta.
    const byRole = {};
    for (const h of inferred) {
      const srcs = meta?.[h]?.sources || [];
      if (!Array.isArray(srcs) || !srcs.length) continue;

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
      finalByRole[role] = Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    const mains = Array.from(
      new Set(Object.values(finalByRole).flatMap((arr) => arr || [])),
    ).sort((a, b) => a.localeCompare(b));

    // Examples: header -> best available example (from headerMeta if present)
    const ex = {};
    for (const h of inferred) {
      const hm = meta?.[h] || {};
      const example =
        hm.example ??
        (hm.examples
          ? (hm.examples.main ?? Object.values(hm.examples)[0])
          : "");
      ex[h] = example == null ? "" : String(example);
    }

    setHeaders(inferred);
    setExamples(ex);
    setMainHeadersByRole(finalByRole);
    setMainHeaders(mains);

    if (debugJoins) {
      // eslint-disable-next-line no-console
      console.log("[TablesAndJoinsPanel] loaded data", {
        datasets: dsQ.data?.items || [],
        headers: inferred,
        examples: ex,
        mainHeaders: mains,
        mainHeadersByRole: finalByRole,
      });
    }
  }, [sampleQ.data, debugJoins, dsQ.data]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

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
    goTo(`map?${qs.toString()}`, { includeId: false });
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
          customFields={joins.customFields}
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
