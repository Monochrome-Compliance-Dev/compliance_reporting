/* eslint-disable no-restricted-globals */
// Module Web Worker for XLSX profiling and mapping.
// Bundlers: created with `new Worker(new URL("../../lib/utils/xlsxWorker.js", import.meta.url), { type: "module" })`
import * as XLSX from "xlsx";

/**
 * Derive headers and a small sample of rows for preview.
 * Applies a simple cell-budget guard (rows * cols <= maxCellBudget).
 */
function profileXlsx(arrayBuffer, maxCellBudget = 210_000) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheet = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheet];
  if (!ws || !ws["!ref"]) {
    throw new Error("No data range found in the first sheet.");
  }

  const range = XLSX.utils.decode_range(ws["!ref"]);
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  if (totalRows * totalCols > maxCellBudget) {
    throw new Error(
      "Sheet is too large for in‑browser preview. Please export CSV or split the file."
    );
  }

  // Build headers from the first row
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

  // Sample up to 25 rows
  const sample = [];
  const firstDataRow = range.s.r + 1;
  const lastDataRow = Math.min(range.e.r, firstDataRow + 24);
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const rowObj = Object.create(null);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      rowObj[hdrs[c - range.s.c]] = cell && cell.v != null ? cell.v : undefined;
    }
    sample.push(rowObj);
  }

  return { hdrs, sample };
}

/**
 * Map an XLSX workbook to CSV text using the provided column map and target headers.
 * - Performs optional "Co code" lookup enrichment when requested via mapping tokens.
 * - Enforces a cell-budget guard.
 */
function mapXlsxToCsvText(
  arrayBuffer,
  map,
  targetHeaders,
  maxCellBudget = 210_000
) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  // Find lookup sheet similar to "Co code" (case-insensitive, ignore punctuation/spacing)
  const coSheetName = (wb.SheetNames || []).find(
    (n) => typeof n === "string" && /^co\W*code$/i.test(n.trim())
  );

  // Primary sheet is the first sheet
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"]) {
    throw new Error("No data range found in the first sheet.");
  }

  const range = XLSX.utils.decode_range(ws["!ref"]);
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  if (totalRows * totalCols > maxCellBudget) {
    throw new Error(
      "Sheet is too large to map in the browser. Please export CSV or split the file."
    );
  }

  // Headers from the first row
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

  // Determine if lookup is requested
  const usesLookup = Object.values(map).some(
    (v) => typeof v === "string" && v.startsWith("lookup:payerByCompanyCode:")
  );

  // Build dictionary from "Co code" if present
  let payerByCode = {};
  if (usesLookup && coSheetName && wb.Sheets[coSheetName]) {
    const ref = wb.Sheets[coSheetName];
    if (ref["!ref"]) {
      const r = XLSX.utils.decode_range(ref["!ref"]);
      for (let row = r.s.r + 1; row <= r.e.r; row++) {
        const code = (ref[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v ?? "")
          .toString()
          .trim();
        const name = (ref[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v ?? "")
          .toString()
          .trim();
        const abnRaw = (
          ref[XLSX.utils.encode_cell({ r: row, c: 3 })]?.v ?? ""
        ).toString();
        const acn = (ref[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v ?? "")
          .toString()
          .trim();
        const abn = abnRaw.replace(/\D/g, "");
        if (code) payerByCode[code] = { name, abn, acn };
      }
    }
  }

  // Identify "Company Code" header in primary sheet
  const companyCodeHeader = hdrs.find(
    (h) =>
      typeof h === "string" &&
      h
        .replace(/[_\s]+/g, " ")
        .trim()
        .toLowerCase()
        .includes("company code")
  );

  // Build CSV rows
  const rows = [];
  const firstDataRow = range.s.r + 1;
  for (let r = firstDataRow; r <= range.e.r; r++) {
    const raw = Object.create(null);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      raw[hdrs[c - range.s.c]] = cell && cell.v != null ? cell.v : undefined;
    }

    const out = {};
    // Direct mapping from raw headers → MC fields
    for (const [rawH, target] of Object.entries(map)) {
      if (targetHeaders.includes(target)) out[target] = raw[rawH];
    }

    // Lookup enrichment
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
            const abnDigits = (payer.abn || "").replace(/\D/g, "");
            out.payerEntityAbn = /^\d{11}$/.test(abnDigits)
              ? abnDigits
              : out.payerEntityAbn;
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

    rows.push(out);
  }

  // Create CSV text (escape minimal RFC4180)
  const escapeCell = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  let csv = "";
  csv += targetHeaders.map(escapeCell).join(",") + "\n";
  for (const row of rows) {
    const line = targetHeaders.map((h) => escapeCell(row[h]));
    csv += line.join(",") + "\n";
  }
  return csv;
}

self.onmessage = async (e) => {
  const { cmd } = e.data || {};
  try {
    if (cmd === "profile") {
      const { buffer, maxCellBudget } = e.data;
      const res = profileXlsx(buffer, maxCellBudget);
      self.postMessage({ ok: true, cmd, ...res });
      return;
    }
    if (cmd === "mapXlsx") {
      const { buffer, map, targetHeaders, maxCellBudget } = e.data;
      const csvText = mapXlsxToCsvText(
        buffer,
        map,
        targetHeaders,
        maxCellBudget
      );
      self.postMessage({ ok: true, cmd, csvText });
      return;
    }
    self.postMessage({ ok: false, error: "Unknown command" });
  } catch (err) {
    self.postMessage({ ok: false, cmd, error: err?.message || String(err) });
  }
};
