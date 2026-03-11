import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import { useLocation, useSearchParams } from "react-router";
import { useAlert } from "context";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
// import FileUploadIcon from "@mui/icons-material/FileUpload";
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
  // extractMappingsFromAny,
  getPtrsFieldMap,
  listPtrsWithMap,
  savePtrsMap,
  savePtrsFieldMap,
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
  const location = useLocation();
  const isMapRoute = /(^|\/)map(\/|$)/i.test(location.pathname || "");
  const { profileId } = usePtrsContext();

  const sourceRefKey = (source) => {
    const role = String(source?.role || "main")
      .trim()
      .toLowerCase();
    const header = String(source?.header || "").trim();
    return `${role}::${header}`;
  };

  const normaliseSourceRef = (source, fallbackRole = "main") => {
    if (!source) return null;

    if (typeof source === "string") {
      return {
        header: source,
        role: String(fallbackRole || "main")
          .trim()
          .toLowerCase(),
      };
    }

    const header = String(
      source?.header || source?.sourceHeader || source?.column || "",
    ).trim();
    if (!header) return null;

    return {
      header,
      role: String(source?.role || source?.sourceRole || fallbackRole || "main")
        .trim()
        .toLowerCase(),
      datasetId: source?.datasetId || null,
      fileName: source?.fileName || null,
    };
  };

  const getSourceRefLabel = (source) => {
    const src = normaliseSourceRef(source);
    if (!src) return "";

    const role = String(src.role || "main").trim();
    return role ? `${src.header} — ${role}` : String(src.header || "");
  };

  const getSourceRefSearchText = useCallback((source) => {
    const src = normaliseSourceRef(source);
    if (!src) return "";
    return `${src.header} ${src.role || ""}`.toLowerCase().trim();
  }, []);

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const dsQ = usePtrsDatasetsQuery(ptrsId);

  const mapQ = usePtrsMapQuery(ptrsId);
  const sampleQ = usePtrsUnifiedSampleQuery(ptrsId, {
    limit: 5,
    offset: 0,
    enabled: isMapRoute,
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
  const sampleRefreshing = Boolean(sampleQ.isLoading || sampleQ.isFetching);

  // prevent double-submit / re-entrancy
  const stagingRef = useRef(false);
  // Prevent repeatedly re‑applying saved canonical field maps
  const didInitFromFieldMap = useRef(false);

  const [ptrssWithMaps, setPtrssWithMaps] = useState([]);
  const [selectedCopyPtrs, setSelectedCopyPtrs] = useState(null);
  const [loadingCopyMaps, setLoadingCopyMaps] = useState(false);

  // target -> source (result of drag or select)
  const [assign, setAssign] = useState({});
  // user-defined placeholder targets
  const [customFields, setCustomFields] = useState([]);
  const [joinCustomFields, setJoinCustomFields] = useState([]);
  const [newCustomName, setNewCustomName] = useState("");
  const [joins, setJoins] = useState([]);

  const [savedFieldMap, setSavedFieldMap] = useState([]);

  const [supportingDatasetsCount, setSupportingDatasetsCount] = useState(0);

  const mappedCount = Object.values(assign || {}).filter(Boolean).length;

  const showSampleRefreshNotice =
    sampleRefreshing && (mappedCount > 0 || savingMap || loading);

  const sampleRefreshMessage =
    supportingDatasetsCount > 1
      ? `Refreshing mapping metadata across ${supportingDatasetsCount} datasets. Headers, examples, and source provenance are being rebuilt before staging can continue.`
      : "Refreshing mapping metadata. Headers, examples, and source provenance are being rebuilt before staging can continue.";

  // sources pane
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const sourceOptions = useMemo(() => {
    if (!Array.isArray(headers) || !headers.length) return [];

    const meta =
      headerMeta && typeof headerMeta === "object" && !Array.isArray(headerMeta)
        ? headerMeta
        : {};

    // Do not invent fake `main` source options while unified provenance is still
    // loading. Saved canonical field-map hydration depends on real role-aware
    // source options, so an empty list is safer than a misleading fallback.
    if (!Object.keys(meta).length) return [];

    const datasetsById = new Map(
      (dsQ.data?.items || []).map((dataset) => [
        String(dataset?.id || ""),
        dataset,
      ]),
    );

    const out = [];
    const seen = new Set();

    for (const header of headers) {
      const sources = Array.isArray(meta?.[header]?.sources)
        ? meta[header].sources
        : [];

      if (!sources.length) continue;

      for (const src of sources) {
        const role = String(src?.role || src?.kind || "main")
          .trim()
          .toLowerCase();
        const datasetId = String(src?.datasetId || "").trim() || null;
        const dataset = datasetId ? datasetsById.get(datasetId) : null;

        const option = normaliseSourceRef(
          {
            header,
            role,
            datasetId,
            fileName:
              src?.fileName ||
              dataset?.fileName ||
              dataset?.originalName ||
              null,
          },
          role,
        );

        const key = sourceRefKey(option);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(option);
      }
    }

    return out;
  }, [headers, headerMeta, dsQ.data?.items]);

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

    if (isMapRoute && sampleQ.isError) {
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
    const unified = isMapRoute ? sampleQ.data || null : null;
    const bp = bpQ.data || null;

    console.log("sampleQ enabled?", {
      ptrsId,
      isMapRoute,
      pathname: location.pathname,
    });

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
    setJoinCustomFields(
      Array.isArray(existingCustomFields) ? existingCustomFields : [],
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

    // existing legacy mappings are header-keyed and cannot safely represent
    // supporting-role mappings. Only seed assign from them when there is no
    // active profile / canonical field-map path.
    if (!profileId) {
      const toTargetSource = {};
      if (existing && typeof existing === "object") {
        for (const [src, cfg] of Object.entries(existing)) {
          const field = cfg?.field || null;
          if (!field) continue;

          const sourceRef = normaliseSourceRef(src, cfg?.sourceRole || "main");

          if (sourceRef) {
            toTargetSource[field] = sourceRef;
          }
        }
      }
      setAssign(toTargetSource);
    }

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
    isMapRoute,
  ]);

  useEffect(() => {
    console.log("MapPanel mounted", location.pathname);
    return () => console.log("MapPanel unmounted", location.pathname);
  }, [location.pathname]);

  // Lazy-load canonical copy options only when the dialog is opened.
  // Source of truth is tbl_ptrs_field_map for the current profile.
  useEffect(() => {
    let mounted = true;

    async function loadCopyOptions() {
      if (!importOpen) return;

      if (!profileId) {
        if (mounted) setPtrssWithMaps([]);
        return;
      }

      try {
        if (mounted) setLoadingCopyMaps(true);

        const lr = await listPtrsWithMap(profileId);
        const items = Array.isArray(lr?.items)
          ? lr.items.filter(
              (run) => String(run?.id || "") !== String(ptrsId || ""),
            )
          : [];

        if (mounted) setPtrssWithMaps(items);
      } catch {
        if (mounted) setPtrssWithMaps([]);
      } finally {
        if (mounted) setLoadingCopyMaps(false);
      }
    }

    loadCopyOptions();

    return () => {
      mounted = false;
    };
  }, [importOpen, ptrsId, profileId]);

  useEffect(() => {
    let active = true;

    if (!ptrsId || !profileId) {
      setSavedFieldMap([]);
      return () => {
        active = false;
      };
    }

    getPtrsFieldMap(ptrsId, profileId)
      .then((rows) => {
        if (!active) return;
        setSavedFieldMap(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!active) return;
        setSavedFieldMap([]);
      });

    return () => {
      active = false;
    };
  }, [ptrsId, profileId]);

  useEffect(() => {
    if (!profileId) return;
    if (!Array.isArray(sourceOptions) || !sourceOptions.length) return;

    // Only initialise from saved field map once to avoid save/import loops
    if (didInitFromFieldMap.current) return;

    setAssign((prev) => {
      const preservedCustom = Object.fromEntries(
        Object.entries(prev || {}).filter(([key]) =>
          customFields.includes(key),
        ),
      );

      const next = { ...preservedCustom };

      for (const row of Array.isArray(savedFieldMap) ? savedFieldMap : []) {
        const targetField = String(row?.canonicalField || "").trim();
        if (!targetField) continue;

        const sourceRef =
          resolveSourceOption(
            sourceOptions,
            row?.sourceColumn,
            row?.sourceRole,
          ) || normaliseSourceRef(row?.sourceColumn, row?.sourceRole || "main");

        if (sourceRef) {
          next[targetField] = sourceRef;
        }
      }

      return next;
    });

    didInitFromFieldMap.current = true;
  }, [profileId, savedFieldMap, sourceOptions, customFields]);

  const usedSources = useMemo(
    () =>
      new Set(
        Object.values(assign || {})
          .map((src) => sourceRefKey(normaliseSourceRef(src)))
          .filter(Boolean),
      ),
    [assign],
  );

  const filteredSources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = sourceOptions || [];
    if (!needle) return all;
    return all.filter((src) => getSourceRefSearchText(src).includes(needle));
  }, [search, sourceOptions, getSourceRefSearchText]);

  // HTML5 DnD
  const onDragStart = (e, sourceRef) => {
    try {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify(normaliseSourceRef(sourceRef)),
      );
    } catch {}
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    assignSourceToTarget(parsed, targetField);
  };

  const allowDrop = (e) => e.preventDefault();

  // Assign helper: ensures a source is only mapped to a single target
  const assignSourceToTarget = (source, targetField) => {
    const src = normaliseSourceRef(source);

    setAssign((prev) => {
      const next = { ...prev };
      const srcKey = src ? sourceRefKey(src) : null;

      for (const k of Object.keys(next)) {
        const existing = normaliseSourceRef(next[k]);
        if (srcKey && sourceRefKey(existing) === srcKey) {
          next[k] = undefined;
        }
      }

      next[targetField] = src || undefined;
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
    const available = sourceOptions.filter(
      (src) => !usedSources.has(sourceRefKey(src)),
    );
    const byNorm = new Map();
    for (const src of available) {
      const key = norm(src?.header);
      if (!byNorm.has(key)) byNorm.set(key, src);
    }

    let applied = 0;
    setAssign((prev) => {
      const next = { ...prev };
      const alreadyUsed = new Set(
        Object.values(next)
          .map((src) => sourceRefKey(normaliseSourceRef(src)))
          .filter(Boolean),
      );

      const allTargets = [
        ...PTRS_REQUIRED_FIELDS,
        ...PTRS_OPTIONAL_FIELDS.filter(
          (f) => !PTRS_REQUIRED_FIELDS.includes(f),
        ),
      ];

      for (const target of allTargets) {
        if (next[target]) continue;
        const candidates = aliasesFor(target);

        let chosen = null;
        for (const a of candidates) {
          const src = byNorm.get(a);
          if (src && !alreadyUsed.has(sourceRefKey(src))) {
            chosen = src;
            break;
          }
        }

        if (!chosen) {
          for (const a of candidates) {
            const found = available.find(
              (src) =>
                !alreadyUsed.has(sourceRefKey(src)) &&
                norm(src?.header).includes(a),
            );
            if (found) {
              chosen = found;
              break;
            }
          }
        }

        if (chosen) {
          next[target] = chosen;
          alreadyUsed.add(sourceRefKey(chosen));
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

  const resolveSourceOption = (
    optionsArr,
    sourceName,
    preferredRole = null,
  ) => {
    if (!sourceName) return null;

    const srcTrim = String(sourceName).trim();
    const prefRole = preferredRole
      ? String(preferredRole).trim().toLowerCase()
      : null;

    const exact = (optionsArr || []).find((opt) => {
      const sameHeader = String(opt?.header || "").trim() === srcTrim;
      if (!sameHeader) return false;
      if (!prefRole) return true;
      return (
        String(opt?.role || "")
          .trim()
          .toLowerCase() === prefRole
      );
    });
    if (exact) return exact;

    const toNorm = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    const srcNorm = toNorm(srcTrim);

    const preferred = (optionsArr || []).find((opt) => {
      const sameHeader = toNorm(opt?.header) === srcNorm;
      if (!sameHeader) return false;
      if (!prefRole) return true;
      return (
        String(opt?.role || "")
          .trim()
          .toLowerCase() === prefRole
      );
    });
    if (preferred) return preferred;

    return (
      (optionsArr || []).find((opt) => toNorm(opt?.header) === srcNorm) || null
    );
  };

  // Convert BE map object -> assign (target->source), validating headers with loose resolving
  // const applyIncomingMap = (obj) => {
  //   if (!obj || typeof obj !== "object")
  //     return { applied: 0, nextAssign: assign };
  //   const next = { ...assign };
  //   let applied = 0;

  //   for (let [source, cfg] of Object.entries(obj)) {
  //     const target = cfg?.field;
  //     if (!target) {
  //       // eslint-disable-next-line no-console
  //       if (process.env.NODE_ENV === "development") {
  //         console.warn("❌ Skipped mapping: no target for", source, cfg);
  //       }
  //       continue;
  //     }

  //     const resolved =
  //       resolveSourceOption(sourceOptions, source, cfg?.sourceRole || null) ||
  //       normaliseSourceRef(source, cfg?.sourceRole || "main");

  //     if (!resolved) {
  //       if (process.env.NODE_ENV === "development") {
  //         console.warn("⚠️ Could not resolve header:", { source, target });
  //       }
  //       continue;
  //     }

  //     for (const k of Object.keys(next)) {
  //       const existing = normaliseSourceRef(next[k]);
  //       if (sourceRefKey(existing) === sourceRefKey(resolved)) {
  //         next[k] = undefined;
  //       }
  //     }

  //     if (!next[target]) {
  //       next[target] = resolved;
  //       applied += 1;
  //     }
  //   }

  //   // Register unknown targets as custom fields
  //   const known = new Set([...PTRS_REQUIRED_FIELDS, ...PTRS_OPTIONAL_FIELDS]);
  //   const discovered = new Set();
  //   for (const [, cfg] of Object.entries(obj)) {
  //     const t = cfg?.field;
  //     if (t && !known.has(t)) discovered.add(t);
  //   }
  //   if (discovered.size) {
  //     setCustomFields((prev) => [...new Set([...prev, ...discovered])]);
  //   }

  //   setAssign(next);
  //   return { applied, nextAssign: next };
  // };

  const applyIncomingFieldMap = (rows) => {
    if (!Array.isArray(rows) || !rows.length) {
      return { applied: 0, nextAssign: assign };
    }

    const next = { ...assign };
    let applied = 0;

    for (const row of rows) {
      const target = String(row?.canonicalField || "").trim();
      const sourceColumn = String(row?.sourceColumn || "").trim();
      const sourceRole = String(row?.sourceRole || "main")
        .trim()
        .toLowerCase();

      if (!target || !sourceColumn) continue;

      const resolved =
        resolveSourceOption(sourceOptions, sourceColumn, sourceRole) ||
        normaliseSourceRef(
          {
            header: sourceColumn,
            role: sourceRole,
          },
          sourceRole,
        );

      if (!resolved) {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ Could not resolve canonical field-map source:", {
            target,
            sourceColumn,
            sourceRole,
          });
        }
        continue;
      }

      for (const k of Object.keys(next)) {
        const existing = normaliseSourceRef(next[k]);
        if (sourceRefKey(existing) === sourceRefKey(resolved)) {
          next[k] = undefined;
        }
      }

      next[target] = resolved;
      applied += 1;
    }

    setAssign(next);
    return { applied, nextAssign: next };
  };

  // const handleImportJson = async (file) => {
  //   if (!file) return;
  //   try {
  //     const text = await file.text();
  //     const raw = JSON.parse(text);
  //     const mappings = extractMappingsFromAny(raw);
  //     // eslint-disable-next-line no-console
  //     console.log(
  //       "[handleImportJson] Extracted mappings keys:",
  //       Object.keys(mappings || {}),
  //     );
  //     if (!mappings || typeof mappings !== "object") {
  //       showAlert("No usable mappings found in file", "info");
  //     } else {
  //       const { applied, nextAssign } = applyIncomingMap(mappings);
  //       if (applied > 0) {
  //         await save(true, nextAssign);
  //         showAlert(
  //           `Imported mapping for ${applied} field(s) and auto-saved the map`,
  //           "success",
  //         );
  //       } else {
  //         showAlert("No compatible headers found in this file", "info");
  //       }
  //     }
  //   } catch {
  //     showAlert("Invalid JSON mapping file", "error");
  //   }
  // };

  const copyFromPtrsId = async (otherPtrsId) => {
    try {
      if (!profileId) {
        showAlert(
          "A profile is required to copy canonical mappings.",
          "warning",
        );
        return;
      }

      const sourceRows = await getPtrsFieldMap(otherPtrsId, profileId);
      const fieldMapPayload = Array.isArray(sourceRows)
        ? sourceRows
            .filter((row) => row && typeof row === "object")
            .map((row) => ({
              canonicalField: row.canonicalField,
              sourceRole: row.sourceRole,
              sourceColumn: row.sourceColumn,
              transformType: row.transformType ?? null,
              transformConfig: row.transformConfig ?? null,
              meta: row.meta ?? null,
            }))
            .filter((row) => row.canonicalField && row.sourceRole)
        : [];

      if (!fieldMapPayload.length) {
        showAlert(`No canonical mappings found on ptrs ${otherPtrsId}`, "info");
        return;
      }

      const savedRows = await savePtrsFieldMap(
        ptrsId,
        profileId,
        fieldMapPayload,
      );

      setSavedFieldMap(Array.isArray(savedRows) ? savedRows : []);
      didInitFromFieldMap.current = true;

      const { applied } = applyIncomingFieldMap(
        Array.isArray(savedRows) ? savedRows : fieldMapPayload,
      );

      setIsDirty(false);
      setImportOpen(false);

      showAlert(
        `Copied ${applied} canonical mapping(s) from ${otherPtrsId}`,
        "success",
      );
    } catch (e) {
      showAlert(e?.message || "Failed to load map from that ptrs", "error");
    }
  };

  const buildCanonicalFieldMapPayload = useCallback(
    (effectiveAssign) => {
      const payload = [];

      for (const [targetField, assignedSource] of Object.entries(
        effectiveAssign || {},
      )) {
        const sourceRef = normaliseSourceRef(assignedSource);
        if (!targetField || !sourceRef?.header) continue;
        if (customFields.includes(targetField)) continue;

        const canonicalField = String(targetField).trim();

        payload.push({
          canonicalField,
          sourceRole: sourceRef.role || "main",
          sourceColumn: sourceRef.header,
          transformType: null,
          transformConfig: null,
          meta: null,
        });
      }

      return payload;
    },
    [customFields],
  );

  const canonicalFieldMapNeedsSave = useCallback(
    (nextPayload) => {
      const normalise = (rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((row) => ({
            canonicalField: row?.canonicalField || null,
            sourceRole: row?.sourceRole || null,
            sourceColumn: row?.sourceColumn || null,
            transformType: row?.transformType || null,
            transformConfig: row?.transformConfig || null,
          }))
          .sort((a, b) => {
            const ak = `${a.canonicalField || ""}::${a.sourceRole || ""}::${a.sourceColumn || ""}`;
            const bk = `${b.canonicalField || ""}::${b.sourceRole || ""}::${b.sourceColumn || ""}`;
            return ak.localeCompare(bk);
          });

      return (
        JSON.stringify(normalise(nextPayload)) !==
        JSON.stringify(normalise(savedFieldMap))
      );
    },
    [savedFieldMap],
  );

  const currentCanonicalFieldMap = useMemo(
    () => (profileId ? buildCanonicalFieldMapPayload(assign) : []),
    [assign, profileId, buildCanonicalFieldMapPayload],
  );

  const hasPendingCanonicalFieldMapSave = useMemo(
    () =>
      profileId ? canonicalFieldMapNeedsSave(currentCanonicalFieldMap) : false,
    [profileId, currentCanonicalFieldMap, canonicalFieldMapNeedsSave],
  );

  async function save(autoOrEvent = false, assignOverride) {
    const auto = typeof autoOrEvent === "boolean" ? autoOrEvent : false;
    const effectiveAssign = assignOverride || assign;

    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return null;
    }

    const canonicalFieldMap = profileId
      ? buildCanonicalFieldMapPayload(effectiveAssign)
      : [];
    const needsCanonicalFieldMapSave = profileId
      ? canonicalFieldMapNeedsSave(canonicalFieldMap)
      : false;

    if (!isDirty && !assignOverride && !needsCanonicalFieldMapSave) {
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

      if (!profileId) {
        for (const [tgt, assignedSource] of Object.entries(
          effectiveAssign || {},
        )) {
          const src = normaliseSourceRef(assignedSource);
          if (!src?.header) continue;
          if (!tgt) continue;
          if (!allowedTargets.has(tgt)) continue;

          // Legacy mappings are keyed only by header name, so they are only safe
          // for non-profiled/main-only runs. Profile-backed runs persist authoritative
          // mappings via the canonical field-map payload instead.
          if ((src.role || "main") !== "main") continue;

          payload[src.header] = {
            field: tgt,
            type: "string",
            sourceRole: "main",
          };
        }
      }

      const count = Object.keys(payload).length;
      const canonicalCount = Array.isArray(canonicalFieldMap)
        ? canonicalFieldMap.length
        : 0;
      if (count === 0 && canonicalCount === 0) {
        if (!auto) {
          showAlert(
            "Map is empty — assign at least one field before saving.",
            "info",
          );
        }
        return null;
      }

      const res = await savePtrsMap(ptrsId, {
        mappings: profileId ? null : payload,
        extras: mapExtras,
        profileId,
        joins,
        customFields: joinCustomFields,
      });

      console.log(
        "[MapPanel.save] canonicalFieldMap payload",
        canonicalFieldMap.filter((r) =>
          ["payerEntityAbn", "payerEntityName"].includes(r.canonicalField),
        ),
      );

      console.log("[MapPanel.save] payer assign", {
        payerEntityName: assign.payerEntityName,
        payerEntityAbn: assign.payerEntityAbn,
      });

      if (profileId) {
        await savePtrsFieldMap(ptrsId, profileId, canonicalFieldMap);
        setSavedFieldMap(canonicalFieldMap);
      }

      // Keep latest extras (important so next save can truly be a no-op)
      let nextExtras = mapExtras || null;
      try {
        nextExtras = res?.extras || res?.map?.extras || nextExtras || null;
        setMapExtras(nextExtras);
      } catch {
        // ignore
      }

      const savedLegacyCount = Object.keys(res?.mappings || payload).length;
      const savedCount = Math.max(savedLegacyCount, canonicalCount);
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

    if (groupedRequirementFailures.length > 0) {
      const messages = groupedRequirementFailures.map(
        (g) => `${g.label} (map at least one)`,
      );
      abortStage(`Before staging, please map: ${messages.join(", ")}`);
      return;
    }

    if (!joinConnectivity.hasMain) {
      abortStage(
        "Before staging, a main dataset must exist and all datasets must be connected by joins.",
      );
      return;
    }

    if (!joinConnectivity.connected) {
      abortStage(
        `Before staging, all dataset roles must be connected by joins. Orphaned role(s): ${joinConnectivity.orphanedRoles.join(", ")}`,
      );
      return;
    }

    setStaging(true);

    try {
      if (isDirty || hasPendingCanonicalFieldMapSave) {
        await save(false);
      }

      // No heavy build work here.
      // Stage step will decide whether to rebuild or reuse server-side based on the saved map and inputs.

      // Build the mapped snapshot before handing over to Stage.
      // Stage consumes PtrsMappedRow, so Mapping must materialise it first.
      await buildPtrsMappedDataset(ptrsId);

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
    const options = sourceOptions;
    const getLabel = (src) => {
      const sourceRef = normaliseSourceRef(src);
      if (!sourceRef) return "";
      const base = getSourceRefLabel(sourceRef);
      return examples[sourceRef.header]
        ? `${base} — e.g. ${examples[sourceRef.header]}`
        : base;
    };

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
                label={getSourceRefLabel(assigned)}
                onDelete={() => clearTarget(field)}
                deleteIcon={<ClearIcon />}
                size="small"
              />
              {assigned?.header && examples[assigned.header] && (
                <Typography variant="caption" color="text.secondary">
                  e.g. {examples[assigned.header]}
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
            isOptionEqualToValue={(option, value) =>
              sourceRefKey(option) === sourceRefKey(value)
            }
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const sourceRef = normaliseSourceRef(option);
              return (
                <Box component="li" key={key} {...optionProps}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">
                      {sourceRef?.header || ""}
                    </Typography>
                    {!!sourceRef && (
                      <Typography variant="caption" color="text.secondary">
                        {getSourceRefLabel(sourceRef).replace(
                          `${sourceRef.header} — `,
                          "",
                        )}
                      </Typography>
                    )}
                    {sourceRef?.header && examples[sourceRef.header] && (
                      <Typography variant="caption" color="text.secondary">
                        e.g. {examples[sourceRef.header]}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            }}
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

  const joinConnectivity = useMemo(() => {
    const datasetRoles = Array.from(
      new Set(
        (dsQ.data?.items || [])
          .map((d) =>
            String(d?.role || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    );

    if (!datasetRoles.length) {
      return {
        hasMain: false,
        connected: false,
        connectedRoles: [],
        orphanedRoles: [],
      };
    }

    const graph = new Map();
    datasetRoles.forEach((role) => graph.set(role, new Set()));

    for (const join of Array.isArray(joins) ? joins : []) {
      const fromRole = String(join?.from?.role || "")
        .trim()
        .toLowerCase();
      const toRole = String(join?.to?.role || "")
        .trim()
        .toLowerCase();
      if (!fromRole || !toRole) continue;
      if (!graph.has(fromRole) || !graph.has(toRole)) continue;

      graph.get(fromRole)?.add(toRole);
      graph.get(toRole)?.add(fromRole);
    }

    const mainRoles = datasetRoles.filter(
      (role) => role === "main" || role.startsWith("main_"),
    );
    const rootRole = mainRoles[0] || null;

    if (!rootRole) {
      return {
        hasMain: false,
        connected: false,
        connectedRoles: [],
        orphanedRoles: datasetRoles,
      };
    }

    const visited = new Set();
    const queue = [rootRole];

    while (queue.length) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      for (const next of Array.from(graph.get(current) || [])) {
        if (!visited.has(next)) queue.push(next);
      }
    }

    const orphanedRoles = datasetRoles.filter((role) => !visited.has(role));

    return {
      hasMain: true,
      connected: orphanedRoles.length === 0,
      connectedRoles: Array.from(visited),
      orphanedRoles,
    };
  }, [dsQ.data, joins]);

  const missingRequiredFields = (PTRS_REQUIRED_FIELDS || []).filter(
    (field) => !assign?.[field],
  );

  const stageBlockedReason = (() => {
    if (sampleRefreshing) {
      return "Stage will be enabled once mapping metadata has finished refreshing.";
    }

    if (savingMap) {
      return "Please wait while the map is being saved.";
    }

    if (staging) {
      return "Please wait while staging is already in progress.";
    }

    if (loading) {
      return "Please wait while mapping data finishes loading.";
    }

    if (missingRequiredFields.length > 0) {
      const labels = missingRequiredFields.map((f) => labelFor(f));
      return `Map the remaining required field(s): ${labels.join(", ")}.`;
    }

    if (groupedRequirementFailures.length > 0) {
      return groupedRequirementFailures
        .map((g) => `${g.label} (map at least one)`)
        .join("; ");
    }

    if (!joinConnectivity.hasMain) {
      return "A main dataset must exist before staging can continue.";
    }

    if (!joinConnectivity.connected) {
      return `Connect all dataset roles with joins before staging. Orphaned role(s): ${joinConnectivity.orphanedRoles.join(", ")}.`;
    }

    return "";
  })();

  const stageButtonDisabled = Boolean(stageBlockedReason);

  // right pane sources item
  const SourceToken = ({ source }) => {
    const sourceRef = normaliseSourceRef(source);
    const used = usedSources.has(sourceRefKey(sourceRef));

    return (
      <Paper
        key={sourceRefKey(sourceRef)}
        draggable
        onDragStart={(e) => onDragStart(e, sourceRef)}
        variant="outlined"
        sx={{
          p: 1,
          mb: 1,
          opacity: used ? 0.4 : 1,
          cursor: "grab",
        }}
      >
        <Typography variant="body2">{sourceRef?.header}</Typography>
        {sourceRef?.header && examples[sourceRef.header] && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            e.g. {examples[sourceRef.header]}
          </Typography>
        )}
        {sourceRef?.role && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25 }}
          >
            {String(sourceRef.role)}
          </Typography>
        )}
      </Paper>
    );
  };

  const formatCopyMapDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getCopyMapPrimaryLabel = (option) => {
    const count = Number(option?.mappedFieldsCount || 0);
    const countLabel = `${count} mapped`;
    const fileName = String(option?.fileName || "").trim();
    return fileName ? `${countLabel} — ${fileName}` : countLabel;
  };

  const getCopyMapSecondaryLabel = (option) => {
    const updatedLabel = formatCopyMapDate(
      option?.fieldMapUpdatedAt || option?.updatedAt || option?.createdAt,
    );
    const ptrsLabel = option?.id || option?.ptrsId || "";

    if (updatedLabel && ptrsLabel) {
      return `Updated ${updatedLabel} • PTRS ${ptrsLabel}`;
    }
    if (updatedLabel) return `Updated ${updatedLabel}`;
    if (ptrsLabel) return `PTRS ${ptrsLabel}`;
    return "";
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
                  const raw = e.dataTransfer.getData("text/plain");
                  if (!raw) return;

                  let source = null;
                  try {
                    source = JSON.parse(raw);
                  } catch {
                    source = raw;
                  }

                  const sourceRef = normaliseSourceRef(source);
                  if (!sourceRef?.header) return;

                  const newName = makeUniqueCustomName(sourceRef.header);
                  if (!customFields.includes(newName)) {
                    setCustomFields((prev) => [...prev, newName]);
                  }
                  assignSourceToTarget(sourceRef, newName);
                  setIsDirty(true);
                  showAlert(
                    `Created "${newName}" and mapped from "${sourceRef.header}"`,
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
                                label={getSourceRefLabel(assign[f])}
                                onDelete={() => clearTarget(f)}
                                deleteIcon={<ClearIcon />}
                                size="small"
                              />
                              {assign[f]?.header &&
                                examples[assign[f].header] && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    e.g. {examples[assign[f].header]}
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
                            options={sourceOptions}
                            value={assign[f] || null}
                            onChange={(e, val) =>
                              assignSourceToTarget(val || undefined, f)
                            }
                            getOptionLabel={(src) => {
                              const sourceRef = normaliseSourceRef(src);
                              if (!sourceRef) return "";
                              const base = getSourceRefLabel(sourceRef);
                              return examples[sourceRef.header]
                                ? `${base} — e.g. ${examples[sourceRef.header]}`
                                : base;
                            }}
                            isOptionEqualToValue={(option, value) =>
                              sourceRefKey(option) === sourceRefKey(value)
                            }
                            renderOption={(props, option) => {
                              const { key, ...optionProps } = props;
                              const sourceRef = normaliseSourceRef(option);
                              return (
                                <Box component="li" key={key} {...optionProps}>
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2">
                                      {sourceRef?.header || ""}
                                    </Typography>
                                    {!!sourceRef && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {getSourceRefLabel(sourceRef).replace(
                                          `${sourceRef.header} — `,
                                          "",
                                        )}
                                      </Typography>
                                    )}
                                    {sourceRef?.header &&
                                      examples[sourceRef.header] && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          e.g. {examples[sourceRef.header]}
                                        </Typography>
                                      )}
                                  </Stack>
                                </Box>
                              );
                            }}
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
          {showSampleRefreshNotice && !savingMap && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mb: 1,
                p: 1.25,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <LoadingSpinner size={20} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Refreshing mapping metadata…
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sampleRefreshMessage}
                </Typography>
              </Box>
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
                disabled={
                  isBusy ||
                  mappedCount === 0 ||
                  (!isDirty && !hasPendingCanonicalFieldMapSave)
                }
              >
                Save map
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={stageData}
                disabled={stageButtonDisabled}
              >
                Next: Stage data
              </Button>
              {stageBlockedReason ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ alignSelf: "center", maxWidth: 420 }}
                >
                  {stageBlockedReason}
                </Typography>
              ) : null}
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
              filteredSources.map((source) => (
                <SourceToken key={sourceRefKey(source)} source={source} />
              ))
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
          {loadingCopyMaps ? (
            <Box sx={{ py: 3 }}>
              <LoadingSpinner message="Loading compatible maps..." />
            </Box>
          ) : null}

          {!loadingCopyMaps ? (
            <Autocomplete
              value={selectedCopyPtrs}
              onChange={(_, value) => setSelectedCopyPtrs(value)}
              options={ptrssWithMaps}
              getOptionLabel={(option) => getCopyMapPrimaryLabel(option)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box
                    component="li"
                    {...rest}
                    key={option?.id || option?.ptrsId || key}
                    sx={{ display: "block", py: 1 }}
                  >
                    <Typography variant="body1">
                      {getCopyMapPrimaryLabel(option)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getCopyMapSecondaryLabel(option)}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select a previous PTRS map"
                  placeholder="Choose a PTRS run"
                />
              )}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => copyFromPtrsId(selectedCopyPtrs?.id)}
            disabled={loadingCopyMaps || !selectedCopyPtrs}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
