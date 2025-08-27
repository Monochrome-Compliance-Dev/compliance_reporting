import { useEffect, useMemo, useState, useCallback } from "react";
import Papa from "papaparse";
import { useForm } from "react-hook-form";
import { useAlert } from "../../context/";
import { dcService } from "../../services/dc/dc";

// Small helper to safely read fields regardless of exact CSV header casing
const pick = (obj, ...keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// Normalise response from /data-cleanse/abn-lookup to a consistent shape
function normaliseLookupResult(item) {
  if (!item || typeof item !== "object") return null;
  return {
    officialName:
      item.Name ||
      item["Official Name"] ||
      item["officialName"] ||
      item["name"] ||
      "",
    abn: item["Suggested ABN"] || item["ABN"] || item["abn"] || "",
    confidence: item["Confidence Level"] || item["confidence"] || "",
    comment: item["Comments"] || item["comment"] || "",
    state: item.State || "",
    postcode: item.Postcode || "",
    status: item["ABN Status"] || "",
    score: item.Score ?? "",
    isTop: item["Is Top Score"] || false,
  };
}

// --- Phase A helpers: simple name normalisation + similarity ---
function normaliseName(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\.,'’\-_/]/g, " ")
    .replace(/\b(proprietary|pty|limited|ltd|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(str) {
  return new Set(normaliseName(str).split(" ").filter(Boolean));
}

function jaccard(aStr, bStr) {
  const a = tokenSet(aStr);
  const b = tokenSet(bStr);
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter += 1;
  });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function similarityLabel(score) {
  if (score >= 0.98) return "Exact";
  if (score >= 0.8) return "Close";
  return "Weak";
}

function JsonPreview({ value }) {
  const json = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <pre
      style={{
        background: "#0f172a0a",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 12,
        overflow: "auto",
        maxHeight: 260,
        fontSize: 12,
        lineHeight: 1.4,
        marginTop: 8,
      }}
    >
      {json}
    </pre>
  );
}

export default function XeroContactAlign() {
  const { showAlert } = useAlert();
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const { register, watch } = useForm({
    defaultValues: { threshold: "High", dryRun: true },
  });
  const threshold = watch("threshold");
  const dryRun = watch("dryRun");

  // Fetch + parse CSV once
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCsv(true);
    fetch("/static/cosol_missing_abns_without_dupes.csv", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);
        const text = await res.text();
        return new Promise((resolve) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => (h || "").trim(),
            complete: (result) => resolve(result.data),
          });
        });
      })
      .then((data) => {
        if (!isMounted) return;
        // Normalise a subset of fields we rely on in the UI.
        const normalised = data
          .map((r) => {
            const obj = { ...r };
            // Allow multiple likely header names from various extracts
            obj.customerId = obj.customerId || obj.CustomerId || obj.CUSTOMERID;
            obj.ContactID = obj.ContactID || obj.contactId || obj.CONTACTID;
            obj.CurrentName = obj.CurrentName || obj.Name || obj.NAME;
            obj.CurrentABN =
              obj.CurrentABN ||
              obj.TaxNumber ||
              obj.ABN ||
              obj["Current ABN"] ||
              "";
            obj.updatedAt = obj.updatedAt || obj.UpdatedAt || obj.updated || "";
            return pick(
              obj,
              "customerId",
              "ContactID",
              "CurrentName",
              "CurrentABN",
              "updatedAt"
            );
          })
          .filter((r) => r.ContactID && r.CurrentName);
        setRows(normalised);
        setLoaded(true);
        if (normalised.length === 0) {
          showAlert(
            "CSV parsed but contained no rows with ContactID and Name.",
            "info"
          );
        } else {
          showAlert(`Loaded ${normalised.length} rows from CSV`, "success");
        }
      })
      .catch((err) => {
        showAlert(err.message || String(err), "error");
      })
      .finally(() => setIsLoadingCsv(false));
    return () => {
      isMounted = false;
    };
  }, [showAlert]);

  const current = rows[idx] || null;

  // Build proposed PATCH preview
  const patchPreview = useMemo(() => {
    if (!current || !selectedCandidate) return { Contacts: [] };
    const body = {
      Contacts: [
        {
          ContactID: current.ContactID,
          Name: selectedCandidate.officialName || current.CurrentName,
          TaxNumber: selectedCandidate.abn || "",
        },
      ],
    };
    return body;
  }, [current, selectedCandidate]);

  const canApply = useMemo(() => {
    if (!current || !selectedCandidate) return false;
    const conf = (selectedCandidate.confidence || "").toLowerCase();
    const thresholdRank = { low: 1, medium: 2, high: 3 };
    const cRank = thresholdRank[conf] || 0;
    const tRank = thresholdRank[threshold.toLowerCase()] || 3;
    return cRank >= tRank && Boolean(selectedCandidate.abn);
  }, [current, selectedCandidate, threshold]);

  const handlePrev = useCallback(() => {
    setCandidates([]);
    setSelectedCandidate(null);
    setIdx((i) => (i > 0 ? i - 1 : 0));
  }, []);

  const handleNext = useCallback(() => {
    setCandidates([]);
    setSelectedCandidate(null);
    setIdx((i) => (i + 1 < rows.length ? i + 1 : i));
  }, [rows.length]);

  const handleSuggest = useCallback(async () => {
    if (!current) return;
    setIsSuggesting(true);
    try {
      const payload = [{ name: current.CurrentName }];
      const data = await dcService.getAbnCandidatesForNames(payload);
      const items = Array.isArray(data) ? data : [data];
      const norms = items.map(normaliseLookupResult).filter(Boolean);
      setCandidates(norms);
      setSelectedCandidate(null);
      if (norms.length === 0) {
        showAlert(`No candidates found for: ${current.CurrentName}`, "warning");
      }
    } catch (e) {
      showAlert(e.message || String(e), "error");
    } finally {
      setIsSuggesting(false);
    }
  }, [showAlert, current]);

  const copyPatch = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(patchPreview, null, 2)
      );
      showAlert("PATCH body copied to clipboard", "success");
    } catch (e) {
      showAlert("Could not copy to clipboard", "error");
    }
  }, [showAlert, patchPreview]);

  const applyOne = useCallback(async () => {
    // Stub for now — backend /admin/xero/contact-align/apply to be wired next
    if (!current || !selectedCandidate) return;
    if (!canApply) {
      showAlert(
        "Confidence below threshold or missing ABN. Override threshold to proceed.",
        "info"
      );
      return;
    }
    if (dryRun) {
      showAlert("Dry-run enabled. No changes sent.", "info");
      return;
    }
    showAlert(
      "Apply endpoint not wired yet. This will send the PATCH preview to the backend in the next step.",
      "info"
    );
  }, [showAlert, canApply, current, dryRun, selectedCandidate]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Xero Contact Align — Missing ABNs</h2>

      <div style={{ fontSize: 13, color: "#475569" }}>
        {isLoadingCsv && "Loading CSV…"}
        {loaded && rows.length > 0 && (
          <span>
            Loaded <strong>{rows.length}</strong> rows · Viewing{" "}
            <strong>{idx + 1}</strong> / {rows.length}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button type="button" onClick={handlePrev} disabled={idx === 0}>
          ◀ Prev
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={idx + 1 >= rows.length}
        >
          Next ▶
        </button>

        <label style={{ marginLeft: 12 }}>
          Threshold:&nbsp;
          <select {...register("threshold")}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="checkbox" {...register("dryRun")} /> Dry‑run
        </label>
      </div>

      {current && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          {/* Left — Current record */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Current (from CSV)</h3>
            <dl style={{ margin: 0 }}>
              <dt style={{ fontWeight: 600 }}>ContactID</dt>
              <dd style={{ margin: "0 0 8px 0" }}>{current.ContactID}</dd>

              <dt style={{ fontWeight: 600 }}>Name</dt>
              <dd style={{ margin: "0 0 8px 0" }}>{current.CurrentName}</dd>

              <dt style={{ fontWeight: 600 }}>ABN</dt>
              <dd style={{ margin: 0 }}>{current.CurrentABN || "—"}</dd>
            </dl>
          </div>

          {/* Middle — Suggestion */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Suggestions</h3>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
            >
              {isSuggesting ? "Looking…" : "Get suggestion"}
            </button>
            {candidates.length > 0 ? (
              <span
                style={{
                  marginLeft: 8,
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  fontSize: 12,
                  color: "#3730a3",
                  verticalAlign: "middle",
                }}
              >
                {candidates.length} match{candidates.length === 1 ? "" : "es"}
              </span>
            ) : (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>
                0 matches
              </span>
            )}
            {candidates.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th
                        style={{ textAlign: "left", padding: "4px 8px" }}
                      ></th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Official Name
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Suggested ABN
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Match
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Confidence
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        State
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Postcode
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Status
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Score
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        Comment
                      </th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>
                        ABR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((cand, i) => (
                      <tr
                        key={i}
                        style={{
                          backgroundColor:
                            selectedCandidate === cand
                              ? "#e0e7ff"
                              : "transparent",
                        }}
                      >
                        <td style={{ padding: "4px 8px" }}>
                          <input
                            type="radio"
                            name="candidate"
                            checked={selectedCandidate === cand}
                            onChange={() => setSelectedCandidate(cand)}
                          />
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.officialName || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.abn || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {(() => {
                            const score = jaccard(
                              current.CurrentName,
                              cand.officialName || ""
                            );
                            const label = similarityLabel(score);
                            return (
                              <span
                                title={`Similarity: ${(score * 100).toFixed(0)}%`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.confidence || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.state || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.postcode || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.status || "—"}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.score !== "" && cand.score !== null
                            ? cand.score
                            : "—"}
                        </td>
                        <td style={{ padding: "4px 8px", color: "#64748b" }}>
                          {cand.comment || ""}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          {cand.abn ? (
                            <a
                              href={`https://abr.business.gov.au/ABN/View?abn=${encodeURIComponent(cand.abn)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right — PATCH preview */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ marginTop: 0 }}>PATCH Preview (Xero Contacts)</h3>
            <JsonPreview value={patchPreview} />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={copyPatch}>
                Copy PATCH JSON
              </button>
              <button type="button" onClick={applyOne} disabled={!canApply}>
                Apply (one)
              </button>
            </div>
            {!canApply && selectedCandidate && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>
                Disabled: confidence below threshold or missing ABN.
              </div>
            )}
          </div>
        </div>
      )}

      {!current && loaded && <div>No rows found in CSV.</div>}
    </div>
  );
}
