import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

// --- DIAGNOSTIC ONLY: trace who calls getErrorsByPtrsId and prevent rapid duplicates
const __errorsInFlight = new Map();

const baseUrl = `${process.env.REACT_APP_API_URL}/tcp`;
const refsBase = `${process.env.REACT_APP_API_URL}/tcp/references`;

function buildRangeQs(params) {
  const q = [];
  if (params && params.start && params.end) {
    q.push(`start=${encodeURIComponent(params.start)}`);
    q.push(`end=${encodeURIComponent(params.end)}`);
  }
  if (params && Number.isFinite(params.page)) {
    q.push(`page=${params.page}`);
  }
  if (params && Number.isFinite(params.pageSize)) {
    q.push(`pageSize=${params.pageSize}`);
  }
  return q.length ? `?${q.join("&")}` : "";
}

export const tcpService = {
  getAll,
  getAllByPtrsId,
  patchRecord,
  patchRecords,
  patchErrorRecord,
  getTcpByPtrsId,
  sbiUpdate,
  partialUpdate,
  getById,
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkDeleteErrors,
  delete: _delete,
  getIncompleteSmallBusinessFlags,
  submitFinalPtrs,
  downloadSummaryPtrs,
  upload,
  getErrorsByPtrsId,
  recalculateMetrics,
  resolveErrors,
  // Reference Data (Gov Entities - global)
  listGovEntities,
  createGovEntity,
  updateGovEntity,
  patchGovEntity,
  deleteGovEntity,
  // Reference Data (Employees - customer scoped)
  listEmployees,
  createEmployee,
  updateEmployee,
  patchEmployee,
  deleteEmployee,
  // Reference Data (Intra-company - customer scoped)
  listIntraCompanies,
  createIntraCompany,
  updateIntraCompany,
  patchIntraCompany,
  deleteIntraCompany,
  // Reference Data (Customer Keywords - customer scoped)
  listCustomerKeywords,
  createCustomerKeyword,
  updateCustomerKeyword,
  patchCustomerKeyword,
  deleteCustomerKeyword,
  getExclusionRules,
};
async function resolveErrors(records) {
  return await fetchWrapper.post(`${baseUrl}/errors/resolve`, records);
}

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function getAllByPtrsId(ptrsId, params) {
  const qs = buildRangeQs(params);
  const response = await fetchWrapper.get(`${baseUrl}/ptrs/${ptrsId}${qs}`);
  // console.log("Fetched TCP records for ptrsId:", ptrsId, response);
  return response;
}

async function patchRecord(id, updates) {
  return fetchWrapper.patch(`${baseUrl}/${id}`, updates);
}

async function patchRecords(updates) {
  return fetchWrapper.patch(`${baseUrl}/bulk-patch`, updates);
}

async function patchErrorRecord(id, updates) {
  return fetchWrapper.patch(`${baseUrl}/error/${id}`, updates);
}

async function getTcpByPtrsId(ptrsId, params) {
  const qs = buildRangeQs(params);
  return await fetchWrapper.get(`${baseUrl}/ptrs/${ptrsId}${qs}`);
}

async function sbiUpdate(ptrsId, params) {
  return await fetchWrapper.put(`${baseUrl}/sbi/${ptrsId}`, params);
}

async function partialUpdate(params) {
  return await fetchWrapper.put(`${baseUrl}/partial`, params);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}

async function bulkCreate(params) {
  return await fetchWrapper.post(baseUrl, params);
}

async function bulkUpdate(params) {
  return await fetchWrapper.put(baseUrl, params);
}

async function bulkDelete(ptrsId, ids) {
  // Use a POST "bulk-delete" to avoid DELETE-with-body issues
  // Server should filter by ptrsId and remove only matching records
  const payload = { ids };
  if (ptrsId) payload.ptrsId = ptrsId;
  return await fetchWrapper.post(`${baseUrl}/bulk-delete`, payload);
}

async function bulkDeleteErrors(ptrsId, ids) {
  const payload = { ids };
  if (ptrsId) payload.ptrsId = ptrsId;
  return await fetchWrapper.post(`${baseUrl}/errors/bulk-delete`, payload);
}

