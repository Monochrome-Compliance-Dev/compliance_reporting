import { fieldMapping } from "../features/reports/ptrs/fieldMapping";

export const stepConfigs = {
  step1: {
    editableFields: ["isTcp", "tcpExclusionComment"],
    hiddenColumns: fieldMapping
      .filter(
        (field) =>
          !field.requiredAtStep?.includes(1) ||
          field.group === "step 2" ||
          field.group === "step 3"
      )
      .map((field) => field.name),
    validationRules: {
      isTcp: "boolean",
      tcpExclusionComment: "string",
    },
    issueRules: [
      {
        id: "missingAbn",
        label: "Missing Payee Entity ABN",
        field: "payeeEntityAbn",
        condition: (record) =>
          !record.payeeEntityAbn || record.payeeEntityAbn === "",
      },
      {
        id: "missingName",
        label: "Missing Payee Entity Name",
        field: "payeeEntityName",
        condition: (record) =>
          !record.payeeEntityName || record.payeeEntityName === "",
      },
    ],
    exclusionRules: [
      {
        field: "description",
        type: "contains",
        terms: ["wage", "salary", "commission"],
      },
      {
        field: "description",
        type: "contains",
        terms: ["royalty", "royalties"],
      },
      {
        field: "invoicePaymentTerms",
        type: "contains",
        terms: ["immediate", "cash", "on delivery", "COD", "cash on delivery"],
      },
    ],
  },
  step2: {
    editableFields: [
      "peppolEnabled",
      "rcti",
      "creditCardPayment",
      "creditCardNumber",
      "partialPayment",
    ],
    hiddenColumns: fieldMapping
      .filter(
        (field) =>
          !field.requiredAtStep?.includes(2) ||
          field.group === "step 1" ||
          field.group === "step 3" ||
          field.group === "step 4"
      )
      .map((field) => field.name),
    validationRules: {
      peppolEnabled: "boolean",
      rcti: "boolean",
      creditCardPayment: "boolean",
      creditCardNumber: "string",
      partialPayment: "boolean",
    },
    issueRules: [],
    exclusionRules: [
      {
        field: "description",
        type: "contains",
        terms: ["intra-group"],
      },
      {
        field: "paymentAmount",
        type: "lessThanAndCreditCard",
        terms: [100],
      },
    ],
  },
  step3: {
    editableFields: [],
    hiddenColumns: [],
    validationRules: {},
    issueRules: [],
    exclusionRules: [],
  },
  step4: {
    editableFields: ["partialPayment"],
    hiddenColumns: [],
    validationRules: {
      paymentTime: "number",
    },
    issueRules: [],
    exclusionRules: [],
  },
  step5: {
    editableFields: [],
    hiddenColumns: [],
    validationRules: {},
    issueRules: [],
    exclusionRules: [],
  },
};
