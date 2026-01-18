// NOTE: This is the FE-side "source of truth" for the mapping UI in MVP land.
// It mirrors the BE canonical contract (v2/ptrs/contracts/ptrs.canonical.contract.js)
// using FE-friendly (camelCase) field IDs.

// -----------------------------------------------------------------------------
// Required canonical fields (minimum to progress through Validate/Metrics/Report)
// -----------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Required canonical fields (minimum to progress through Validate/Metrics/Report)
// Update: Only the minimal fields required for user mapping are included here.
// Others are moved to optional.
// ---------------------------------------------------------------------------
export const PTRS_REQUIRED_FIELDS = [
  // Identity
  "payerEntityName",
  "payerEntityAbn",
  "payeeEntityName",
  "payeeEntityAbn",
  "invoiceReferenceNumber",
  // Amounts + dates for payment time
  "paymentAmount",
  "paymentDate",
];

// -----------------------------------------------------------------------------
// Optional canonical fields (useful for completeness / QA, but not MVP blockers)
// -----------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Optional canonical fields (including those required for metrics/report but not user-mapped)
// ---------------------------------------------------------------------------
export const PTRS_OPTIONAL_FIELDS = [
  // Identity extras
  "payerEntityAcnArbn",
  "payeeEntityAcnArbn",

  // Informational
  "description",

  // Raw dates (used to derive paymentTimeReferenceDate)
  "supplyDate",
  "noticeForPaymentIssueDate",
  "invoiceIssueDate",
  "invoiceReceiptDate",
  "invoiceDueDate",

  // Provenance / explainability
  "paymentTimeReferenceKind",

  // Terms inputs (raw)
  "contractPoReferenceNumber",
  "contractPoPaymentTerms",
  "noticeForPaymentTerms",
  "invoicePaymentTerms",
  "paymentTerm",

  // Terms provenance
  "paymentTermSource",

  // Regulator shaping flags (formerly required, now optional for user mapping)
  "tradeCreditPayment",
  "excludedTradeCreditPayment",

  // SBI outcome (formerly required, now optional for user mapping)
  "isSmallBusiness",

  // Metrics-required fields that are typically derived, not mapped:
  "paymentTermDays",
  "paymentTimeDays",

  // Regulator optional flags
  "peppolEinvoiceEnabled",
  "rcti",
  "creditCardPayment",
  "creditCardNo",
  "partialPayment",

  // System exclusion controls (explicit, MVP-friendly)
  "excludeFromMetrics",
  "excludeComment",
  "excludeSetAt",
  "excludeSetBy",
];

// -----------------------------------------------------------------------------
// Grouped mapping requirements (MVP UX rules)
// -----------------------------------------------------------------------------
export const PTRS_REQUIRED_FIELD_GROUPS = [
  {
    id: "paymentClockStart",
    label: "Payment timing start date",
    description:
      "At least one of these dates is required to calculate payment time.",
    fields: [
      "invoiceIssueDate",
      "invoiceReceiptDate",
      "noticeForPaymentIssueDate",
      "supplyDate",
    ],
    minRequired: 1,
  },
];

// -----------------------------------------------------------------------------
// Human-readable labels (MapPanel should prefer these for display)
// -----------------------------------------------------------------------------
export const PTRS_FIELD_LABELS = {
  // Identity
  payerEntityName: "Payer name",
  payerEntityAbn: "Payer ABN",
  payerEntityAcnArbn: "Payer ACN/ARBN",
  payeeEntityName: "Payee name",
  payeeEntityAbn: "Payee ABN",
  payeeEntityAcnArbn: "Payee ACN/ARBN",
  invoiceReferenceNumber: "Invoice reference number",

  // Amounts / dates
  paymentAmount: "Payment amount",
  paymentDate: "Payment date",
  paymentTimeReferenceDate: "Payment time reference date",
  paymentTimeReferenceKind: "Payment time reference kind (provenance)",
  paymentTimeDays: "Payment time (days, derived)",

  // Terms
  paymentTerm: "Payment term (raw text)",
  paymentTermDays: "Payment term (days, derived)",
  paymentTermSource: "Payment term source (provenance)",
  contractPoReferenceNumber: "Contract/PO reference number",
  contractPoPaymentTerms: "Contract/PO payment terms",
  noticeForPaymentIssueDate: "Notice for payment issue date",
  noticeForPaymentTerms: "Notice for payment terms",
  invoicePaymentTerms: "Invoice payment terms",
  invoiceIssueDate: "Invoice issue date",
  invoiceReceiptDate: "Invoice receipt date",
  invoiceDueDate: "Invoice due date",
  supplyDate: "Supply date",

  // Flags
  tradeCreditPayment: "Trade credit payment (flag)",
  excludedTradeCreditPayment: "Excluded trade credit payment (flag)",
  isSmallBusiness: "Is small business (SBI outcome)",
  peppolEinvoiceEnabled: "Peppol e-invoice enabled",
  rcti: "RCTI",
  creditCardPayment: "Credit card payment",
  creditCardNo: "Credit card number",
  partialPayment: "Partial payment",

  // Exclusions
  excludeFromMetrics: "Exclude from metrics",
  excludeComment: "Exclude comment",
  excludeSetAt: "Exclude set at",
  excludeSetBy: "Exclude set by",

  // Other
  description: "Description",
};

// -----------------------------------------------------------------------------
// Simple synonyms to power auto-suggest
// -----------------------------------------------------------------------------
export const FIELD_SYNONYMS = {
  payerEntityName: ["payer name", "org name", "organisation", "organization"],
  payerEntityAbn: ["payer abn", "org abn", "organisation abn", "abn"],
  payeeEntityName: ["payee name", "supplier name", "vendor name", "name"],
  payeeEntityAbn: ["payee abn", "supplier abn", "vendor abn"],
  invoiceReferenceNumber: [
    "invoice reference",
    "invoice id",
    "invoice number",
    "reference",
  ],
  paymentAmount: ["payment amount", "amount", "paid amount", "payment value"],
  paymentDate: ["payment date", "clearing date", "paid on"],
  paymentTermDays: ["payment term days", "terms days", "net days"],
  paymentTerm: ["payment terms", "terms", "net terms"],
};