async function _delete(id) {
  return await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getIncompleteSmallBusinessFlags() {
  return await fetchWrapper.get(`${baseUrl}/missing-isSb`);
}

async function submitFinalPtrs() {
  return await fetchWrapper.put(`${baseUrl}/submit-final`);
}

async function downloadSummaryPtrs() {
  return await fetchWrapper.get(`${baseUrl}/download-summary`, null, "blob");
}

async function upload(formData, isFormData = false) {
  return fetchWrapper
    .postUpload(`${baseUrl}/upload`, formData, true)
    .then((res) => {
      // console.log("TCP upload response:", res);
      return res;
    })
    .catch((err) => {
      console.error("TCP upload error:", err);
      throw err;
    });
}

async function getErrorsByPtrsId(ptrsId, params) {
  // Default to first page of 50 if caller didn't specify
  if (
    !params ||
    (!Number.isFinite(params.page) && !Number.isFinite(params.pageSize))
  ) {
    params = { page: 1, pageSize: 50 };
  }

  const qs = buildRangeQs(params);

  // In-flight guard to avoid overlapping duplicate requests from the same caller
  const key = `${ptrsId}|${qs}`;
  if (__errorsInFlight.has(key)) {
    return __errorsInFlight.get(key);
  }

  const p = (async () => {
    try {
      return await fetchWrapper.get(`${baseUrl}/errors/${ptrsId}${qs}`);
    } finally {
      __errorsInFlight.delete(key);
    }
  })();

  __errorsInFlight.set(key, p);
  return p;
}
//   for (const dir of modelDirs) {

async function recalculateMetrics(ptrsId) {
  return await fetchWrapper.put(`${baseUrl}/recalculate/${ptrsId}`);
}

// -----------------------------
// Reference Data: Gov Entities (GLOBAL)
// -----------------------------
async function listGovEntities() {
  return await fetchWrapper.get(`${refsBase}/gov-entities`);
}
async function createGovEntity(payload) {
  return await fetchWrapper.post(`${refsBase}/gov-entities`, payload);
}
async function updateGovEntity(id, payload) {
  return await fetchWrapper.put(`${refsBase}/gov-entities/${id}`, payload);
}
async function patchGovEntity(id, payload) {
  return await fetchWrapper.patch(`${refsBase}/gov-entities/${id}`, payload);
}
async function deleteGovEntity(id) {
  return await fetchWrapper.delete(`${refsBase}/gov-entities/${id}`);
}

// -----------------------------
// Reference Data: Employees (customer-scoped)
// -----------------------------
async function listEmployees() {
  return await fetchWrapper.get(`${refsBase}/employees`);
}
async function createEmployee(payload) {
  return await fetchWrapper.post(`${refsBase}/employees`, payload);
}
async function updateEmployee(id, payload) {
  return await fetchWrapper.put(`${refsBase}/employees/${id}`, payload);
}
async function patchEmployee(id, payload) {
  return await fetchWrapper.patch(`${refsBase}/employees/${id}`, payload);
}
async function deleteEmployee(id) {
  return await fetchWrapper.delete(`${refsBase}/employees/${id}`);
}

// -----------------------------
// Reference Data: Intra-company (customer-scoped)
// -----------------------------
async function listIntraCompanies() {
  return await fetchWrapper.get(`${refsBase}/intra-company`);
}
async function createIntraCompany(payload) {
  return await fetchWrapper.post(`${refsBase}/intra-company`, payload);
}
async function updateIntraCompany(id, payload) {
  return await fetchWrapper.put(`${refsBase}/intra-company/${id}`, payload);
}
async function patchIntraCompany(id, payload) {
  return await fetchWrapper.patch(`${refsBase}/intra-company/${id}`, payload);
}
async function deleteIntraCompany(id) {
  return await fetchWrapper.delete(`${refsBase}/intra-company/${id}`);
}

// -----------------------------
// Reference Data: Customer Keywords (customer-scoped)
// -----------------------------
async function listCustomerKeywords() {
  return await fetchWrapper.get(`${refsBase}/keywords`);
}
async function createCustomerKeyword(payload) {
  return await fetchWrapper.post(`${refsBase}/keywords`, payload);
}
async function updateCustomerKeyword(id, payload) {
  return await fetchWrapper.put(`${refsBase}/keywords/${id}`, payload);
}
async function patchCustomerKeyword(id, payload) {
  return await fetchWrapper.patch(`${refsBase}/keywords/${id}`, payload);
}
async function deleteCustomerKeyword(id) {
  return await fetchWrapper.delete(`${refsBase}/keywords/${id}`);
}

// -----------------------------
// Exclusions: BE-driven with hardcoded fallback
// -----------------------------
const defaultExclusions = {
  step1: [
    {
      field: "description",
      type: "contains",
      terms: ["wage", "salary", "commission"],
    },
    { field: "description", type: "contains", terms: ["royalty", "royalties"] },
    {
      field: "invoicePaymentTerms",
      type: "contains",
      terms: ["immediate", "cash", "on delivery", "COD", "cash on delivery"],
    },
  ],
  step2: [
    { field: "description", type: "contains", terms: ["intra-group"] },
    { field: "paymentAmount", type: "lessThanAndCreditCard", terms: [100] },
  ],
  step3: [],
  step4: [],
  step5: [],
};

/**
 * Fetch exclusion rules for a given step from the backend TCP reference tables,
 * falling back to hardcoded defaults if the BE returns empty or errors.
 * @param {number} step - 1..5
 * @returns {Promise<Array>} rules
 */
async function getExclusionRules(step) {
  const s = Number(step);
  const fallback = defaultExclusions[`step${s}`] || [];

  try {
    // Keyword terms (customer-scoped)
    const keywordsResp = await listCustomerKeywords().catch(() => ({
      data: [],
    }));
    const keywords = Array.isArray(keywordsResp?.data)
      ? keywordsResp.data
      : keywordsResp;
    const keywordTerms = Array.isArray(keywords)
      ? keywords
          .map((k) => k?.term || k?.keyword || k?.name || k?.value)
          .filter(Boolean)
      : [];

    // Intra-company references (customer-scoped) — useful for step 2
    const intraResp = await listIntraCompanies().catch(() => ({ data: [] }));
    const intra = Array.isArray(intraResp?.data) ? intraResp.data : intraResp;
    const intraTerms = Array.isArray(intra)
      ? intra
          .map((x) => x?.name || x?.legalName || x?.company || x?.code)
          .filter(Boolean)
      : [];
    // Explicit intra-company names and ABNs for matching
    const intraNames = Array.isArray(intra)
      ? intra
          .map((x) => x?.counterpartyName || x?.name || x?.legalName)
          .filter(Boolean)
      : [];
    const intraAbns = Array.isArray(intra)
      ? intra
          .map((x) =>
            x?.counterpartyAbn || x?.abn
              ? String(x.counterpartyAbn || x.abn).trim()
              : null
          )
          .filter(Boolean)
      : [];

    // Government entities (GLOBAL) — exclude payments to government bodies
    const govsResp = await listGovEntities().catch(() => ({ data: [] }));
    const govs = Array.isArray(govsResp?.data) ? govsResp.data : govsResp;
    const govNames = Array.isArray(govs)
      ? govs.map((g) => g?.name).filter(Boolean)
      : [];
    const govAbns = Array.isArray(govs)
      ? govs.map((g) => (g?.abn ? String(g.abn).trim() : null)).filter(Boolean)
      : [];

    // Build rules per step
    if (s === 1) {
      const rules = [];
      if (keywordTerms.length) {
        rules.push({
          field: "description",
          type: "contains",
          terms: keywordTerms,
        });
      }
      // Always include the payment-terms heuristic from defaults for step 1
      const termsRule = defaultExclusions.step1.find(
        (r) => r.field === "invoicePaymentTerms"
      );
      if (termsRule) rules.push(termsRule);
      // Exclude known government entities by name and ABN
      if (govNames.length) {
        rules.push({
          field: "payeeEntityName",
          type: "contains",
          terms: govNames,
        });
      }
      if (govAbns.length) {
        rules.push({
          field: "payeeEntityAbn",
          type: "equals",
          terms: govAbns,
        });
      }
      // If BE came back empty, fall back fully
      return rules.length ? rules : fallback;
    }

    if (s === 2) {
      const rules = [];
      // Intra-group style heuristics: include 'intra-group' and any intra-company names as text hits
      const intraGroupTerms = ["intra-group", ...intraTerms];
      if (intraGroupTerms.length) {
        rules.push({
          field: "description",
          type: "contains",
          terms: intraGroupTerms,
        });
      }
      // Explicit intra-company name and ABN matching (payee)
      if (intraNames.length) {
        rules.push({
          field: "payeeEntityName",
          type: "contains",
          terms: intraNames,
        });
      }
      if (intraAbns.length) {
        rules.push({
          field: "payeeEntityAbn",
          type: "equals",
          terms: intraAbns,
        });
      }
      // Keep the credit-card + threshold rule from defaults
      const ccRule = defaultExclusions.step2.find(
        (r) => r.type === "lessThanAndCreditCard"
      );
      if (ccRule) rules.push(ccRule);
      // Optionally blend keywords too if present
      if (keywordTerms.length) {
        rules.push({
          field: "description",
          type: "contains",
          terms: keywordTerms,
        });
      }
      // Step 2 also excludes government entities explicitly
      if (govNames.length) {
        rules.push({
          field: "payeeEntityName",
          type: "contains",
          terms: govNames,
        });
      }
      if (govAbns.length) {
        rules.push({
          field: "payeeEntityAbn",
          type: "equals",
          terms: govAbns,
        });
      }
      return rules.length ? rules : fallback;
    }

    // For other steps (3..5), rely on BE when we eventually add tables; for now return fallback.
    return fallback;
  } catch (err) {
    console.warn(
      "[tcpService.getExclusionRules] Falling back due to error:",
      err?.message || err
    );
    return fallback;
  }
}
