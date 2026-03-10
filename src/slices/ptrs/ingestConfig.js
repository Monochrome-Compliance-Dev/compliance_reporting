// NOTE: This is the FE-side field configuration for the mapping UI.
// It must stay aligned with the BE canonical contract in:
//   compliance_reporting_server/v2/ptrs/contracts/ptrs.canonical.contract.js
// using FE-friendly (camelCase) field IDs.
//
// Rule of thumb:
// - PTRS_REQUIRED_FIELDS / PTRS_OPTIONAL_FIELDS should reflect the BE canonical contract.
// - FE-only derived/system helpers can still exist, but they should be clearly marked as supplemental.

// -----------------------------------------------------------------------------
// Required canonical fields (aligned with BE canonical contract)
// -----------------------------------------------------------------------------
export const PTRS_REQUIRED_FIELDS = [
  // Identity
  "payerEntityName",
  "payerEntityAbn",
  "payeeEntityName",
  "payeeEntityAbn",
  "invoiceReferenceNumber",

  // Transaction values
  "paymentAmount",
  "paymentDate",
];

// -----------------------------------------------------------------------------
// Optional canonical fields (useful for completeness / QA, but not MVP blockers)
// -----------------------------------------------------------------------------
export const PTRS_OPTIONAL_FIELDS = [
  // Identity extras
  "payerEntityAcnArbn",
  "payeeEntityAcnArbn",

  // Transaction values
  "description",

  // Raw dates
  "supplyDate",
  "noticeForPaymentIssueDate",
  "invoiceIssueDate",
  "invoiceReceiptDate",
  "invoiceDueDate",

  // Raw payment term sources
  "contractPoReferenceNumber",
  "contractPoPaymentTerms",
  "noticeForPaymentTerms",
  "invoicePaymentTerms",
  "paymentTerm",

  // Regulator classification flags
  "tradeCreditPayment",
  "excludedTradeCreditPayment",
  "peppolEinvoiceEnabled",
  "rcti",
  "creditCardPayment",
  "creditCardNo",
  "partialPayment",

  // -------------------------------------------------------------------------
  // FE/system supplemental fields (not part of the BE canonical contract)
  // Keep these explicit so they are not mistaken for canonical contract fields.
  // -------------------------------------------------------------------------
  "paymentTimeReferenceDate",
  "paymentTimeReferenceKind",
  "paymentTermSource",
  "paymentTermDays",
  "paymentTimeDays",
  "isSmallBusiness",
  "excludeFromMetrics",
  "excludeComment",
  "excludeSetAt",
  "excludeSetBy",
];

// -----------------------------------------------------------------------------
// Grouped mapping requirements (MVP UX rules layered on top of the BE contract)
// -----------------------------------------------------------------------------
export const PTRS_REQUIRED_FIELD_GROUPS = [
  {
    id: "paymentClockStart",
    label: "Payment timing start date",
    description:
      "Map at least one date that can be used as the start date for calculating payment time.",
    fields: [
      // Pragmatic FE fallback + canonical raw dates
      "invoiceDueDate",
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

  // Exclusions / FE system controls (supplemental, not BE canonical contract fields)
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
