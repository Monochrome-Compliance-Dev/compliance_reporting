import { useState, useRef } from "react";
import { tcpService, xeroService } from "../../services";
import {
  Button,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  Paper,
  Stack,
  Card,
  CardContent,
  TextField,
  MenuItem,
} from "@mui/material";
import { usePtrsContext } from "../../context";
import { userService } from "../../services";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  PTRS_REQUIRED_FIELDS,
  PTRS_OPTIONAL_FIELDS,
  PTRS_FIELD_LABELS,
  FIELD_SYNONYMS,
} from "./ingestConfig";

export default function ConnectExternalSystems({ onUploadComplete }) {
  const { ptrsDetails } = usePtrsContext();
  const [alert] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const [mode, setMode] = useState("idle"); // idle | review
  const [stagedFile, setStagedFile] = useState(null);
  const [detectedType, setDetectedType] = useState(null); // 'csv' | 'xlsx'
  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [columnMap, setColumnMap] = useState({}); // rawHeader -> MC field

  // console.log("ptrsDetails in ConnectExternalSystems:", ptrsDetails);

  const handleXeroConnect = async () => {
    setIsLoading(true);
    setProgressMessage("Connecting to Xero...");
    try {
      const resp = await xeroService.connect({
        ptrsId: ptrsDetails[0]?.id,
        createdBy: userService.userValue.id,
        startDate: ptrsDetails[0]?.reportingPeriodStartDate,
        endDate: ptrsDetails[0]?.reportingPeriodEndDate,
      });

      const authUrl = resp?.authUrl ?? resp?.data?.authUrl;

      if (!authUrl) {
        throw new Error("Authorisation URL not provided by server");
      }

      // Store callbackData before redirect
      const callbackData = {
        clientId: userService.userValue.clientId,
        ptrsId: ptrsDetails[0]?.id,
        createdBy: userService.userValue.id,
        startDate: ptrsDetails[0]?.reportingPeriodStartDate,
        endDate: ptrsDetails[0]?.reportingPeriodEndDate,
      };

      localStorage.setItem("callbackData", JSON.stringify(callbackData));

      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to Xero:", error);
      setProgressMessage("Error occurred while connecting to Xero.");
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgressMessage("Profiling file…");

    try {
      await stageAndProfile(file);
      setProgressMessage("Ready to review.");
      setMode("review");
    } catch (error) {
      console.error("Staging failed:", error);
      setProgressMessage("Could not read file.");
    } finally {
      setUploading(false);
      if (event?.target) event.target.value = ""; // reset the file input
    }
  };

  async function stageAndProfile(file) {
    setStagedFile(file);
    const isXlsx = /\.xlsx?$/i.test(file.name);
    setDetectedType(isXlsx ? "xlsx" : "csv");

    const { hdrs, sample } = isXlsx
      ? await readXlsxHeadersAndSample(file)
      : await readCsvHeadersAndSample(file);

    const uniqueHdrs = Array.from(new Set(hdrs || []));
    const initMap = Object.fromEntries(uniqueHdrs.map((h) => [h, ""]));
    setHeaders(uniqueHdrs);
    setSampleRows(sample);
    const clientId = userService.userValue?.clientId || "unknown";
    const saved = loadMappingFromStorage(clientId, file.name, uniqueHdrs);
    let finalMap = { ...initMap };
    if (saved && Object.keys(saved).length) {
      finalMap = { ...finalMap, ...saved };
    } else {
      const suggested = autoSuggestMapping(uniqueHdrs);
      finalMap = { ...finalMap, ...suggested };
    }
    setColumnMap(finalMap);
  }

  // Convert 0-based column index to Excel column label (A, B, ..., Z, AA, AB, ...)
  function excelColLabel(idx0) {
    let n = idx0 + 1; // 1-based
    let s = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function fieldLabel(key) {
    return (PTRS_FIELD_LABELS && PTRS_FIELD_LABELS[key]) || key;
  }

  // Persist per client + file base name (trim extension) + short header signature
  function mappingStorageKey(clientId, fileName, hdrs) {
    const base = (fileName || "").replace(/\.[^.]+$/, "");
    const sig = (hdrs || []).slice(0, 10).join("|");
    return `ptrsMapping:${clientId}:${base}:${sig}`;
  }

  function saveMappingToStorage(clientId, fileName, hdrs, map) {
    try {
      const key = mappingStorageKey(clientId, fileName, hdrs);
      const payload = { version: 1, savedAt: Date.now(), headers: hdrs, map };
      localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function loadMappingFromStorage(clientId, fileName, hdrs) {
    try {
      const key = mappingStorageKey(clientId, fileName, hdrs);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!payload || !payload.map) return null;
      // Only retain entries for columns that exist in this file
      const allowed = new Set(hdrs);
      return Object.fromEntries(
        Object.entries(payload.map).filter(([h]) => allowed.has(h))
      );
    } catch {
      return null;
    }
  }

  // Light auto‑suggest based on canonical keys, friendly labels, and synonyms
  function autoSuggestMapping(hdrs) {
    const out = {};
    const lower = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();
    const allTargets = [...PTRS_REQUIRED_FIELDS, ...PTRS_OPTIONAL_FIELDS];

    const byKey = Object.fromEntries(allTargets.map((k) => [lower(k), k]));
    const byLabel = Object.fromEntries(
      allTargets.map((k) => [lower(fieldLabel(k)), k])
    );

    const synIndex = {};
    if (FIELD_SYNONYMS && typeof FIELD_SYNONYMS === "object") {
      for (const [k, arr] of Object.entries(FIELD_SYNONYMS)) {
        (arr || []).forEach((s) => (synIndex[lower(s)] = k));
      }
    }

    for (const h of hdrs) {
      const lh = lower(h);
      if (byKey[lh]) {
        out[h] = byKey[lh];
        continue;
      }
      if (byLabel[lh]) {
        out[h] = byLabel[lh];
        continue;
      }
      // contains‑match against synonyms
      let hit = null;
      for (const [syn, key] of Object.entries(synIndex)) {
        if (lh.includes(syn)) {
          hit = key;
          break;
        }
      }
      if (hit) out[h] = hit;
    }
    return out;
  }

  // Read XLSX headers and sample rows, preserving blanks and true column range
  async function readXlsxHeadersAndSample(file) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const firstSheet = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // Build raw headers by traversing the first row across the full range
    const rawHdrs = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
      const cell = ws[addr];
      const v = cell && cell.v != null ? String(cell.v).trim() : "";
      rawHdrs.push(v);
    }
    const hdrs = rawHdrs.map((h, i) =>
      h && h.length > 0 ? h : `__BLANK_COL_${i}`
    );

    // Sample up to 25 data rows, preserving alignment with columns
    const sample = [];
    const firstDataRow = range.s.r + 1;
    const lastDataRow = Math.min(range.e.r, firstDataRow + 24);
    for (let r = firstDataRow; r <= lastDataRow; r++) {
      const rowObj = {};
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        const v = cell && cell.v != null ? cell.v : undefined;
        rowObj[hdrs[c - range.s.c]] = v;
      }
      sample.push(rowObj);
    }

    return { hdrs, sample };
  }

  function readCsvHeadersAndSample(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 25,
        skipEmptyLines: "greedy",
        chunkSize: 1024 * 128,
        chunk: (res, parser) => {
          const rawHdrs = res.meta && res.meta.fields ? res.meta.fields : [];
          const hdrs = rawHdrs.map((h, i) =>
            h && String(h).trim().length > 0
              ? String(h).trim()
              : `__BLANK_COL_${i}`
          );
          const sample = (res.data || []).map((row) => {
            const out = {};
            for (let i = 0; i < hdrs.length; i++) {
              const originalKey = rawHdrs[i] || ""; // Papa uses empty string for blank headers
              out[hdrs[i]] = row.hasOwnProperty(originalKey)
                ? row[originalKey]
                : undefined;
            }
            return out;
          });
          parser.abort(); // We only needed the first chunk for headers + sample
          resolve({ hdrs, sample });
        },
        error: reject,
      });
    });
  }

  function allRequiredMapped(map) {
    const mappedTargets = new Set(Object.values(map).filter(Boolean));
    return PTRS_REQUIRED_FIELDS.every((req) => mappedTargets.has(req));
  }

  async function remapFileToCsv(file, type, map) {
    // Build the set of target headers from the mapping (required + optional only)
    const allowedTargets = new Set([
      ...PTRS_REQUIRED_FIELDS,
      ...PTRS_OPTIONAL_FIELDS,
    ]);
    const targetHeaders = Array.from(
      new Set(Object.values(map).filter((v) => v && allowedTargets.has(v)))
    );

    let rows = [];

    if (type === "xlsx") {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });

      // Primary sheet (first sheet, e.g., "PTRS Data")
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
      const rawHdrs = (json[0] || []).map((v) =>
        v == null ? "" : String(v).trim()
      );
      const hdrs = rawHdrs.map((h, i) =>
        h && h.length > 0 ? h : `__BLANK_COL_${i}`
      );

      // Detect if any lookup token is used in the mapping
      const usesLookup = Object.values(map).some(
        (v) =>
          typeof v === "string" && v.startsWith("lookup:payerByCompanyCode:")
      );

      // Build dictionary from "Co code" if present
      let payerByCode = {};
      if (usesLookup && wb.Sheets["Co code"]) {
        const ref = wb.Sheets["Co code"]; // Expect: Col A=Company Code, C=Name, D=ABN, E=ACN/ARBN
        const r = XLSX.utils.decode_range(ref["!ref"]);
        for (let row = r.s.r + 1; row <= r.e.r; row++) {
          const code = (ref[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v || "")
            .toString()
            .trim();
          const name = (ref[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v || "")
            .toString()
            .trim();
          const abnRaw = (
            ref[XLSX.utils.encode_cell({ r: row, c: 3 })]?.v || ""
          ).toString();
          const acn = (ref[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v || "")
            .toString()
            .trim();
          const abn = abnRaw.replace(/\D/g, "");
          if (code) {
            payerByCode[code] = { name, abn, acn };
          }
        }
      }

      // Attempt to identify the "Company Code" column in the primary sheet headers
      const companyCodeHeader = hdrs.find(
        (h) =>
          typeof h === "string" &&
          h
            .replace(/[_\s]+/g, " ")
            .toLowerCase()
            .includes("company code")
      );

      const dataRows = Array.isArray(json) ? json.slice(1) : [];
      rows = dataRows.map((arr) => {
        // Build a raw row object keyed by hdrs; tolerate empty/malformed rows
        const raw = {};
        for (let i = 0; i < hdrs.length; i++) {
          const key = hdrs[i];
          raw[key] = Array.isArray(arr) ? arr[i] : undefined;
        }

        const out = {};
        // First apply direct mapping from raw headers → MC fields
        for (const [rawH, target] of Object.entries(map)) {
          if (target && allowedTargets.has(target)) out[target] = raw[rawH];
        }

        // Then enrich via lookup if requested and data available
        if (
          usesLookup &&
          companyCodeHeader &&
          payerByCode &&
          Object.keys(payerByCode).length > 0
        ) {
          const codeVal = raw[companyCodeHeader];
          const code = codeVal != null ? String(codeVal).trim() : "";
          const payer = code ? payerByCode[code] : null;
          if (payer) {
            for (const [_rawH, target] of Object.entries(map)) {
              if (
                target === "lookup:payerByCompanyCode:name" &&
                !out.payerEntityName
              ) {
                out.payerEntityName = payer.name || out.payerEntityName;
              }
              if (
                target === "lookup:payerByCompanyCode:abn" &&
                !out.payerEntityAbn
              ) {
                out.payerEntityAbn = payer.abn || out.payerEntityAbn;
              }
              if (
                target === "lookup:payerByCompanyCode:acnArbn" &&
                !out.payerEntityAcnArbn
              ) {
                out.payerEntityAcnArbn = payer.acn || out.payerEntityAcnArbn;
              }
            }
          }
        }

        return out;
      });
    } else {
      // csv
      rows = await new Promise((resolve, reject) => {
        const out = [];
        let hdrs = [];
        let rawHdrs = [];
        Papa.parse(file, {
          header: true,
          skipEmptyLines: "greedy",
          chunk: (chunk, parser) => {
            if (hdrs.length === 0) {
              rawHdrs =
                chunk.meta && chunk.meta.fields ? chunk.meta.fields : [];
              hdrs = rawHdrs.map((h, i) =>
                h && String(h).trim().length > 0
                  ? String(h).trim()
                  : `__BLANK_COL_${i}`
              );
            }
            for (const row of chunk.data) {
              const rawObj = {};
              for (let i = 0; i < hdrs.length; i++) {
                const originalKey = rawHdrs[i] || "";
                rawObj[hdrs[i]] = row.hasOwnProperty(originalKey)
                  ? row[originalKey]
                  : undefined;
              }
              const mapped = {};
              for (const [rawH, target] of Object.entries(map)) {
                if (target && allowedTargets.has(target))
                  mapped[target] = rawObj[rawH];
              }
              out.push(mapped);
            }
          },
          complete: () => resolve(out),
          error: reject,
        });
      });
    }

    // Use Papa to unparse to CSV text
    const csvText = Papa.unparse({
      fields: targetHeaders,
      data: rows.map((r) => targetHeaders.map((h) => r[h] ?? "")),
    });
    return new Blob([csvText], { type: "text/csv;charset=utf-8" });
  }

  const handleCommitUpload = async () => {
    try {
      setUploading(true);
      setProgressMessage("Preparing file…");
      const mappedBlob = await remapFileToCsv(
        stagedFile,
        detectedType,
        columnMap
      );
      const formData = new FormData();
      const baseName = stagedFile.name.replace(/\.[^.]+$/, "");
      formData.append("file", mappedBlob, `mapped_${baseName}.csv`);
      formData.append("ptrsId", ptrsDetails[0]?.id);
      await tcpService.upload(formData, true);
      setProgressMessage("Upload successful.");
      if (onUploadComplete) onUploadComplete();
      setMode("idle");
      setStagedFile(null);
      setHeaders([]);
      setSampleRows([]);
      setColumnMap({});
    } catch (error) {
      console.error("Upload failed:", error);
      setProgressMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a provider or upload a CSV extract to get started.
        </Typography>

        {mode === "review" && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Map columns to PTRS fields
            </Typography>
            <Stack spacing={1}>
              {headers.map((h, idx) => {
                const isBlankSynth =
                  typeof h === "string" && h.startsWith("__BLANK_COL_");
                const exampleVal = (sampleRows.find(
                  (r) => r[h] != null && r[h] !== ""
                ) || {})[h];
                return (
                  <Stack
                    key={`${h || "(blank)"}-${idx}`}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Typography sx={{ minWidth: 260, wordBreak: "break-all" }}>
                      {isBlankSynth ? (
                        <em>(blank header, col {excelColLabel(idx)})</em>
                      ) : (
                        h
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ minWidth: 200, wordBreak: "break-all" }}
                    >
                      {exampleVal
                        ? `Example: ${exampleVal}`
                        : "No data found in file"}
                    </Typography>
                    <TextField
                      select
                      size="small"
                      label="Map to"
                      value={columnMap[h] || ""}
                      onChange={(e) =>
                        setColumnMap((prev) => ({
                          ...prev,
                          [h]: e.target.value,
                        }))
                      }
                      sx={{ minWidth: 320 }}
                    >
                      <MenuItem value="">(ignore)</MenuItem>
                      <MenuItem disabled>— Required —</MenuItem>
                      {PTRS_REQUIRED_FIELDS.map((f) => (
                        <MenuItem key={`req-${f}`} value={f}>
                          {fieldLabel(f)}
                        </MenuItem>
                      ))}
                      <MenuItem disabled>— Optional —</MenuItem>
                      {PTRS_OPTIONAL_FIELDS.map((f) => (
                        <MenuItem key={`opt-${f}`} value={f}>
                          {fieldLabel(f)}
                        </MenuItem>
                      ))}
                      <MenuItem disabled>— Lookups —</MenuItem>
                      <MenuItem value="lookup:payerByCompanyCode:name">
                        Lookup • Payer by Company Code → Name
                      </MenuItem>
                      <MenuItem value="lookup:payerByCompanyCode:abn">
                        Lookup • Payer by Company Code → ABN
                      </MenuItem>
                      <MenuItem value="lookup:payerByCompanyCode:acnArbn">
                        Lookup • Payer by Company Code → ACN/ARBN
                      </MenuItem>
                    </TextField>
                  </Stack>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={!allRequiredMapped(columnMap) || uploading}
                onClick={handleCommitUpload}
              >
                {uploading ? "Uploading…" : "Continue"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const ok = saveMappingToStorage(
                    userService.userValue?.clientId || "unknown",
                    stagedFile?.name || "",
                    headers,
                    columnMap
                  );
                  setProgressMessage(
                    ok ? "Mapping saved." : "Could not save mapping."
                  );
                }}
              >
                Save mapping
              </Button>

              <Button
                variant="text"
                onClick={() => {
                  const loaded = loadMappingFromStorage(
                    userService.userValue?.clientId || "unknown",
                    stagedFile?.name || "",
                    headers
                  );
                  if (loaded) {
                    setColumnMap((prev) => ({ ...prev, ...loaded }));
                    setProgressMessage("Mapping loaded.");
                  } else {
                    setProgressMessage("No saved mapping found.");
                  }
                }}
              >
                Load saved
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setMode("idle");
                  setStagedFile(null);
                  setHeaders([]);
                  setSampleRows([]);
                  setColumnMap({});
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        )}

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleXeroConnect}
            disabled={isLoading}
            size="large"
            sx={{ minWidth: 180 }}
          >
            {isLoading ? "Processing..." : "Xero"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUploadClick}
            disabled={uploading}
            size="large"
            sx={{ minWidth: 180 }}
          >
            {uploading ? "Uploading..." : "Upload data extract"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Tooltip title="Coming soon">
            <span>
              <Button
                variant="contained"
                color="secondary"
                disabled
                size="large"
                sx={{ minWidth: 180 }}
              >
                MYOB
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Coming soon">
            <span>
              <Button
                variant="contained"
                color="secondary"
                disabled
                size="large"
                sx={{ minWidth: 180 }}
              >
                JDE
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Snackbar
          open={!!progressMessage}
          message={progressMessage}
          autoHideDuration={3000}
          onClose={() => setProgressMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </CardContent>
    </Card>
  );
}
