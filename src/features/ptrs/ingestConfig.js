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

export const PTRS_FIELD_LABELS = {
  payeeEntityName: "Payee Entity Name",
  payeeEntityAbn: "Payee Entity ABN",
  paymentAmount: "Payment Amount",
  paymentDate: "Payment Date",
  payerEntityName: "Payer Entity Name",
  payerEntityAbn: "Payer Entity ABN",
  payerEntityAcnArbn: "Payer Entity ACN/ARBN",
  payeeEntityAcnArbn: "Payee Entity ACN/ARBN",
  description: "Description",
  transactionType: "Transaction Type",
  isReconciled: "Is Reconciled",
  supplyDate: "Supply Date",
  contractPoReferenceNumber: "Contract/PO Reference Number",
  contractPoPaymentTerms: "Contract/PO Payment Terms",
  noticeForPaymentIssueDate: "Notice for Payment Issue Date",
  noticeForPaymentTerms: "Notice for Payment Terms",
  invoiceReferenceNumber: "Invoice Reference Number",
  invoiceIssueDate: "Invoice Issue Date",
  invoiceReceiptDate: "Invoice Receipt Date",
  invoiceAmount: "Invoice Amount",
  invoicePaymentTerms: "Invoice Payment Terms",
  invoiceDueDate: "Invoice Due Date",
};
