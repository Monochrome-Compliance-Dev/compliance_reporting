import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import {
  PTRS_REQUIRED_FIELDS,
  PTRS_OPTIONAL_FIELDS,
  PTRS_FIELD_LABELS,
  FIELD_SYNONYMS,
  PTRS_REQUIRED_FIELD_GROUPS,
} from "../ingestConfig";
import { usePtrsContext } from "../context/PtrsContext";
import { getFieldLabel } from "../services/ingestConfig";
import {
  useUpdatePtrsMutation,
  usePtrsDatasetsQuery,
  usePtrsMapQuery,
  usePtrsUnifiedSampleQuery,
  usePtrsBlueprintQuery,
} from "../hooks/usePtrsQueries";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import {
  extractMappingsFromAny,
  getPtrsMap,
  listPtrsWithMap,
  savePtrsMap,
  buildPtrsMappedDataset,
} from "../services/maps.ptrsApi";
import SupportingDatasetsSection from "./SupportingDatasetsSection";
import { LoadingSpinner } from "shared/ui";

export default function MapPanel() {
  const labelFor = (fieldId) =>
    PTRS_FIELD_LABELS?.[fieldId] || getFieldLabel(fieldId, fieldId);
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const ptrsId = params.get("ptrsId");
  const { profileId } = usePtrsContext();

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const dsQ = usePtrsDatasetsQuery(ptrsId);
  const mainDatasetId =
    (dsQ.data?.items || []).find(
      (d) => String(d?.role || "").toLowerCase() === "main",
    )?.id ||
    (dsQ.data?.items || [])[0]?.id ||
    null;

  const mapQ = usePtrsMapQuery(ptrsId);
  const sampleQ = usePtrsUnifiedSampleQuery(ptrsId, {
    datasetId: mainDatasetId,
    limit: 5,
    offset: 0,
  });
  const bpQ = usePtrsBlueprintQuery({ profileId });

  const [blueprint, setBlueprint] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [examples, setExamples] = useState({});
  const [headerMeta, setHeaderMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [staging, setStaging] = useState(false);
  const [mapExtras, setMapExtras] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const [savingMap, setSavingMap] = useState(false);

  const isBusy = loading || staging || savingMap;

  // prevent double-submit / re-entrancy
  const stagingRef = useRef(false);

  const [ptrssWithMaps, setPtrssWithMaps] = useState([]);
  const [selectedCopyPtrs, setSelectedCopyPtrs] = useState(null);

  // target -> source (result of drag or select)
  const [assign, setAssign] = useState({});
  // user-defined placeholder targets
  const [customFields, setCustomFields] = useState([]);
  const [, setCustomFieldConfig] = useState(null);
  const [newCustomName, setNewCustomName] = useState("");
  const [joins, setJoins] = useState([]);

  const [supportingDatasetsCount, setSupportingDatasetsCount] = useState(0);

  // sources pane
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  // Helper to open the import dialog and blur the triggering element
  const openImportDialog = (event) => {
    // Move focus off the triggering element before the dialog mounts
    if (
      event &&
      event.currentTarget &&
      typeof event.currentTarget.blur === "function"
    ) {
      event.currentTarget.blur();
    }
    setImportOpen(true);
  };

  // --- Load headers + any existing saved map (query-driven; cache-friendly)
  useEffect(() => {
    if (!ptrsId) return;

    // Helper to safely get cell value from row with possible {data:{}} or flat
    function pickCell(row, h) {
      if (row && typeof row === "object") {
        if (row.data && typeof row.data === "object" && h in row.data)
          return row.data[h];
        if (h in row) return row[h];
      }
      return undefined;
    }

    // Drive page loading state off queries
    setLoading(
      Boolean(
        dsQ.isLoading || mapQ.isLoading || sampleQ.isLoading || bpQ.isLoading,
      ),
    );

    if (mapQ.isError) {
      showAlert(mapQ.error?.message || "Failed to load mapping info", "error");
      return;
    }

    if (sampleQ.isError) {
      showAlert(
        sampleQ.error?.message || "Failed to load sample headers",
        "error",
      );
      return;
    }

    if (bpQ.isError) {
      // Blueprint should never block mapping
      showAlert(bpQ.error?.message || "Failed to load blueprint", "warning");
    }

    const mapRes = mapQ.data || null;
    const unified = sampleQ.data || null;
    const bp = bpQ.data || null;

    // If neither map nor sample is ready yet, do nothing (queries still loading)
    if (!mapRes && !unified) return;

    const existingExtras = mapRes?.extras || mapRes?.map?.extras || null;
    setMapExtras(existingExtras);

    const existing =
      (mapRes && (mapRes.mappings || mapRes.map?.mappings)) || null;

    // Normalise joins/customFields across old and new shapes
    const normaliseJoins = (raw) => {
      if (!raw) return { joins: [], customFields: null };

      // joins can be an array or an object with { conditions, customFields }
      const joinsSource = raw.joins || raw.map?.joins || null;
      let joinsArr = [];
      let customFieldsArr = null;

      if (Array.isArray(joinsSource)) {
        joinsArr = joinsSource;
      } else if (
        joinsSource &&
        typeof joinsSource === "object" &&
        Array.isArray(joinsSource.conditions)
      ) {
        joinsArr = joinsSource.conditions;
        if (Array.isArray(joinsSource.customFields)) {
          customFieldsArr = joinsSource.customFields;
        }
      }

      // Top-level customFields (preferred)
      const topLevelCustomFields =
        raw.customFields || raw.map?.customFields || null;
      if (Array.isArray(topLevelCustomFields)) {
        customFieldsArr = topLevelCustomFields;
      }

      return {
        joins: joinsArr,
        customFields: Array.isArray(customFieldsArr) ? customFieldsArr : null,
      };
    };

    const { joins: existingJoins, customFields: existingCustomFields } =
      normaliseJoins(mapRes || {});

    const initialCustomFields = Array.isArray(existingCustomFields)
      ? existingCustomFields
          .map((cf) =>
            cf && typeof cf === "object" ? cf.key || cf.field || null : null,
          )
          .filter((n) => n && typeof n === "string")
      : [];

    if (bp) setBlueprint(bp || null);

    // headers: prefer unified sample, otherwise fall back to saved mapMeta headers
    const inferred =
      (unified?.headers?.length ? unified.headers : null) ||
      (Array.isArray(existingExtras?.mapMeta?.sourceHeaders)
        ? existingExtras.mapMeta.sourceHeaders
        : []) ||
      [];

    const rows = (unified?.rows?.length ? unified.rows : []) || [];

    // capture header meta if unified sample provided it
    if (
      unified &&
      unified.headerMeta &&
      typeof unified.headerMeta === "object"
    ) {
      setHeaderMeta(unified.headerMeta);
    } else {
      setHeaderMeta({});
    }

    setJoins(Array.isArray(existingJoins) ? existingJoins : []);
    setCustomFieldConfig(
      Array.isArray(existingCustomFields) ? existingCustomFields : null,
    );

    setHeaders(inferred);

    // build examples map: header -> first non-empty value
    const ex = {};
    for (const h of inferred) {
      for (const r of rows) {
        const v = pickCell(r, h);
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          ex[h] = String(v);
          break;
        }
      }
      if (!ex[h]) ex[h] = "";
    }
    setExamples(ex);

    // existing shape may be: { "<source>": { field: "<target>", type } }
    const toTargetSource = {};
    if (existing && typeof existing === "object") {
      for (const [src, cfg] of Object.entries(existing)) {
        const field = cfg?.field || null;
        if (field) toTargetSource[field] = src;
      }
    }
    setAssign(toTargetSource);

    // collect any targets not in required/optional as custom placeholders,
    // seeded from any existing customField config
    const known = new Set([...PTRS_REQUIRED_FIELDS, ...PTRS_OPTIONAL_FIELDS]);
    const discovered = new Set(initialCustomFields);

    if (existing && typeof existing === "object") {
      for (const [, cfg] of Object.entries(existing)) {
        const field = cfg?.field;
        if (field && !known.has(field)) discovered.add(field);
      }
    }

    setCustomFields((prev) => [
      ...new Set([...prev, ...Array.from(discovered)]),
    ]);
  }, [
    ptrsId,
    profileId,
    showAlert,
    mapQ.isLoading,
    mapQ.isError,
    mapQ.error,
    mapQ.data,
    sampleQ.isLoading,
    sampleQ.isError,
    sampleQ.error,
    sampleQ.data,
    bpQ.isLoading,
    bpQ.isError,
    bpQ.error,
    bpQ.data,
    dsQ.isLoading,
  ]);

  // Lazy-load "copy map from previous ptrs" options only when the dialog is opened.
  useEffect(() => {
    let mounted = true;

    const normHeaderKey = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

    async function loadCopyOptions() {
      if (!importOpen) return;
      try {
        const lr = await listPtrsWithMap();
        const allPtrss = lr.items || [];

        const inferredNormSet = new Set(
          (headers || []).map(normHeaderKey).filter(Boolean),
        );

        const fromMeta = [];
        let metaSeen = false;

        for (const run of allPtrss) {
          const meta = run?.mapMeta || run?.extras?.mapMeta;
          const srcNorm = Array.isArray(meta?.sourceHeadersNorm)
            ? meta.sourceHeadersNorm
            : null;
          if (srcNorm) metaSeen = true;

          if (!srcNorm || !srcNorm.length) continue;

          let count = 0;
          for (const h of srcNorm) {
            if (inferredNormSet.has(String(h || "").trim())) count += 1;
          }
          if (count > 0) fromMeta.push({ ...run, compatibleCount: count });
        }

        if (metaSeen) {
          fromMeta.sort(
            (a, b) => (b.compatibleCount || 0) - (a.compatibleCount || 0),
          );
          if (mounted) setPtrssWithMaps(fromMeta);
          return;
        }

        // Temporary fallback: older maps may not have metadata yet.
        // Avoid 429s by doing a capped, sequential compatibility scan.
        const MAX_SCAN = 25;
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        const compatible = [];
        const scanList = allPtrss.slice(0, MAX_SCAN);

        for (const run of scanList) {
          try {
            const res = await getPtrsMap(run.id);
            const mapObj = (res && (res.mappings || res.map?.mappings)) || {};

            const srcHeaders = Object.keys(mapObj || {});
            const srcNorm = srcHeaders.map(normHeaderKey).filter(Boolean);

            let count = 0;
            for (const h of srcNorm) {
              if (inferredNormSet.has(h)) count += 1;
            }

            if (count > 0) compatible.push({ ...run, compatibleCount: count });

            // small delay to reduce rate-limit risk
            await sleep(120);
          } catch (err) {
            if (err?.status === 429 || err?.response?.status === 429) break;
          }
        }

        compatible.sort(
          (a, b) => (b.compatibleCount || 0) - (a.compatibleCount || 0),
        );
        if (mounted) setPtrssWithMaps(compatible);
      } catch {
        if (mounted) setPtrssWithMaps([]);
      }
    }

    loadCopyOptions();

    return () => {
      mounted = false;
    };
  }, [importOpen, headers]);

  // quick helpers
  const usedSources = useMemo(
    () => new Set(Object.values(assign || {})),
    [assign],
  );

  const filteredSources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = headers || [];
    if (!needle) return all;
    return all.filter((h) => h.toLowerCase().includes(needle));
  }, [headers, search]);

  // HTML5 DnD
  const onDragStart = (e, sourceHeader) => {
    try {
      e.dataTransfer.setData("text/plain", sourceHeader);
    } catch {}
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    const source = e.dataTransfer.getData("text/plain");
    if (!source) return;
    assignSourceToTarget(source, targetField);
  };

  const allowDrop = (e) => e.preventDefault();

  // Assign helper: ensures a source is only mapped to a single target
  const assignSourceToTarget = (source, targetField) => {
    setAssign((prev) => {
      const next = { ...prev };

      // Ensure a source is only mapped to a single target
      for (const k of Object.keys(next)) {
        if (next[k] === source) next[k] = undefined;
      }

      next[targetField] = source || undefined;
      setIsDirty(true);
      return next;
    });
  };

  const clearTarget = (targetField) =>
    setAssign((prev) => {
      const next = { ...prev };
      delete next[targetField];
      setIsDirty(true);
      return next;
    });

  const clearAll = () => {
    setAssign({});
    setIsDirty(true);
  };

  // --- Custom fields helpers ---
  const addCustomField = (name) => {
    const safe = String(name || "").trim();
    if (!safe) return;
    const existsInCore =
      PTRS_REQUIRED_FIELDS.includes(safe) ||
      PTRS_OPTIONAL_FIELDS.includes(safe);
    if (existsInCore) {
      showAlert("That field name already exists in the core schema.", "info");
      return;
    }

    setCustomFields((prev) => {
      const next = [...new Set([...prev, safe])];
      return next;
    });
    setIsDirty(true);
    setNewCustomName("");
  };

  const removeCustomField = (name) => {
    setCustomFields((prev) => prev.filter((f) => f !== name));
    setAssign((prev) => {
      const n = { ...prev };
      if (n[name]) delete n[name];
      return n;
    });
    setIsDirty(true);
  };

  // Generate a safe, unique custom field name from a source header
  const makeUniqueCustomName = (raw) => {
    const knownCore = new Set([
      ...PTRS_REQUIRED_FIELDS,
      ...PTRS_OPTIONAL_FIELDS,
    ]);
    const sanitize = (s) =>
      String(s || "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^A-Za-z0-9_]/g, "")
        .replace(/^_+|_+$/g, "");
    let base = sanitize(raw) || "CustomField";
    // Avoid starting with a number
    if (/^[0-9]/.test(base)) base = `F_${base}`;
    // Avoid core collisions
    if (knownCore.has(base)) base = `${base}_1`;
    // Ensure uniqueness against existing custom fields too
    let name = base;
    let i = 1;
    const exists = (n) => knownCore.has(n) || customFields.includes(n);
    while (exists(name)) {
      i += 1;
      name = `${base}_${i}`;
    }
    return name;
  };

  // --- Auto-suggest helpers ---
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const aliasesFor = (fieldId) => {
    const label = getFieldLabel(fieldId, fieldId);
    const custom = FIELD_SYNONYMS?.[fieldId] || [];
    const bpSyns =
      (blueprint?.fields || []).find((f) => f.field === fieldId)?.synonyms ||
      [];
    return [fieldId, label, ...bpSyns, ...custom].map(norm).filter(Boolean);
  };

  const autoSuggest = () => {
    let didChange = false;
    const available = headers.filter((h) => !usedSources.has(h));
    const byNorm = new Map();
    for (const h of available) byNorm.set(norm(h), h);

    let applied = 0;
    setAssign((prev) => {
      const next = { ...prev };
      const alreadyUsed = new Set(Object.values(next).filter(Boolean));

      const allTargets = [
        ...PTRS_REQUIRED_FIELDS,
        ...PTRS_OPTIONAL_FIELDS.filter(
          (f) => !PTRS_REQUIRED_FIELDS.includes(f),
        ),
      ];

      for (const target of allTargets) {
        if (next[target]) continue; // don't override user choice
        const candidates = aliasesFor(target);

        // 1) exact normalized match
        let chosen = null;
        for (const a of candidates) {
          const h = byNorm.get(a);
          if (h && !alreadyUsed.has(h)) {
            chosen = h;
            break;
          }
        }
        // 2) contains match (header contains alias)
        if (!chosen) {
          for (const a of candidates) {
            const found = available.find(
              (h) => !alreadyUsed.has(h) && norm(h).includes(a),
            );
            if (found) {
              chosen = found;
              break;
            }
          }
        }
        if (chosen) {
          next[target] = chosen;
          alreadyUsed.add(chosen);
          applied += 1;
        }
      }
      if (applied > 0) {
        didChange = true;
        showAlert(`Auto-suggest mapped ${applied} field(s)`, "success");
      } else {
        showAlert(
          "No suggestions found — try mapping a few fields first",
          "info",
        );
      }
      return next;
    });
    if (didChange) setIsDirty(true);
  };

  // Resolve a header name against current headers with loose matching:
  // 1) exact
  // 2) case-insensitive + trim
  // 3) "normalized" (collapse spaces & strip non-alphanum)
  const resolveHeader = (headersArr, sourceName) => {
    if (!sourceName) return null;
    const exactSet = new Set(headersArr || []);
    if (exactSet.has(sourceName)) return sourceName;
    const srcTrim = String(sourceName).trim();
    for (const h of headersArr || []) {
      if (String(h).trim() === srcTrim) return h;
    }
    const toNorm = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    const srcNorm = toNorm(srcTrim);
    for (const h of headersArr || []) {
      if (toNorm(h) === srcNorm) return h;
    }
    return null;
  };

  // Convert BE map object -> assign (target->source), validating headers with loose resolving
  const applyIncomingMap = (obj) => {
    if (!obj || typeof obj !== "object")
      return { applied: 0, nextAssign: assign };
    const validHeaders = Array.isArray(headers) ? headers : [];
    const next = { ...assign };
    let applied = 0;

    // DEBUG: inspect why saved maps are considered incompatible
    // eslint-disable-next-line no-console
    // console.groupCollapsed("[applyIncomingMap] Start — headers vs saved map");
    // eslint-disable-next-line no-console
    // console.log("Current headers:", validHeaders);

    for (let [source, cfg] of Object.entries(obj)) {
      const target = cfg?.field;
      if (!target) {
        // eslint-disable-next-line no-console
        console.warn("❌ Skipped mapping: no target for", source, cfg);
        continue;
      }

      // try to resolve the source header against current headers
      const resolved = resolveHeader(validHeaders, source);
      if (!resolved) {
        // eslint-disable-next-line no-console
        console.warn("⚠️ Could not resolve header:", { source, target });
        continue;
      }

      // ensure a source maps to one target only
      for (const k of Object.keys(next))
        if (next[k] === resolved) next[k] = undefined;

      if (!next[target]) {
        next[target] = resolved;
        applied += 1;
        // eslint-disable-next-line no-console
        // console.log("✅ Mapped:", { source, resolved, target });
      } else {
        // eslint-disable-next-line no-console
        console.log("⤵️ Already had target assigned; keeping existing:", {
          target,
          existing: next[target],
          incoming: resolved,
        });
      }
    }

    // Register unknown targets as custom fields
    const known = new Set([...PTRS_REQUIRED_FIELDS, ...PTRS_OPTIONAL_FIELDS]);
    const discovered = new Set();
    for (const [, cfg] of Object.entries(obj)) {
      const t = cfg?.field;
      if (t && !known.has(t)) discovered.add(t);
    }
    if (discovered.size) {
      setCustomFields((prev) => [...new Set([...prev, ...discovered])]);
    }

    // eslint-disable-next-line no-console
    // console.log(
    //   "Discovered custom fields (if any):",
    //   Array.from(discovered.values?.() || discovered)
    // );
    // eslint-disable-next-line no-console
    // console.log("Applied count:", applied, "Final assign:", next);
    // eslint-disable-next-line no-console
    // console.groupEnd();

    setAssign(next);
    return { applied, nextAssign: next };
  };

  const handleImportJson = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const mappings = extractMappingsFromAny(raw);
      // eslint-disable-next-line no-console
      console.log(
        "[handleImportJson] Extracted mappings keys:",
        Object.keys(mappings || {}),
      );
      if (!mappings || typeof mappings !== "object") {
        showAlert("No usable mappings found in file", "info");
      } else {
        const { applied, nextAssign } = applyIncomingMap(mappings);
        if (applied > 0) {
          await save(true, nextAssign);
          showAlert(
            `Imported mapping for ${applied} field(s) and auto-saved the map`,
            "success",
          );
        } else {
          showAlert("No compatible headers found in this file", "info");
        }
      }
    } catch {
      showAlert("Invalid JSON mapping file", "error");
    }
  };

  const copyFromPtrsId = async (otherPtrsId) => {
    try {
      const res = await getPtrsMap(otherPtrsId);
      const obj = (res && (res.mappings || res.map?.mappings)) || {};
      // eslint-disable-next-line no-console
      // console.log("[copyFromPtrsId] Loaded map shape:", {
      //   keys: Object.keys(res || {}),
      //   hasMap: !!res?.map,
      //   hasMappings: !!res?.mappings,
      //   appliedFrom: otherPtrsId,
      // });
      const { applied, nextAssign } = applyIncomingMap(obj);
      if (applied > 0) {
        await save(true, nextAssign);
        showAlert(
          `Copied ${applied} mapping(s) from ${otherPtrsId} and auto-saved the map`,
          "success",
        );
        setImportOpen(false);
      } else {
        showAlert(
          `No compatible mappings found on ptrs ${otherPtrsId}`,
          "info",
        );
      }
    } catch (e) {
      showAlert(e?.message || "Failed to load map from that ptrs", "error");
    }
  };

  async function save(autoOrEvent = false, assignOverride) {
    const auto = typeof autoOrEvent === "boolean" ? autoOrEvent : false;
    const effectiveAssign = assignOverride || assign;

    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return null;
    }

    if (!isDirty && !assignOverride) {
      if (!auto) showAlert("No mapping changes to save.", "info");
      return null;
    }

    // Prevent double-submit
    if (savingMap) return null;

    setSavingMap(true);

    try {
      // Convert target->source to BE shape
      const payload = {};

      const allowedTargets = new Set([
        ...PTRS_REQUIRED_FIELDS,
        ...PTRS_OPTIONAL_FIELDS,
        ...customFields,
        ...Object.keys(effectiveAssign || {}),
      ]);

      for (const [tgt, src] of Object.entries(effectiveAssign || {})) {
        if (!src) continue;
        if (!tgt) continue;
        if (!allowedTargets.has(tgt)) continue;
        payload[src] = { field: tgt, type: "string" };
      }

      const count = Object.keys(payload).length;
      if (count === 0) {
        if (!auto) {
          showAlert(
            "Map is empty — assign at least one field before saving.",
            "info",
          );
        }
        return null;
      }

      const res = await savePtrsMap(ptrsId, {
        mappings: payload,
        extras: mapExtras,
        profileId,
      });

      // Keep latest extras (important so next save can truly be a no-op)
      let nextExtras = mapExtras || null;
      try {
        nextExtras = res?.extras || res?.map?.extras || nextExtras || null;
        setMapExtras(nextExtras);
      } catch {
        // ignore
      }

      const savedCount = Object.keys(res?.mappings || payload).length;
      if (!auto) {
        showAlert(
          `Saved map (${savedCount} field${savedCount === 1 ? "" : "s"})`,
          "success",
        );
      }

      setIsDirty(false);
      return res || { mappings: payload, extras: nextExtras };
    } catch (e) {
      showAlert(e?.message || "Failed to save map", "error");
      return null;
    } finally {
      setSavingMap(false);
    }
  }

  // UI bits
  const { goTo } = usePtrsNavigation();

  const stageData = async () => {
    if (isBusy) return;
    // Move to StagePanel (server will handle build/reuse if needed).
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    if (stagingRef.current) return;
    stagingRef.current = true;

    const abortStage = (message) => {
      showAlert(message, "error");
      setStaging(false);
      stagingRef.current = false;
    };

    // Guard: ensure all required canonical targets are mapped before staging
    const missingRequired = (PTRS_REQUIRED_FIELDS || []).filter(
      (field) => !assign?.[field],
    );

    if (missingRequired.length > 0) {
      const labels = missingRequired.map((f) => labelFor(f));
      abortStage(
        `Before staging, please map the required field(s): ${labels.join(", ")}`,
      );
      return;
    }

    // Guard: if joins are configured, ensure the main-side join columns are actually mapped
    // (i.e. the source header is assigned to any target). We only enforce this when the
    // user proceeds to Stage, to avoid nagging during mapping.
    const joinConditions = Array.isArray(joins) ? joins : [];
    const requiredMainJoinHeaders = joinConditions
      .filter((c) => c?.from?.role === "main" && c?.from?.column)
      .map((c) => c.from.column)
      .filter(Boolean);

    if (requiredMainJoinHeaders.length) {
      const assignedSourceHeaders = new Set(
        Object.values(assign || {}).filter((v) => typeof v === "string" && v),
      );
      const missingJoinHeaders = requiredMainJoinHeaders.filter(
        (h) => !assignedSourceHeaders.has(h),
      );

      if (missingJoinHeaders.length) {
        abortStage(
          `Before staging, please map the join key column(s): ${missingJoinHeaders.join(
            ", ",
          )}`,
        );
        return;
      }
    }

    if (groupedRequirementFailures.length > 0) {
      const messages = groupedRequirementFailures.map(
        (g) => `${g.label} (map at least one)`,
      );
      abortStage(`Before staging, please map: ${messages.join(", ")}`);
      return;
    }

    setStaging(true);

    try {
      if (isDirty) {
        await save(true);
      }

      // 🔥 Kick off mapped-row rebuild without blocking navigation.
      // The Stage screen can show the latest snapshot while the rebuild runs.
      // Server should also short-circuit if nothing materially changed.
      try {
        buildPtrsMappedDataset(ptrsId).catch((err) => {
          showAlert(err?.message || "Failed to rebuild mapped rows", "error");
        });
      } catch (err) {
        // If the call setup itself fails, still allow navigation.
        showAlert(
          err?.message || "Failed to start mapped-row rebuild",
          "warning",
        );
      }

      // No heavy build work here.
      // Stage step will decide whether to rebuild or reuse server-side based on the saved map and inputs.

      try {
        await updatePtrsStep.mutateAsync({ currentStep: "stage" });
      } catch (err) {
        console.error(err);
        showAlert(
          "Failed to update PTRS step. Continuing to Staging.",
          "warning",
        );
      }

      const qs = new URLSearchParams();
      qs.set("ptrsId", ptrsId);
      if (profileId) qs.set("profileId", profileId);

      // Navigate immediately (don’t wait for 200k-row work)
      goTo(`stage?${qs.toString()}`, { includeId: false });
    } catch (e) {
      showAlert(
        e?.message || "Failed to stage data. Please try again.",
        "error",
      );
    } finally {
      setStaging(false);
      stagingRef.current = false;
    }
  };

  const TargetBin = ({ field }) => {
    const assigned = assign[field] || null;
    const options = headers;
    const getLabel = (h) =>
      h ? (examples[h] ? `${h} — e.g. ${examples[h]}` : h) : "";
    return (
      <Paper
        onDragOver={allowDrop}
        onDrop={(e) => handleDrop(e, field)}
        variant="outlined"
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderStyle: "dashed",
          bgcolor: assigned ? theme.palette.action.hover : "transparent",
        }}
      >
        <Typography sx={{ fontWeight: 600, pr: 2, minWidth: 260 }}>
          {labelFor(field)}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          {assigned ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={assigned}
                onDelete={() => clearTarget(field)}
                deleteIcon={<ClearIcon />}
                size="small"
              />
              {examples[assigned] && (
                <Typography variant="caption" color="text.secondary">
                  e.g. {examples[assigned]}
                </Typography>
              )}
              <Chip
                label="Mapped"
                size="small"
                color="success"
                variant="outlined"
              />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Drag a source column here
            </Typography>
          )}
          <Autocomplete
            disablePortal
            fullWidth
            size="small"
            options={options}
            value={assigned}
            onChange={(e, val) => assignSourceToTarget(val || undefined, field)}
            getOptionLabel={getLabel}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign"
                placeholder="Type to search…"
              />
            )}
          />
        </Stack>
      </Paper>
    );
  };

  const requiredMappedCount = PTRS_REQUIRED_FIELDS.filter(
    (f) => !!assign[f],
  ).length;

  const groupedRequirementFailures = (PTRS_REQUIRED_FIELD_GROUPS || []).filter(
    (group) => {
      const mappedCount = group.fields.filter((f) => !!assign[f]).length;
      return mappedCount < (group.minRequired || 1);
    },
  );

  const optionalMappedCount = PTRS_OPTIONAL_FIELDS.filter(
    (f) => !PTRS_REQUIRED_FIELDS.includes(f) && !!assign[f],
  ).length;

  // right pane sources item
  const SourceToken = ({ h }) => {
    const used = usedSources.has(h);
    const meta = headerMeta?.[h];
    let sourceLabel = "";
    if (meta && Array.isArray(meta.sources) && meta.sources.length) {
      const hasMain = meta.sources.some((s) => s?.kind === "main");
      const datasetLabels = new Set();
      meta.sources.forEach((s) => {
        if (s?.fileName) datasetLabels.add(s.fileName);
        else if (s?.role) datasetLabels.add(s.role);
      });
      const dsList = Array.from(datasetLabels);
      if (hasMain && dsList.length) {
        sourceLabel = `Source: Main dataset + ${dsList.join(", ")}`;
      } else if (hasMain) {
        sourceLabel = "Source: Main dataset";
      } else if (dsList.length) {
        sourceLabel = `Source: ${dsList.join(", ")}`;
      }
    }

    return (
      <Paper
        key={h}
        draggable
        onDragStart={(e) => onDragStart(e, h)}
        variant="outlined"
        sx={{
          p: 1,
          mb: 1,
          opacity: used ? 0.4 : 1,
          cursor: "grab",
        }}
      >
        <Typography variant="body2">{h}</Typography>
        {examples[h] && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            e.g. {examples[h]}
          </Typography>
        )}
        {sourceLabel && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25 }}
          >
            {sourceLabel}
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        gap: 2,
      }}
    >
      {/* LEFT: targets/workspace */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Map columns
        </Typography>

        {/* Required */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2">Required fields</Typography>
            <Chip
              size="small"
              label={`${requiredMappedCount}/${PTRS_REQUIRED_FIELDS.length} mapped`}
            />
          </Stack>
          <Stack spacing={1}>
            {PTRS_REQUIRED_FIELDS.map((f) => (
              <TargetBin key={f} field={f} />
            ))}
          </Stack>
        </Paper>

        {/* Optional accordion */}
        <Accordion elevation={0} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">Optional fields</Typography>
              <Chip size="small" label={`${optionalMappedCount} mapped`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {PTRS_OPTIONAL_FIELDS.filter(
                (f) => !PTRS_REQUIRED_FIELDS.includes(f),
              ).map((f) => (
                <TargetBin key={f} field={f} />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Custom fields */}
        <Accordion elevation={0} sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">Custom fields</Typography>
              <Chip size="small" label={`${customFields.length} added`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {/* Drag-to-create placeholder */}
              <Box
                onDragOver={allowDrop}
                onDrop={(e) => {
                  e.preventDefault();
                  const source = e.dataTransfer.getData("text/plain");
                  if (!source) return;
                  const newName = makeUniqueCustomName(source);
                  if (!customFields.includes(newName)) {
                    setCustomFields((prev) => [...prev, newName]);
                  }
                  assignSourceToTarget(source, newName);
                  setIsDirty(true);
                  showAlert(
                    `Created "${newName}" and mapped from "${source}"`,
                    "success",
                  );
                }}
                sx={{
                  p: 2,
                  border: "1px dashed",
                  borderColor: theme.palette.divider,
                  borderRadius: 1,
                  textAlign: "center",
                  color: theme.palette.text.secondary,
                  fontStyle: "italic",
                  mb: 1.5,
                  bgcolor: theme.palette.action.hover,
                  cursor: "copy",
                }}
              >
                Drag a source column here to create a new placeholder field
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  id="customFieldInput"
                  size="small"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="Add a placeholder (e.g. DocumentType)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomField(newCustomName);
                    }
                  }}
                  sx={{ maxWidth: 360 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addCustomField(newCustomName)}
                >
                  Add
                </Button>
              </Stack>

              {customFields.length > 0 && (
                <Stack spacing={1}>
                  {customFields.map((f) => (
                    <Paper
                      key={f}
                      variant="outlined"
                      sx={{ p: 1, borderStyle: "dashed" }}
                      onDragOver={allowDrop}
                      onDrop={(e) => handleDrop(e, f)}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        justifyContent="space-between"
                      >
                        <Typography
                          sx={{ fontWeight: 600, pr: 2, minWidth: 200 }}
                        >
                          {labelFor(f)}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ flex: 1 }}
                        >
                          {assign[f] ? (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Chip
                                label={assign[f]}
                                onDelete={() => clearTarget(f)}
                                deleteIcon={<ClearIcon />}
                                size="small"
                              />
                              {examples[assign[f]] && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  e.g. {examples[assign[f]]}
                                </Typography>
                              )}
                              <Chip
                                label="Mapped"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Stack>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mr: 1 }}
                            >
                              Drag a source column here
                            </Typography>
                          )}
                          <Autocomplete
                            disablePortal
                            fullWidth
                            size="small"
                            options={headers}
                            value={assign[f] || null}
                            onChange={(e, val) =>
                              assignSourceToTarget(val || undefined, f)
                            }
                            getOptionLabel={(h) =>
                              h
                                ? examples[h]
                                  ? `${h} — e.g. ${examples[h]}`
                                  : h
                                : ""
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Assign"
                                placeholder="Type to search…"
                              />
                            )}
                          />
                          <Tooltip title="Remove placeholder">
                            <IconButton
                              size="small"
                              onClick={() => removeCustomField(f)}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Supporting datasets */}
        <Accordion elevation={0} sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">Supporting datasets</Typography>
              {supportingDatasetsCount > 0 && (
                <Chip
                  size="small"
                  label={`Total datasets: ${supportingDatasetsCount}`}
                />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <SupportingDatasetsSection
              ptrsId={ptrsId}
              onChanged={() => {}}
              onTotalChange={setSupportingDatasetsCount}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Sticky action bar */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            py: 1,
            bgcolor: theme.palette.background.paper,
            zIndex: 10,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            boxShadow: (t) => t.shadows[2],
          }}
        >
          {savingMap && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LoadingSpinner size={20} />
              <Typography variant="body2">Saving map…</Typography>
            </Box>
          )}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {!staging && (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<DeleteSweepIcon />}
                  onClick={clearAll}
                  disabled={!Object.keys(assign).length}
                >
                  Clear all
                </Button>
                <Button
                  size="small"
                  startIcon={<AutoFixHighIcon />}
                  onClick={autoSuggest}
                >
                  Auto-suggest
                </Button>
                <Button
                  size="small"
                  startIcon={<ContentPasteGoIcon />}
                  onClick={openImportDialog}
                >
                  Import / Copy map
                </Button>
              </Stack>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => save(false)}
                disabled={isBusy || !isDirty}
              >
                Save map
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={stageData}
                disabled={isBusy}
              >
                Next: Stage data
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* RIGHT: sources */}
      <Box
        sx={{
          position: { lg: "sticky" },
          top: { lg: theme.spacing(2) },
          height: "fit-content",
        }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <SearchIcon fontSize="small" />
            <TextField
              size="small"
              placeholder="Search source columns"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            <Tooltip title="Auto-suggest">
              <IconButton onClick={autoSuggest} size="small">
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import / Copy map">
              <IconButton onClick={openImportDialog} size="small">
                <ContentPasteGoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
            {filteredSources.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No headers match your search.
              </Typography>
            ) : (
              filteredSources.map((h) => <SourceToken key={h} h={h} />)
            )}
          </Box>
        </Paper>
      </Box>

      {/* Import/Copy dialog */}
      <Dialog
        open={importOpen}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          setImportOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import / Copy map</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                component="label"
              >
                Import JSON
                <input
                  type="file"
                  hidden
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    e.target.value = "";
                    if (f) handleImportJson(f);
                  }}
                />
              </Button>
            </Stack>
            <Divider />
            {ptrssWithMaps.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Or copy a map from a previous ptrs:
              </Typography>
            )}
            {ptrssWithMaps.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No compatible maps found for this dataset yet.
              </Typography>
            ) : (
              <Autocomplete
                size="small"
                options={ptrssWithMaps}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                getOptionLabel={(opt) => {
                  if (!opt) return "";
                  const base = opt.fileName
                    ? `${opt.fileName} — ${new Date(opt.createdAt).toLocaleDateString()}`
                    : opt.id;
                  const count =
                    typeof opt.compatibleCount === "number"
                      ? ` — ${opt.compatibleCount} matching field${
                          opt.compatibleCount === 1 ? "" : "s"
                        }`
                      : "";
                  return `${base}${count}`;
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.fileName
                      ? `${option.fileName} — ${new Date(
                          option.createdAt,
                        ).toLocaleDateString()}`
                      : option.id}
                    {typeof option.compatibleCount === "number" &&
                      option.compatibleCount > 0 && (
                        <span
                          style={{
                            marginLeft: 8,
                            opacity: 0.7,
                            fontSize: "0.8rem",
                          }}
                        >
                          ({option.compatibleCount} matching
                          {option.compatibleCount === 1 ? " field" : " fields"})
                        </span>
                      )}
                  </li>
                )}
                value={selectedCopyPtrs}
                onChange={(e, val) => setSelectedCopyPtrs(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Copy map from…"
                    placeholder="Pick a previous ptrs"
                  />
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Close</Button>
          <Button
            disabled={ptrssWithMaps.length === 0}
            onClick={() => {
              if (selectedCopyPtrs) {
                copyFromPtrsId(selectedCopyPtrs.id);
              } else {
                showAlert("Pick a ptrs to copy from", "info");
              }
            }}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
