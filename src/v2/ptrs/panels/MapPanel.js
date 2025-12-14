import { useEffect, useMemo, useState, useCallback } from "react";
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
import { useSearchParams, useNavigate } from "react-router";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { useAlert } from "context";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// mapping-specific stuff
import {
  getPtrsMap,
  savePtrsMap,
  listPtrsWithMap,
  extractMappingsFromAny,
  getUnifiedSample,
  buildPtrsMappedDataset,
} from "v2/ptrs/services/tablesAndMaps.ptrsApi";

// Map stuff
import { getStagePreview } from "v2/ptrs/services/stage.ptrsApi";

// core run/blueprint stuff
import { getBlueprint } from "v2/ptrs/services/ptrsApi";

import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";
import {
  PTRS_REQUIRED_FIELDS,
  PTRS_OPTIONAL_FIELDS,
  FIELD_SYNONYMS,
} from "features/ptrs/ingestConfig";
import { getFieldLabel } from "features/ptrs/fieldMeta";
import SupportingDatasetsSection from "v2/ptrs/panels/SupportingDatasetsSection";

export default function MapPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const ptrsId = params.get("ptrsId");
  const { profileId } = usePtrsV2Context();

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [blueprint, setBlueprint] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [examples, setExamples] = useState({});
  const [headerMeta, setHeaderMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [staging, setStaging] = useState(false);

  const [ptrssWithMaps, setPtrssWithMaps] = useState([]);
  const [selectedCopyPtrs, setSelectedCopyPtrs] = useState(null);

  // target -> source (result of drag or select)
  const [assign, setAssign] = useState({});
  // user-defined placeholder targets
  const [customFields, setCustomFields] = useState([]);
  const [customFieldConfig, setCustomFieldConfig] = useState(null);
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

  // Count how many mappings from a saved map could apply to the current headers
  const countCompatibleMappings = useCallback((headersArr, mappingsObj) => {
    if (!headersArr || !headersArr.length) return 0;
    if (!mappingsObj || typeof mappingsObj !== "object") return 0;

    const validHeaders = Array.isArray(headersArr) ? headersArr : [];
    const seenSources = new Set();
    let applied = 0;

    for (const [source, cfg] of Object.entries(mappingsObj)) {
      const target = cfg?.field;
      if (!target) continue;

      const resolved = resolveHeader(validHeaders, source);
      if (!resolved) continue;

      // ensure a source header only counts once
      if (seenSources.has(resolved)) continue;
      seenSources.add(resolved);
      applied += 1;
    }

    return applied;
  }, []);

  // --- Load headers + any existing saved map
  useEffect(() => {
    let mounted = true;
    // Helper to safely get cell value from row with possible {data:{}} or flat
    function pickCell(row, h) {
      if (row && typeof row === "object") {
        if (row.data && typeof row.data === "object" && h in row.data)
          return row.data[h];
        if (h in row) return row[h];
      }
      return undefined;
    }
    async function load() {
      if (!ptrsId) return;
      setLoading(true);
      try {
        // 1) Load map first to know if any mappings exist
        const mapRes = await getPtrsMap(ptrsId);
        // eslint-disable-next-line no-console
        console.log("[MapPanel] getPtrsMap raw:", mapRes);
        // eslint-disable-next-line no-console
        console.log(
          "[MapPanel] getPtrsMap shapes:",
          mapRes
            ? {
                keys: Object.keys(mapRes),
                mappingsKeys: mapRes.mappings
                  ? Object.keys(mapRes.mappings)
                  : null,
                joinsKeys: mapRes.joins ? Object.keys(mapRes.joins) : null,
                customFields: mapRes.customFields || null,
                mapKeys: mapRes.map ? Object.keys(mapRes.map) : null,
              }
            : null
        );

        const existing =
          (mapRes && (mapRes.mappings || mapRes.map?.mappings)) || null;

        // Normalise joins/customFields across old and new shapes
        const normaliseJoins = (raw) => {
          if (!raw) return { joins: [], customFields: null };

          // joins can be an array (new) or an object with { conditions, customFields }
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
            customFields: Array.isArray(customFieldsArr)
              ? customFieldsArr
              : null,
          };
        };

        const { joins: existingJoins, customFields: existingCustomFields } =
          normaliseJoins(mapRes || {});

        const initialCustomFields = Array.isArray(existingCustomFields)
          ? existingCustomFields
              .map((cf) =>
                cf && typeof cf === "object" ? cf.key || cf.field || null : null
              )
              .filter((n) => n && typeof n === "string")
          : [];

        const hasAnyMappings =
          existing && typeof existing === "object"
            ? Object.keys(existing).length > 0
            : false;
        // eslint-disable-next-line no-console
        console.log("[MapPanel] derived map pieces:", {
          existing,
          existingJoins,
          existingCustomFields,
        });

        // 2) Preferred: unified sample (merged headers/rows from main + supporting)
        //    Fallback: previous logic (stage preview or simple sample)
        let unified = null;
        try {
          unified = await getUnifiedSample(ptrsId, { limit: 5, offset: 0 });
        } catch {
          unified = null;
        }

        let preview = null;
        if (!unified) {
          if (hasAnyMappings) {
            try {
              preview = await getStagePreview(ptrsId, {
                limit: 5,
                profileId,
              });
            } catch {
              // If stage preview fails, leave preview as null and rely on unified sample only
              preview = null;
            }
          } else {
            // No unified sample and no existing mappings; skip preview fallback
            preview = null;
          }
        }

        // 3) Load blueprint last
        const bp = await getBlueprint({ profileId });

        if (!mounted) return;
        setBlueprint(bp || null);

        // headers: use unified if present, otherwise preview
        const inferred =
          (unified?.headers?.length ? unified.headers : preview?.headers) || [];
        const rows =
          (unified?.rows?.length ? unified.rows : preview?.rows) || [];
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

        // existing mappings/joins/customField already computed above
        setJoins(Array.isArray(existingJoins) ? existingJoins : []);
        setCustomFieldConfig(
          Array.isArray(existingCustomFields) ? existingCustomFields : null
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
          if (!ex[h]) ex[h] = ""; // ensure key exists
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
        const known = new Set([
          ...PTRS_REQUIRED_FIELDS,
          ...PTRS_OPTIONAL_FIELDS,
        ]);
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

        // Finally: load PTRS runs that have maps and pre-filter by compatibility
        try {
          const lr = await listPtrsWithMap();
          const allPtrss = lr.items || [];

          const compatible = [];

          for (const run of allPtrss) {
            try {
              const res = await getPtrsMap(run.id);
              const mapObj = (res && (res.mappings || res.map?.mappings)) || {};
              const count = countCompatibleMappings(inferred, mapObj);
              if (count > 0) {
                compatible.push({ ...run, compatibleCount: count });
              }
            } catch {
              // if one run fails to load, just skip it
            }
          }

          setPtrssWithMaps(compatible);
        } catch {
          // ignore listing errors
          setPtrssWithMaps([]);
        }
      } catch (e) {
        showAlert(e?.message || "Failed to load mapping info", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [countCompatibleMappings, profileId, ptrsId, showAlert]);

  // quick helpers
  const usedSources = useMemo(
    () => new Set(Object.values(assign || {})),
    [assign]
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
      for (const k of Object.keys(next))
        if (next[k] === source) next[k] = undefined;
      next[targetField] = source || undefined;
      return next;
    });
  };

  const clearTarget = (targetField) =>
    setAssign((prev) => {
      const next = { ...prev };
      delete next[targetField];
      return next;
    });
  const clearAll = () => setAssign({});

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
    setNewCustomName("");
  };

  const removeCustomField = (name) => {
    setCustomFields((prev) => prev.filter((f) => f !== name));
    setAssign((prev) => {
      const n = { ...prev };
      if (n[name]) delete n[name];
      return n;
    });
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
          (f) => !PTRS_REQUIRED_FIELDS.includes(f)
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
              (h) => !alreadyUsed.has(h) && norm(h).includes(a)
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
        showAlert(`Auto-suggest mapped ${applied} field(s)`, "success");
      } else {
        showAlert(
          "No suggestions found — try mapping a few fields first",
          "info"
        );
      }
      return next;
    });
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
    console.groupEnd();

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
        Object.keys(mappings || {})
      );
      if (!mappings || typeof mappings !== "object") {
        showAlert("No usable mappings found in file", "info");
      } else {
        const { applied, nextAssign } = applyIncomingMap(mappings);
        if (applied > 0) {
          await save(true, nextAssign);
          showAlert(
            `Imported mapping for ${applied} field(s) and auto-saved the map`,
            "success"
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
          "success"
        );
        setImportOpen(false);
      } else {
        showAlert(
          `No compatible mappings found on ptrs ${otherPtrsId}`,
          "info"
        );
      }
    } catch (e) {
      showAlert(e?.message || "Failed to load map from that ptrs", "error");
    }
  };

  async function save(auto = false, assignOverride) {
    const effectiveAssign = assignOverride || assign;
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }
    try {
      // Convert target->source to BE shape and include custom placeholders
      const payload = {};
      const allowedTargets = new Set([
        ...PTRS_REQUIRED_FIELDS,
        ...PTRS_OPTIONAL_FIELDS,
        ...customFields,
      ]);
      // Soft sanity: ignore empty/unknown targets, allow partial maps
      for (const [tgt, src] of Object.entries(effectiveAssign)) {
        if (!src) continue;
        if (!allowedTargets.has(tgt)) continue; // skip stray keys
        payload[src] = { field: tgt, type: "string" };
      }
      const count = Object.keys(payload).length;
      if (count === 0) {
        if (!auto) {
          showAlert(
            "Map is empty — assign at least one field before saving.",
            "info"
          );
        }
        return;
      }

      const res = await savePtrsMap(ptrsId, {
        mappings: payload,
        joins,
        profileId,
        customFields: customFieldConfig || null,
      });

      const savedCount = Object.keys(res.mappings || payload).length;
      if (!auto) {
        showAlert(
          `Saved map (${savedCount} field${savedCount === 1 ? "" : "s"})`,
          "success"
        );
      }
    } catch (e) {
      showAlert(e?.message || "Failed to save map", "error");
    }
  }

  // UI bits
  const navigate = useNavigate();

  const stageData = () => {
    // Staging moved to StagePanel auto-run on first load; MapPanel no longer triggers staging.
    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/stage?${qs.toString()}`);
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
          {getFieldLabel(field, field)}
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
    (f) => !!assign[f]
  ).length;
  const optionalMappedCount = PTRS_OPTIONAL_FIELDS.filter(
    (f) => !PTRS_REQUIRED_FIELDS.includes(f) && !!assign[f]
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
                (f) => !PTRS_REQUIRED_FIELDS.includes(f)
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
                  showAlert(
                    `Created "${newName}" and mapped from "${source}"`,
                    "success"
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
                          {getFieldLabel(f, f)}
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

            {staging && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Building mapped dataset… this can take a while for large files.
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={save}
                disabled={loading || !ptrsId || staging}
              >
                Save map
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={stageData}
                disabled={
                  requiredMappedCount < PTRS_REQUIRED_FIELDS.length || staging
                }
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
                          option.createdAt
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
