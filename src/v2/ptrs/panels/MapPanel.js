import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  TextField,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import {
  getRunSample,
  getRunMap,
  saveRunMap,
  listRuns,
  extractMappingsFromAny,
} from "v2/ptrs/services/ptrsApi";
import {
  PTRS_REQUIRED_FIELDS,
  PTRS_OPTIONAL_FIELDS,
  FIELD_SYNONYMS,
} from "features/ptrs/ingestConfig";
import { getFieldLabel } from "features/ptrs/fieldMeta";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ClearIcon from "@mui/icons-material/Clear";

export default function MapPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const runId = params.get("runId");

  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [examples, setExamples] = useState({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const [copyRunInput, setCopyRunInput] = useState("");

  const [runsWithMaps, setRunsWithMaps] = useState([]);
  const [selectedCopyRun, setSelectedCopyRun] = useState(null);

  // target -> source (result of drag or select)
  const [assign, setAssign] = useState({});
  const [showOptional, setShowOptional] = useState(false);

  // Load headers + any existing saved map
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!runId) return;
      setLoading(true);
      try {
        const sample = await getRunSample(runId, { limit: 5, offset: 0 });
        const mapRes = await getRunMap(runId);
        const inferred = sample.headers;
        const rows = sample.rows;
        const existing = mapRes.mappings || null;

        if (!mounted) return;
        setHeaders(inferred);
        setSampleRows(rows);
        // build examples map: header -> first non-empty value
        const ex = {};
        for (const h of inferred) {
          for (const r of rows) {
            const v = r?.data?.[h];
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
        try {
          const lr = await listRuns({ hasMap: true });
          setRunsWithMaps(lr.items || []);
        } catch {
          // ignore listing errors; UI still works
        }
      } catch (e) {
        showAlert(e?.message || "Failed to load mapping info", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);
  const copyFromRunId = async (otherRunId) => {
    try {
      const res = await getRunMap(otherRunId);
      const obj = res.mappings || {};
      const applied = applyIncomingMap(obj);
      if (applied > 0) {
        showAlert(`Copied ${applied} mapping(s) from ${otherRunId}`, "success");
      } else {
        showAlert(`No compatible mappings found on run ${otherRunId}`, "info");
      }
    } catch (e) {
      showAlert(e?.message || "Failed to load map from that run", "error");
    }
  };

  const usedSources = useMemo(
    () => new Set(Object.values(assign || {})),
    [assign]
  );
  const unmappedHeaders = useMemo(
    () => (headers || []).filter((h) => !usedSources.has(h)),
    [headers, usedSources]
  );

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

  // --- Auto-suggest helpers ---
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const aliasesFor = (fieldId) => {
    const label = getFieldLabel(fieldId, fieldId);
    const custom = FIELD_SYNONYMS?.[fieldId] || [];
    // prefer fieldId and label, then any synonyms
    return [fieldId, label, ...custom].map(norm).filter(Boolean);
  };

  const autoSuggest = () => {
    // Build quick lookup of available sources by normalized header
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
      // toast after state update
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

  // Convert BE map object -> assign (target->source), validating headers
  const applyIncomingMap = (obj) => {
    console.log("obj: ", obj);
    if (!obj || typeof obj !== "object") return 0;
    const validHeaders = new Set(headers || []);
    const next = { ...assign };
    let applied = 0;
    for (const [source, cfg] of Object.entries(obj)) {
      if (!validHeaders.has(source)) continue; // ignore unknown headers
      const target = cfg?.field;
      if (!target) continue;
      // ensure source is unique
      for (const k of Object.keys(next))
        if (next[k] === source) next[k] = undefined;
      if (!next[target]) {
        next[target] = source;
        applied += 1;
      }
    }
    setAssign(next);
    return applied;
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const mappings = extractMappingsFromAny(raw);
      if (!mappings || typeof mappings !== "object") {
        showAlert("No usable mappings found in file", "info");
      } else {
        const applied = applyIncomingMap(mappings);
        if (applied > 0) {
          showAlert(`Imported mapping for ${applied} field(s)`, "success");
        } else {
          showAlert("No compatible headers found in this file", "info");
        }
      }
    } catch (err) {
      showAlert("Invalid JSON mapping file", "error");
    } finally {
      // reset input so selecting the same file again re-triggers
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyFromRun = async () => {
    const otherRun = (copyRunInput || "").trim();
    if (!otherRun) {
      showAlert("Enter a runId to copy from", "info");
      return;
    }
    try {
      const res = await getRunMap(otherRun);
      const obj = res.mappings || {};
      const applied = applyIncomingMap(obj);
      if (applied > 0) {
        showAlert(`Copied ${applied} mapping(s) from ${otherRun}`, "success");
      } else {
        showAlert(`No compatible mappings found on run ${otherRun}`, "info");
      }
    } catch (e) {
      showAlert(e?.message || "Failed to load map from that run", "error");
    }
  };

  const save = async () => {
    if (!runId) return showAlert("Missing runId", "error");
    try {
      // Convert target->source to BE shape: { "<source>": { field: "<target>", type: "string" } }
      const payload = {};
      for (const [tgt, src] of Object.entries(assign)) {
        if (!src) continue;
        payload[src] = { field: tgt, type: "string" };
      }
      const res = await saveRunMap(runId, payload);
      const count = Object.keys(res.mappings || payload).length;
      showAlert(`Saved map (${count} fields)`, "success");
    } catch (e) {
      showAlert(e?.message || "Failed to save map", "error");
    }
  };

  const Section = ({ title, children, actions, sticky = false }) => (
    <Box
      sx={{
        mb: 2,
        position: sticky ? "sticky" : "static",
        top: sticky ? theme.spacing(1) : "auto",
        zIndex: sticky ? 2 : "auto",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1, bgcolor: sticky ? "background.paper" : "transparent" }}
      >
        <Typography variant="subtitle2">{title}</Typography>
        {actions}
      </Stack>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {children}
      </Paper>
    </Box>
  );

  const TargetBin = ({ field }) => {
    const assigned = assign[field] || null;
    // Options include all headers so user can reselect current value too
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
              />
              {examples[assigned] && (
                <Typography variant="caption" color="text.secondary">
                  e.g. {examples[assigned]}
                </Typography>
              )}
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Map columns
      </Typography>

      {/* Unmapped sources (sticky) */}
      <Section
        title={`Unmapped source columns (${unmappedHeaders.length})`}
        sticky
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" onClick={autoSuggest}>
              Auto-suggest
            </Button>
            <Button
              size="small"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
            >
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportJson}
              style={{ display: "none" }}
            />
            <Autocomplete
              size="small"
              sx={{ width: 320 }}
              options={runsWithMaps}
              getOptionLabel={(opt) =>
                opt?.fileName
                  ? `${opt.fileName} — ${new Date(opt.createdAt).toLocaleDateString()}`
                  : opt?.id || ""
              }
              value={selectedCopyRun}
              onChange={(e, val) => setSelectedCopyRun(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Copy map from…"
                  placeholder="Pick a previous run"
                />
              )}
            />
            <Button
              size="small"
              onClick={() =>
                selectedCopyRun
                  ? copyFromRunId(selectedCopyRun.id)
                  : showAlert("Pick a run to copy from", "info")
              }
            >
              Copy
            </Button>
            <Button
              size="small"
              onClick={clearAll}
              disabled={!Object.keys(assign).length}
            >
              Clear all
            </Button>
          </Stack>
        }
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", maxHeight: 160, overflowY: "auto" }}
        >
          {unmappedHeaders.map((h) => (
            <Tooltip
              key={h}
              title={
                examples[h] ? `e.g. ${examples[h]}` : "No example in sample"
              }
              arrow
            >
              <Chip
                label={h}
                draggable
                onDragStart={(e) => onDragStart(e, h)}
                sx={{ mb: 1 }}
              />
            </Tooltip>
          ))}
          {!unmappedHeaders.length && (
            <Typography variant="body2" color="text.secondary">
              All headers are mapped.
            </Typography>
          )}
        </Stack>
      </Section>

      {/* Required targets */}
      <Section title="Required fields">
        <Stack spacing={1}>
          {PTRS_REQUIRED_FIELDS.map((f) => (
            <TargetBin key={f} field={f} />
          ))}
        </Stack>
      </Section>

      {/* Optional targets */}
      <Section
        title="Optional fields"
        actions={
          <Tooltip title={showOptional ? "Hide optional" : "Show optional"}>
            <IconButton onClick={() => setShowOptional((v) => !v)} size="small">
              {showOptional ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        }
      >
        <Collapse in={showOptional}>
          <Stack spacing={1}>
            {PTRS_OPTIONAL_FIELDS.filter(
              (f) => !PTRS_REQUIRED_FIELDS.includes(f)
            ).map((f) => (
              <TargetBin key={f} field={f} />
            ))}
          </Stack>
        </Collapse>
      </Section>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={save} disabled={loading || !runId}>
          Save map
        </Button>
      </Stack>
    </Box>
  );
}
