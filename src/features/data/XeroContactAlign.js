import { useEffect, useMemo, useState, useCallback } from "react";
import Papa from "papaparse";
import { useForm } from "react-hook-form";
import { useAlert } from "../../context/";
import { dcService, xeroService } from "../../services";

const DEMO_TENANT_ID = "beed9345-9d79-415c-b17a-004f59a20579";
// List provided by Darryll — tenants to dump contacts for
const TENANT_IDS = [
  "76d05fa1-e145-485a-b2a1-ef88a95d0f98", // Work Management Solutions Pty Ltd
  "64601224-8069-4b73-ae9d-4653b22d3eb4", // OnPlan Technologies Pty Ltd
  "dd389533-7eaf-41d6-a697-8d43703b94d6", // Toustone Pty Ltd
  "5d13e4c9-13dd-4cb2-bed3-93a7808d66b7", // COSOL Limited
  "a57dad51-9af9-491b-93e0-f984fee7d00a", // Core Asset Co Pty Ltd
  "6eaed29d-8002-463f-bc2a-43a6c46482f9", // AssetOn Group Pty Ltd
  "29b33698-7944-4612-b546-5031ab266f03", // COSOL Australia Pty Ltd
  "dd1a7d55-fd65-466e-ac31-ecedeb95d06c", // Clarita Solutions Pty Ltd
];

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
  const [isDumping, setIsDumping] = useState(false);
  const [dumpEvents, setDumpEvents] = useState([]); // recent WS events for UI
  const [dumpTotals, setDumpTotals] = useState({ total: 0, perTenant: {} });

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

  // Subscribe to backend progress events for the dump process
  useEffect(() => {
    const unsubscribe = xeroService.subscribeToProgressUpdates((raw) => {
      let evt = raw;
      try {
        // Some broadcasters send JSON strings
        if (typeof raw === "string") evt = JSON.parse(raw);
      } catch (e) {
        // ignore parse errors; use raw as-is
      }
      if (!evt || typeof evt !== "object") return;
      // Only react to our dump pipeline
      if (
        !evt.stage ||
        (String(evt.stage).indexOf("dumpAllContacts") !== 0 &&
          evt.stage !== "dumpContacts")
      ) {
        return;
      }

      // Keep a rolling log (last 30)
      setDumpEvents((prev) => {
        const next = [...prev, evt];
        return next.length > 30 ? next.slice(-30) : next;
      });

      // Track totals per tenant when we receive page/inserted data
      if (evt.inserted && evt.tenantId) {
        setDumpTotals((prev) => {
          const perTenant = { ...prev.perTenant };
          const current = perTenant[evt.tenantId] || 0;
          perTenant[evt.tenantId] = Math.max(
            current,
            evt.insertedTotal || current + evt.inserted
          );
          const all = Object.values(perTenant).reduce((a, b) => a + b, 0);
          return { total: all, perTenant };
        });
      }

      // Lightweight toast on key milestones
      if (evt.stage === "dumpAllContacts:startTenant" && evt.tenantId) {
        showAlert(`Started tenant ${evt.tenantId}`, "info");
      }
      if (evt.stage === "dumpAllContacts:endTenant" && evt.tenantId) {
        showAlert(
          `Finished tenant ${evt.tenantId} · inserted ${evt.inserted || 0}`,
          "success"
        );
      }
      if (evt.stage === "dumpAllContacts:error") {
        showAlert(
          `Dump error for tenant ${evt.tenantId}: ${evt.error}`,
          "error"
        );
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [showAlert]);

  const current = rows[idx] || null;

  // Build proposed PATCH preview
  const patchPreview = useMemo(() => {
    if (!current || !selectedCandidate) return { Contacts: [] };
    const body = {
      Contacts: [
        {
          ContactID: "58697449-85ef-46ae-83fc-6a9446f037fb", // dummy ContactID for testing
          Name: current.CurrentName, // keep the CSV current name
          TaxNumber: "99999999999", // dummy ABN only
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

  const handleDumpAll = useCallback(async () => {
    setIsDumping(true);
    try {
      const res = await xeroService.dumpContacts({ tenantIds: TENANT_IDS });
      const total = Array.isArray(res?.data?.tenants)
        ? res.data.tenants.reduce((acc, t) => acc + (t?.inserted || 0), 0)
        : 0;
      showAlert(
        `Dump started for ${TENANT_IDS.length} tenants. Inserted so far: ${total}. Check progress notifications for updates.`,
        "success"
      );
    } catch (e) {
      showAlert(e.message || String(e), "error");
    } finally {
      setIsDumping(false);
    }
  }, [showAlert]);

  const applyOne = useCallback(async () => {
    // Attempt to apply the PATCH via backend for the demo tenant
    if (!current || !selectedCandidate) return;
    if (!canApply) {
      showAlert(
        "Confidence below threshold or missing ABN. Override threshold to proceed.",
        "info"
      );
      return;
    }
    try {
      const resp = await xeroService.applyXeroContactPatch({
        tenantId: DEMO_TENANT_ID,
        patchBody: patchPreview,
        dryRun,
      });
      // Expecting backend to return { success: true, ... } or similar
      showAlert(
        `Apply ${dryRun ? "(dry-run) " : ""}succeeded for ContactID ${current.ContactID}`,
        "success"
      );
    } catch (e) {
      showAlert(e.message || String(e), "error");
    }
  }, [showAlert, canApply, current, dryRun, selectedCandidate, patchPreview]);

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
        <button type="button" onClick={handleDumpAll} disabled={isDumping}>
          {isDumping
            ? "Dumping contacts…"
            : `Dump all Xero contacts (${TENANT_IDS.length})`}
        </button>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#334155" }}>
          Inserted total (so far): <strong>{dumpTotals.total}</strong>
        </span>
      </div>

      {dumpEvents.length > 0 && (
        <div
          style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}
        >
          <h3 style={{ marginTop: 0 }}>Dump progress</h3>
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
            }}
          >
            {dumpEvents.map((e, i) => (
              <div key={i} style={{ padding: "2px 0" }}>
                <code>
                  {new Date(e.timestamp || Date.now()).toLocaleTimeString()} ·{" "}
                  {e.stage}
                  {e.tenantId ? ` · tenant=${e.tenantId}` : ""}
                  {e.page != null ? ` · page=${e.page}` : ""}
                  {e.inserted != null ? ` · inserted=${e.inserted}` : ""}
                  {e.total != null ? ` · total=${e.total}` : ""}
                  {e.error ? ` · error=${e.error}` : ""}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

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
