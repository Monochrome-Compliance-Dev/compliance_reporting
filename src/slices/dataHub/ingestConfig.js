// Data Hub recommended field configuration.
// These are NOT canonical fields. They are recommended fields used to guide
// upload quality, mapping and publication readiness for reusable datasets.

export const DH_DATASET_TYPES = {
  payment: {
    id: "payment",
    label: "Payment",
    description: "Payments made to suppliers or vendors.",
  },
  invoice: {
    id: "invoice",
    label: "Invoice",
    description: "Invoices received from suppliers or vendors.",
  },
  vendor: {
    id: "vendor",
    label: "Vendor",
    description: "Supplier or vendor master data.",
  },
  payment_term: {
    id: "payment_term",
    label: "Payment term changes",
    description: "Payment term records or change history.",
  },
};

export const DH_RECOMMENDED_FIELDS = {
  payment: [
    "paymentDate",
    "paymentAmount",
    "payeeName",
    "payeeAbn",
    "payerName",
    "payerAbn",
    "invoiceReference",
    "paymentTerms",
    "documentType",
    "currency",
    "purchasingDocument",
  ],
  invoice: [
    "invoiceReference",
    "invoiceIssueDate",
    "invoiceReceiptDate",
    "invoiceDueDate",
    "invoiceAmount",
    "payeeName",
    "payeeAbn",
    "payerName",
    "payerAbn",
    "paymentTerms",
    "currency",
    "purchasingDocument",
  ],
  vendor: [
    "vendorCode",
    "vendorName",
    "vendorAbn",
    "paymentTerms",
    "country",
    "currency",
    "status",
  ],
  payment_term: [
    "vendorCode",
    "vendorName",
    "vendorAbn",
    "paymentTerms",
    "effectiveDate",
    "changedAt",
    "changedBy",
  ],
};

export const DH_ANALYSIS_READINESS = {
  payment: {
    ptrs: {
      id: "ptrs",
      label: "PTRS analysis",
      description:
        "Checks whether this payment dataset has enough mapped fields to support PTRS analysis.",
      required: [
        "paymentDate",
        "paymentAmount",
        "payeeName",
        "payeeAbn",
        "invoiceReference",
      ],
      useful: [
        "payerName",
        "payerAbn",
        "paymentTerms",
        "documentType",
        "currency",
        "purchasingDocument",
      ],
    },
    workingCapital: {
      id: "workingCapital",
      label: "Working capital analysis",
      description:
        "Placeholder readiness check for future working capital analysis.",
      required: ["paymentDate", "paymentAmount", "payeeName"],
      useful: ["paymentTerms", "currency", "invoiceReference"],
    },
  },
  invoice: {
    ptrs: {
      id: "ptrs",
      label: "PTRS analysis",
      description:
        "Checks whether this invoice dataset can support PTRS invoice enrichment.",
      required: [
        "invoiceReference",
        "invoiceIssueDate",
        "invoiceAmount",
        "payeeName",
        "payeeAbn",
      ],
      useful: [
        "invoiceReceiptDate",
        "invoiceDueDate",
        "payerName",
        "payerAbn",
        "paymentTerms",
        "currency",
        "purchasingDocument",
      ],
    },
    workingCapital: {
      id: "workingCapital",
      label: "Working capital analysis",
      description:
        "Placeholder readiness check for future working capital analysis.",
      required: ["invoiceIssueDate", "invoiceDueDate", "invoiceAmount"],
      useful: ["paymentTerms", "currency", "payeeName", "payerName"],
    },
  },
  vendor: {
    ptrs: {
      id: "ptrs",
      label: "PTRS analysis",
      description:
        "Checks whether this vendor dataset can support supplier enrichment for PTRS.",
      required: ["vendorName", "vendorAbn"],
      useful: ["vendorCode", "paymentTerms", "country", "status"],
    },
  },
  payment_term: {
    ptrs: {
      id: "ptrs",
      label: "PTRS analysis",
      description:
        "Checks whether this payment term dataset can support payment term enrichment for PTRS.",
      required: ["vendorAbn", "paymentTerms"],
      useful: ["vendorCode", "vendorName", "effectiveDate", "changedAt"],
    },
  },
};

export const DH_FIELD_LABELS = {
  paymentDate: "Payment date",
  paymentAmount: "Payment amount",
  payeeName: "Payee name",
  payeeAbn: "Payee ABN",
  payerName: "Payer name",
  payerAbn: "Payer ABN",
  invoiceReference: "Invoice reference",
  paymentTerms: "Payment terms",
  documentType: "Document type",
  currency: "Currency",
  purchasingDocument: "Purchasing document",

  invoiceIssueDate: "Invoice issue date",
  invoiceReceiptDate: "Invoice receipt date",
  invoiceDueDate: "Invoice due date",
  invoiceAmount: "Invoice amount",

  vendorCode: "Vendor code",
  vendorName: "Vendor name",
  vendorAbn: "Vendor ABN",
  country: "Country",
  status: "Status",

  effectiveDate: "Effective date",
  changedAt: "Changed at",
  changedBy: "Changed by",
};

