export const PTRS_REQUIRED_FIELDS = [
  "payerEntityName",
  "payerEntityAbn",
  "payeeEntityName",
  "payeeEntityAbn",
  "paymentAmount",
  "paymentDate",
];
// v2 note: keep the key lists for service-layer logic, but expose FIELD_LABELS
// so the UI can render nice labels. Use getFieldLabel(key) to safely read.

export const PTRS_OPTIONAL_FIELDS = [
  "payerEntityName",
  "payerEntityAbn",
  "payerEntityAcnArbn",
  "payeeEntityAcnArbn",
  "description",
  "transactionType",
  "isReconciled",
  "supplyDate",
  "contractPoReferenceNumber",
  "contractPoPaymentTerms",
  "noticeForPaymentIssueDate",
  "noticeForPaymentTerms",
  "invoiceReferenceNumber",
  "invoiceIssueDate",
  "invoiceReceiptDate",
  "invoiceAmount",
  "invoicePaymentTerms",
  "invoiceDueDate",
];

// Human-friendly labels for UI rendering (v2)
export const FIELD_LABELS = {
  payerEntityName: "Payer entity name",
  payerEntityAbn: "Payer ABN",
  payerEntityAcnArbn: "Payer ACN/ARBN",
  payeeEntityName: "Supplier entity name",
  payeeEntityAbn: "Supplier ABN",
  payeeEntityAcnArbn: "Supplier ACN/ARBN",
  description: "Description",
  transactionType: "Transaction type",
  isReconciled: "Is reconciled?",
  supplyDate: "Supply date",
  contractPoReferenceNumber: "Contract/PO reference number",
  contractPoPaymentTerms: "Contract/PO payment terms",
  noticeForPaymentIssueDate: "Notice for Payment – issue date",
  noticeForPaymentTerms: "Notice for Payment – terms",
  invoiceReferenceNumber: "Invoice reference number",
  invoiceIssueDate: "Invoice issue date",
  invoiceReceiptDate: "Invoice receipt date",
  invoiceAmount: "Invoice amount",
  invoicePaymentTerms: "Invoice payment terms",
  invoiceDueDate: "Invoice due date",
  paymentAmount: "Payment amount",
  paymentDate: "Payment date",
};

// Helper so callers can render labels without importing the map directly
export const getFieldLabel = (key) => FIELD_LABELS[key] || key;

// Simple synonyms to power auto-suggest / header matching
export const FIELD_SYNONYMS = {
  payeeEntityName: [
    "vendor name",
    "supplier name",
    "name",
    "supplier",
    "vendor",
  ],
  payeeEntityAbn: ["abn", "supplier abn", "vendor abn", "gst number"],
  payeeEntityAcnArbn: ["acn", "arbn", "supplier acn", "supplier arbn"],
  payerEntityName: ["company", "entity", "payer name", "business name"],
  payerEntityAbn: ["payer abn", "our abn"],
  payerEntityAcnArbn: ["payer acn", "payer arbn"],
  paymentAmount: [
    "amount",
    "paid amount",
    "net amount",
    "payment value",
    "amount paid",
  ],
  paymentDate: ["clearing date", "payment date", "paid on", "date paid"],
  description: ["memo", "narration", "details", "line description"],
  transactionType: ["type", "doc type", "document type"],
  isReconciled: ["reconciled", "cleared", "matched"],
  supplyDate: ["supply dt", "supply on", "goods supplied date"],
  contractPoReferenceNumber: [
    "po",
    "po number",
    "contract no",
    "contract number",
  ],
  contractPoPaymentTerms: ["po terms", "contract terms"],
  noticeForPaymentIssueDate: ["nfp issue date", "notice issue date"],
  noticeForPaymentTerms: ["nfp terms", "notice terms"],
  invoiceReferenceNumber: ["invoice no", "invoice number", "inv no"],
  invoiceIssueDate: ["invoice date", "inv date", "issue date"],
  invoiceReceiptDate: ["received date", "receipt date"],
  invoiceAmount: ["invoice total", "inv amount", "gross amount"],
  invoicePaymentTerms: ["invoice terms", "payment terms"],
  invoiceDueDate: ["due date", "inv due date"],
};
