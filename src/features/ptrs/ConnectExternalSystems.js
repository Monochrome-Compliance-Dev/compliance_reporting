import { useState, useRef, useEffect } from "react";
import { tcpService, xeroService } from "../../services";
import {
  Button,
  Typography,
  Tooltip,
  Paper,
  Stack,
  Card,
  CardContent,
  TextField,
  MenuItem,
} from "@mui/material";
import { useAlert, usePtrsContext } from "../../context";
import { bigBerthaService, userService } from "../../services";
import Papa from "papaparse";
import {
  PTRS_REQUIRED_FIELDS,
  PTRS_OPTIONAL_FIELDS,
  FIELD_SYNONYMS,
} from "./ingestConfig";

import { getFieldLabel } from "./fieldMeta";

// Lightweight debug logger for this module
const DBG = (...args) => console.log("[PTRS][ConnectExternalSystems]", ...args);

// --- API base for local ingest ---
const LOCAL_INGEST = process.env.REACT_APP_LOCAL_INGEST === "1";

export default function ConnectExternalSystems({ onUploadComplete }) {
  const { ptrsDetails, activePtrsId } = usePtrsContext();
  const { showAlert } = useAlert();
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

  // ---- Guardrails: file constraints ----
  const MAX_FILE_BYTES = LOCAL_INGEST
    ? Number.POSITIVE_INFINITY
    : 10 * 1024 * 1024; // dev: no cap; prod: 10 MB
  const MAX_CELL_BUDGET = 210_000; // rows * cols limit for XLSX preview/mapping

  const workerRef = useRef(null);
  const lastProgressToastRef = useRef(0);

  function ensureWorker() {
    if (workerRef.current && workerRef.current._alive) return workerRef.current;
    const w = new Worker(
      new URL("../../lib/utils/xlsxWorker.js", import.meta.url),
      { type: "module" }
    );
    w._alive = true;
    w.onmessage = null; // set per-call
    w.onerror = null;
    workerRef.current = w;
    return w;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        try {
          workerRef.current.terminate();
        } catch {}
        workerRef.current = null;
      }
    };
  }, []);

  function detectType(file) {
    // Prefer MIME, fallback to extension
    const t = (file.type || "").toLowerCase();
    if (t.includes("csv")) return "csv";
    if (t.includes("sheet")) return "xlsx";
    const name = file.name || "";
    if (/\.(csv)$/i.test(name)) return "csv";
    if (/\.(xlsx?)$/i.test(name)) return "xlsx";
    return "unknown";
  }

  function isAllowedFile(file) {
    const kind = detectType(file);
    if (kind === "unknown")
      return {
        ok: false,
        reason: "Unsupported file type. Please upload a CSV or XLSX file.",
      };
    if (file.size > MAX_FILE_BYTES)
      return { ok: false, reason: "File too large. Max 10 MB." };
    return { ok: true, kind };
  }

  // console.log("ptrsDetails in ConnectExternalSystems:", ptrsDetails);
  const currentPtrs = Array.isArray(ptrsDetails)
    ? ptrsDetails.find((r) => r?.id === activePtrsId) || ptrsDetails[0]
    : null;
  const currentPtrsId = currentPtrs?.id || activePtrsId || null;
  const startDate = currentPtrs?.reportingPeriodStartDate || null;
  const endDate = currentPtrs?.reportingPeriodEndDate || null;

  const handleXeroConnect = async () => {
    setIsLoading(true);
    setProgressMessage("Connecting to Xero...");
    showAlert("Connecting to Xero...", "info");
    try {
      const resp = await xeroService.connect({
        ptrsId: currentPtrsId,
        createdBy: userService.userValue.id,
        startDate,
        endDate,
      });

      const authUrl = resp?.authUrl ?? resp?.data?.authUrl;

      if (!authUrl) {
        throw new Error("Authorisation URL not provided by server");
      }

      // Store callbackData before redirect
      const callbackData = {
        clientId: userService.userValue.clientId,
        ptrsId: currentPtrsId,
        createdBy: userService.userValue.id,
        startDate,
        endDate,
      };

      localStorage.setItem("callbackData", JSON.stringify(callbackData));

      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to Xero:", error);
      setProgressMessage("Error occurred while connecting to Xero.");
      showAlert("Error occurred while connecting to Xero.", "error");
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Early validation
    const gate = isAllowedFile(file);
    if (!gate.ok) {
      setProgressMessage(gate.reason);
      showAlert(gate.reason, "warning");
      if (event?.target) event.target.value = "";
      return;
    }

    setUploading(true);
    setProgressMessage("Profiling file…");
    showAlert("Profiling file…", "info");

    try {
      setDetectedType(gate.kind);
      await stageAndProfile(file, gate.kind);
      setProgressMessage("Ready to review.");
      showAlert("Ready to review.", "info");
      setMode("review");
    } catch (error) {
      console.error("Staging failed:", error);
      setProgressMessage(error?.message || "Could not read file.");
      showAlert(error?.message || "Could not read file.", "error");
    } finally {
      setUploading(false);
      if (event?.target) event.target.value = ""; // reset the file input
    }
  };

  async function stageAndProfile(file, kind) {
    setStagedFile(file);
    setDetectedType(kind);

    const { hdrs, sample } =
      kind === "xlsx"
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
    return getFieldLabel(key, key);
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

  // Compute the selected headers (targets) from the current columnMap, preserving order
  function computeSelectedHeaders(map) {
    const allowedTargets = new Set([
      ...PTRS_REQUIRED_FIELDS,
      ...PTRS_OPTIONAL_FIELDS,
    ]);
    // preserve order: required first (in PTRS_REQUIRED_FIELDS order), then optionals
    const picked = [];
    for (const f of PTRS_REQUIRED_FIELDS) {
      // find any raw column that maps to f
      const raw = Object.keys(map).find((rk) => map[rk] === f);
      if (raw && allowedTargets.has(f)) picked.push(f);
    }
    for (const f of PTRS_OPTIONAL_FIELDS) {
      const raw = Object.keys(map).find((rk) => map[rk] === f);
      if (raw && allowedTargets.has(f)) picked.push(f);
    }
    return Array.from(new Set(picked));
  }

  // Build BE-ready map: canonical (target) -> raw header
  function buildCanonicalMap(rawToTargetMap) {
    const out = {};
    if (!rawToTargetMap || typeof rawToTargetMap !== "object") return out;
    for (const [raw, target] of Object.entries(rawToTargetMap)) {
      if (target && typeof target === "string") {
        out[target] = raw;
      }
    }
    return out;
  }

  // Ensure only one raw column maps to each canonical target
  function dedupeTargetCollisions(rawToTargetMap) {
    const used = new Set();
    const cleaned = {};
    const dropped = [];
    for (const [raw, tgt] of Object.entries(rawToTargetMap || {})) {
      if (!tgt) continue;
      if (used.has(tgt)) {
        dropped.push({ raw, tgt });
        continue; // drop duplicate mapping for same target
      }
      used.add(tgt);
      cleaned[raw] = tgt;
    }
    return { map: cleaned, dropped };
  }

  // Read XLSX headers and sample rows, preserving blanks and true column range
  async function readXlsxHeadersAndSample(file) {
    const buffer = await file.arrayBuffer();
    const w = ensureWorker();
    const max = MAX_CELL_BUDGET;
    return new Promise((resolve, reject) => {
      let settled = false;
      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          w.terminate();
        } catch {}
        workerRef.current = null;
        reject(
          new Error(
            "Parsing timed out. Please try a smaller file or export CSV."
          )
        );
      }, 10_000);

      w.onmessage = (ev) => {
        if (settled) return;
        const { ok, hdrs, sample, error } = ev.data || {};
        if (!ok) {
          settled = true;
          clearTimeout(to);
          reject(new Error(error || "Worker failed while profiling XLSX."));
          return;
        }
        settled = true;
        clearTimeout(to);
        resolve({ hdrs, sample });
      };
      w.postMessage({ cmd: "profile", buffer, maxCellBudget: max }, [buffer]);
    });
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
              out[hdrs[i]] = Object.prototype.hasOwnProperty.call(
                row,
                originalKey
              )
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

  // Throttle helper for UI progress feedback
  function throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  }

  // Peek at the first line of a Blob (CSV header preview)
  async function peekBlobHeader(blob) {
    try {
      const text = await blob.slice(0, 4096).text();
      const firstLine = (text.split(/\r?\n/)[0] || "").replace(/\r$/, "");
      console.info("[PTRS] CSV header preview →", firstLine);
      return firstLine;
    } catch (e) {
      console.warn("[PTRS] Failed to peek CSV header", e);
      return "";
    }
  }

  async function remapFileToCsv(file, type, map) {
    // Collect target headers up-front (used by CSV branch and for worker mapping)
    const allowedTargets = new Set([
      ...PTRS_REQUIRED_FIELDS,
      ...PTRS_OPTIONAL_FIELDS,
    ]);
    const targetHeaders = Array.from(
      new Set(Object.values(map).filter((v) => v && allowedTargets.has(v)))
    );

    if (type === "xlsx") {
      const buffer = await file.arrayBuffer();
      const w = ensureWorker();
      const max = MAX_CELL_BUDGET;

      const csvText = await new Promise((resolve, reject) => {
        let settled = false;
        const to = setTimeout(() => {
          if (settled) return;
          settled = true;
          try {
            w.terminate();
          } catch {}
          workerRef.current = null;
          reject(
            new Error(
              "Mapping timed out. Please try a smaller file or export CSV."
            )
          );
        }, 15_000);

        w.onmessage = (ev) => {
          const { ok, csvText, error } = ev.data || {};
          if (!ok) {
            clearTimeout(to);
            reject(new Error(error || "Worker failed while mapping XLSX."));
            return;
          }
          clearTimeout(to);
          resolve(csvText);
        };
        w.postMessage(
          { cmd: "mapXlsx", buffer, map, targetHeaders, maxCellBudget: max },
          [buffer]
        );
      });

      return new Blob([csvText], { type: "text/csv;charset=utf-8" });
    } else {
      // csv — stream-map without retaining all rows in memory, with buffered writes and throttled progress
      // csv — stream-map without retaining all rows in memory, with buffered writes and throttled progress
      const allowedTargets = new Set([
        ...PTRS_REQUIRED_FIELDS,
        ...PTRS_OPTIONAL_FIELDS,
      ]);

      // Deterministic order: required (canonical order), then optional; no duplicates
      const mapValues = Object.values(map);
      const targetHeaders = [
        ...PTRS_REQUIRED_FIELDS.filter((f) => mapValues.includes(f)),
        ...PTRS_OPTIONAL_FIELDS.filter((f) => mapValues.includes(f)),
      ];

      // Precompute reverse map: target field -> first raw header name (ignore later collisions)
      const reverseMap = Object.create(null);
      for (const [raw, tgt] of Object.entries(map)) {
        if (!tgt || !allowedTargets.has(tgt)) continue;
        if (!Object.prototype.hasOwnProperty.call(reverseMap, tgt)) {
          reverseMap[tgt] = raw;
        }
      }

      console.info("[PTRS] targetHeaders →", targetHeaders);

      // Helper to CSV-escape a single field
      const esc = (v) => {
        const s = v == null ? "" : String(v);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };

      const chunks = [];
      const encoder = new TextEncoder();
      // Buffered writer to reduce small allocations
      let buf = "";
      let sinceFlush = 0;
      let totalRows = 0;
      const FLUSH_EVERY = 5000; // encode & push every 5k rows
      const flush = () => {
        if (buf.length > 0) {
          chunks.push(encoder.encode(buf));
          buf = "";
          sinceFlush = 0;
        }
      };
      // header once
      buf += targetHeaders.join(",") + "\n";

      const tick = throttle((n) => {
        const msg = `Mapping rows… ${n.toLocaleString()}`;
        setProgressMessage(msg);
        const now = Date.now();
        if (now - lastProgressToastRef.current >= 5000) {
          lastProgressToastRef.current = now;
          showAlert(msg, "info");
        }
      }, 500);

      await new Promise((resolve, reject) => {
        let hdrs = [];
        let rawHdrs = [];
        Papa.parse(file, {
          header: true,
          skipEmptyLines: "greedy",
          chunkSize: 1024 * 256, // 256KB chunks
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
            // Cache raw header indexes for fast lookup
            const rawIdxByName = Object.create(null);
            for (let i = 0; i < rawHdrs.length; i++)
              rawIdxByName[rawHdrs[i]] = i;

            for (const row of chunk.data) {
              const mapped = new Array(targetHeaders.length);
              for (let i = 0; i < targetHeaders.length; i++) {
                const tgt = targetHeaders[i];
                const rawFrom = reverseMap[tgt];
                if (!rawFrom) {
                  mapped[i] = "";
                  continue;
                }
                const idx = rawIdxByName[rawFrom];
                const key = idx >= 0 && idx != null ? rawHdrs[idx] : rawFrom;
                const val = Object.prototype.hasOwnProperty.call(row, key)
                  ? row[key]
                  : "";
                mapped[i] = esc(val);
              }
              buf += mapped.join(",") + "\n";
              sinceFlush++;
              totalRows++;
              if (sinceFlush >= FLUSH_EVERY) flush();
            }
            tick(totalRows);
          },
          complete: () => {
            flush();
            resolve();
          },
          error: (e) => {
            flush();
            reject(e);
          },
        });
      });

      return new Blob(chunks, { type: "text/csv;charset=utf-8" });
    }
  }

  // --- Local ingest helpers ---
  async function devCommitUpload(mappedBlob, baseName, meta = {}) {
    // 1) Stream to local file store via service
    const fd = new FormData();
    fd.append("file", mappedBlob, `mapped_${baseName}.csv`);
    const upJson = await bigBerthaService.uploadLocal(fd, currentPtrsId);

    // 2) Start ingest job via service
    const customerId =
      userService.userValue?.customerId ||
      userService.userValue?.clientId ||
      "unknown";

    const st = await bigBerthaService.startIngest(
      {
        filePath: upJson.filePath,
        customerId,
        ptrsId: currentPtrsId,
        originalName: upJson.originalName || `mapped_${baseName}.csv`,
        sizeBytes: upJson.sizeBytes || mappedBlob.size,
        format: "csv",
      },
      meta
    );
    const jobId = st?.jobId || st?.data?.jobId || st?.data?.id || st?.id;
    if (!jobId) throw new Error("Start ingest response missing jobId");
    return jobId;
  }

  // Simple polling of ingest status for UX feedback
  async function pollIngest(jobId, onUpdate) {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    for (;;) {
      try {
        const r = await bigBerthaService.getIngestJob(jobId);
        const j = r?.job || r?.data?.job || r?.data || r;
        if (j) {
          // Broadcast progress to other UI (e.g., DataUploadReview)
          try {
            window.dispatchEvent(
              new CustomEvent("ptrs:ingestProgress", { detail: { job: j } })
            );
          } catch (_) {}
          onUpdate?.(j);
          if (j.status === "complete" || j.status === "failed") {
            try {
              window.dispatchEvent(
                new CustomEvent("ptrs:ingestComplete", { detail: { job: j } })
              );
            } catch (_) {}
            return j; // return final job so caller can decide messaging
          }
        }
      } catch (err) {
        // surface transient fetch errors but keep polling a couple of times
        console.warn("[pollIngest] transient error", err);
      }
      await delay(1500);
    }
  }

  const handleCommitUpload = async () => {
    try {
      DBG("commit:start", {
        ptrsId: currentPtrsId,
        detectedType,
        headersCount: Array.isArray(headers) ? headers.length : 0,
      });
      setUploading(true);
      setProgressMessage("Preparing file…");
      showAlert("Preparing file…", "info");
      // Deduplicate any target collisions (e.g., two raw columns mapped to payeeEntityAbn)
      const { map: cleanMap, dropped } = dedupeTargetCollisions(columnMap);
      if (dropped.length) {
        console.info("[PTRS] Dropped duplicate mappings:", dropped);
        showAlert(
          `Removed ${dropped.length} duplicate mapping(s) to the same target field.`,
          "info"
        );
      }

      // NEW: concise debug snapshot of the post-dedupe map and selected targets
      try {
        const selectedTargets = computeSelectedHeaders
          ? computeSelectedHeaders(cleanMap)
          : Object.values(cleanMap || {});
        DBG("commit:cleanMap", {
          selectedTargets,
          mapSize: Object.keys(cleanMap || {}).length,
        });
      } catch (_) {
        // no-op: debug only
      }

      console.info("[PTRS] cleanMap →", cleanMap);

      // NEW: marker right before remap begins, with quick counts
      DBG("commit:remap_begin", {
        type: detectedType,
        targetCount: (() => {
          try {
            const selectedTargets = computeSelectedHeaders
              ? computeSelectedHeaders(cleanMap)
              : Object.values(cleanMap || {});
            return selectedTargets.length;
          } catch {
            return Object.values(cleanMap || {}).length;
          }
        })(),
      });

      const mappedBlob = await remapFileToCsv(
        stagedFile,
        detectedType,
        cleanMap
      );
      const baseName = stagedFile.name.replace(/\.[^.]+$/, "");

      if (LOCAL_INGEST) {
        console.info("[PTRS] Local ingest: CSV REMAPPED to canonical headers");
        await peekBlobHeader(mappedBlob); // should show canonical headers
        console.info("[PTRS] Sending canonical CSV only (no columnMap)");
        // New Big Bertha local flow (stream → start → poll)
        const jobId = await devCommitUpload(mappedBlob, baseName);
        setProgressMessage(`Ingest started (job ${jobId}).`);
        showAlert(`Ingest started (job ${jobId}).`, "info");
        const finalJob = await pollIngest(jobId, (job) => {
          const msg = `${(job?.rowsProcessed ?? 0).toLocaleString()} processed • ${(job?.rowsValid ?? 0).toLocaleString()} valid • ${(job?.rowsErrored ?? 0).toLocaleString()} errors • ${job?.status}`;
          setProgressMessage(msg);
          const now = Date.now();
          if (now - lastProgressToastRef.current >= 5000) {
            lastProgressToastRef.current = now;
            showAlert(msg, "info");
          }
        });

        if (finalJob?.status === "failed") {
          const errText = finalJob?.lastError || JSON.stringify(finalJob);
          console.error("[PTRS] Ingest failed", finalJob);
          setProgressMessage(errText);
          showAlert(errText, "error");
          // Do not reset UI state; let user adjust mapping or try again
          return; // exit early on failure
        }

        // success
        setProgressMessage("Ingest complete.");
        showAlert("Ingest complete.", "success");
      } else {
        // Existing small-file path (API upload via tcpService)
        const formData = new FormData();
        formData.append("file", mappedBlob, `mapped_${baseName}.csv`);
        formData.append("ptrsId", currentPtrsId);
        await tcpService.upload(formData, true);
        setProgressMessage("Upload successful.");
        showAlert("Upload successful.", "success");
      }

      if (onUploadComplete) onUploadComplete();
      setMode("idle");
      setStagedFile(null);
      setHeaders([]);
      setSampleRows([]);
      setColumnMap({});
    } catch (error) {
      console.error("Upload failed:", error);
      setProgressMessage(error?.message || "Upload failed.");
      showAlert(error?.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
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
                  showAlert(
                    ok ? "Mapping saved." : "Could not save mapping.",
                    ok ? "success" : "error"
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
                    showAlert("Mapping loaded.", "success");
                  } else {
                    setProgressMessage("No saved mapping found.");
                    showAlert("No saved mapping found.", "warning");
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
            accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
        {/* status line */}
        {progressMessage ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block", textAlign: "center" }}
          >
            {progressMessage}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
