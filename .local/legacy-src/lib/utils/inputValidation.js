export const inputValidationRules = {
  id: { type: "integer", allowNull: false, headerName: "ID" },
  payerEntityName: {
    type: "string",
    allowNull: false,
    headerName: "Payer Entity Name",
  },
  payerEntityAbn: {
    type: "number",
    allowNull: true,
    headerName: "Payer Entity ABN",
  }, // Accepts only numbers
  payerEntityAcnArbn: {
    type: "number",
    allowNull: true,
    headerName: "Payer Entity ACN/ARBN",
  }, // Accepts only numbers
  payeeEntityName: {
    type: "string",
    allowNull: false,
    headerName: "Payee Entity Name",
  },
  payeeEntityAbn: {
    type: "number",
    allowNull: true,
    headerName: "Payee Entity ABN",
  }, // Accepts only numbers
  payeeEntityAcnArbn: {
    type: "number",
    allowNull: true,
    headerName: "Payee Entity ACN/ARBN",
  }, // Accepts only numbers
  paymentAmount: {
    type: "decimal",
    allowNull: false,
    precision: 15,
    scale: 2,
    headerName: "Payment Amount",
  }, // Accepts monetary values
  description: { type: "string", allowNull: true, headerName: "Description" },
  supplyDate: { type: "date", allowNull: true, headerName: "Supply Date" },
  paymentDate: { type: "date", allowNull: false, headerName: "Payment Date" },
  contractPoReferenceNumber: {
    type: "string",
    allowNull: true,
    headerName: "Contract PO Reference Number",
  },
  contractPoPaymentTerms: {
    type: "string",
    allowNull: true,
    headerName: "Contract PO Payment Terms",
  },
  noticeForPaymentIssueDate: {
    type: "date",
    allowNull: true,
    headerName: "Notice for Payment Issue Date",
  },
  noticeForPaymentTerms: {
    type: "string",
    allowNull: true,
    headerName: "Notice for Payment Terms",
  },
  invoiceReferenceNumber: {
    type: "string",
    allowNull: true,
    headerName: "Invoice Reference Number",
  },
  invoiceIssueDate: {
    type: "date",
    allowNull: true,
    headerName: "Invoice Issue Date",
  },
  invoiceReceiptDate: {
    type: "date",
    allowNull: true,
    headerName: "Invoice Receipt Date",
  },
  invoiceAmount: {
    type: "decimal",
    allowNull: true,
    precision: 15,
    scale: 2,
    headerName: "Invoice Amount",
  }, // Accepts monetary values
  invoicePaymentTerms: {
    type: "string",
    allowNull: true,
    headerName: "Invoice Payment Terms",
  },
  invoiceDueDate: {
    type: "date",
    allowNull: true,
    headerName: "Invoice Due Date",
  },
  isTcp: {
    type: "boolean",
    allowNull: false,
    defaultValue: true,
    headerName: "Is TCP",
  },
  tcpExclusion: { type: "text", allowNull: true, headerName: "TCP Exclusion" },
  peppolEnabled: {
    type: "boolean",
    allowNull: false,
    defaultValue: true,
    headerName: "Peppol Enabled",
  },
  rcti: {
    type: "boolean",
    allowNull: false,
    defaultValue: false,
    headerName: "RCTI",
  },
  creditCardPayment: {
    type: "boolean",
    allowNull: false,
    defaultValue: false,
    headerName: "Credit Card Payment",
  },
  creditCardNumber: {
    type: "string",
    allowNull: true,
    pattern: /^\d*$/,
    headerName: "Credit Card Number",
  }, // Accepts only digits
  partialPayment: {
    type: "boolean",
    allowNull: false,
    defaultValue: false,
    headerName: "Partial Payment",
  },
  paymentTerm: {
    type: "integer",
    allowNull: true,
    min: 0,
    max: 999,
    headerName: "Payment Term",
  }, // Accepts integers within a range
  excludedTcp: {
    type: "boolean",
    allowNull: false,
    defaultValue: false,
    headerName: "Excluded TCP",
  },
  notes: { type: "text", allowNull: true, headerName: "Notes" },
  isSb: {
    type: "boolean",
    allowNull: true,
    defaultValue: true,
    headerName: "Is SB",
  },
  createdBy: { type: "integer", allowNull: true, headerName: "Created By" },
  updatedBy: { type: "integer", allowNull: true, headerName: "Updated By" },
};