export const DH_FIELD_SYNONYMS = {
  paymentDate: ["payment date", "clearing date", "paid date", "paid on"],
  paymentAmount: ["payment amount", "amount", "amount paid", "paid amount"],
  payeeName: ["payee name", "supplier name", "vendor name", "account name"],
  payeeAbn: ["payee abn", "supplier abn", "vendor abn", "tax number", "abn"],
  payerName: ["payer name", "company name", "entity name"],
  payerAbn: ["payer abn", "company abn", "entity abn"],
  invoiceReference: [
    "invoice reference",
    "invoice number",
    "reference",
    "document number",
  ],
  paymentTerms: ["payment terms", "terms", "payment term", "net terms"],
  documentType: ["document type", "doc type"],
  currency: ["currency", "document currency", "doc currency"],
  purchasingDocument: ["purchasing document", "purchase order", "po number"],

  invoiceIssueDate: ["invoice date", "issue date", "document date"],
  invoiceReceiptDate: [
    "invoice received date",
    "receipt date",
    "received date",
  ],
  invoiceDueDate: ["due date", "net due date", "invoice due date"],
  invoiceAmount: ["invoice amount", "gross amount", "document amount"],

  vendorCode: ["vendor code", "supplier code", "account no", "account number"],
  vendorName: ["vendor name", "supplier name", "account name"],
  vendorAbn: ["vendor abn", "supplier abn", "tax number", "abn"],
  country: ["country", "country code"],
  status: ["status", "active", "blocked"],

  effectiveDate: ["effective date", "valid from", "start date"],
  changedAt: ["changed at", "changed date", "updated at"],
  changedBy: ["changed by", "updated by", "user"],
};

export function getDatasetTypeConfig(datasetType) {
  return DH_DATASET_TYPES[datasetType] || null;
}

export function getRecommendedFields(datasetType) {
  return DH_RECOMMENDED_FIELDS[datasetType] || [];
}

export function getAnalysisReadinessRules(datasetType) {
  return DH_ANALYSIS_READINESS[datasetType] || {};
}

export function getFieldLabel(fieldId) {
  return DH_FIELD_LABELS[fieldId] || fieldId;
}

function hasMappedValue(value) {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    return String(value.header || value.sourceHeader || "").trim().length > 0;
  }
  return false;
}

function buildFieldStatus(fields = [], fieldMapping = {}) {
  const mapped = fields.filter((fieldId) =>
    hasMappedValue(fieldMapping[fieldId]),
  );
  const missing = fields.filter(
    (fieldId) => !hasMappedValue(fieldMapping[fieldId]),
  );

  return {
    mapped,
    missing,
    mappedCount: mapped.length,
    totalCount: fields.length,
  };
}

export function getAnalysisReadiness(datasetType, fieldMapping = {}) {
  const rules = getAnalysisReadinessRules(datasetType);

  return Object.values(rules).map((rule) => {
    const required = buildFieldStatus(rule.required || [], fieldMapping);
    const useful = buildFieldStatus(rule.useful || [], fieldMapping);
    const totalMapped = required.mappedCount + useful.mappedCount;
    const totalPossible = required.totalCount + useful.totalCount;
    const score = totalPossible
      ? Math.round((totalMapped / totalPossible) * 100)
      : 0;

    return {
      id: rule.id,
      label: rule.label,
      description: rule.description,
      ready: required.totalCount > 0 && required.missing.length === 0,
      score,
      requiredMapped: required.mappedCount,
      requiredTotal: required.totalCount,
      usefulMapped: useful.mappedCount,
      usefulTotal: useful.totalCount,
      missingRequired: required.missing,
      missingUseful: useful.missing,
      mappedRequired: required.mapped,
      mappedUseful: useful.mapped,
    };
  });
}

function normalise(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function suggestHeaderForField(fieldId, headers = []) {
  const candidates = [
    fieldId,
    getFieldLabel(fieldId),
    ...(DH_FIELD_SYNONYMS[fieldId] || []),
  ]
    .map(normalise)
    .filter(Boolean);

  const normalisedHeaders = headers.map((header) => ({
    raw: header,
    normalised: normalise(header),
  }));

  const exact = normalisedHeaders.find((header) =>
    candidates.includes(header.normalised),
  );
  if (exact) return exact.raw;

  const partial = normalisedHeaders.find((header) =>
    candidates.some(
      (candidate) =>
        candidate &&
        (header.normalised.includes(candidate) ||
          candidate.includes(header.normalised)),
    ),
  );

  return partial?.raw || "";
}

export function buildInitialFieldMapping(datasetType, headers = []) {
  return getRecommendedFields(datasetType).reduce((acc, fieldId) => {
    acc[fieldId] = suggestHeaderForField(fieldId, headers);
    return acc;
  }, {});
}
