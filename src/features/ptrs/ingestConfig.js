export const PTRS_REQUIRED_FIELDS = [
  "payeeEntityName",
  "payeeEntityAbn",
  "paymentAmount",
  "paymentDate",
];

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

// Simple synonyms to power auto-suggest later
export const FIELD_SYNONYMS = {
  payeeEntityName: ["vendor name", "supplier name", "name"],
  payeeEntityAbn: ["abn", "supplier abn", "vendor abn"],
  paymentAmount: ["amount", "paid amount", "net amount", "payment value"],
  paymentDate: ["clearing date", "payment date", "paid on"],
};
