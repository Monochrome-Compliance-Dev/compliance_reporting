import {
  getPtrsAdapterLabel,
  getPtrsAdapterMappingRequirements,
  getPtrsDatasetMappingReadiness,
  getReachablePtrsDatasetIds,
} from "./ingestConfig";

describe("PTRS adapter-specific mapping requirements", () => {
  test("SAP accounting sources require grouping and document-type mappings", () => {
    const requirements = getPtrsAdapterMappingRequirements(
      "sap_accounting_event",
    );

    expect(requirements.requiredFields).toEqual(
      expect.arrayContaining([
        "documentType",
        "companyCode",
        "sourceAccountCode",
        "clearingDocument",
      ]),
    );
  });

  test("direct-payment sources require the shared payment contract but no SAP fields", () => {
    const requirements = getPtrsAdapterMappingRequirements("direct_payment");

    expect(requirements.requiredFields).toEqual(
      expect.arrayContaining([
        "payeeEntityName",
        "payeeEntityAbn",
        "invoiceReferenceNumber",
        "paymentAmount",
        "paymentDate",
      ]),
    );
    expect(requirements.requiredFields).not.toEqual(
      expect.arrayContaining([
        "documentType",
        "companyCode",
        "sourceAccountCode",
        "clearingDocument",
      ]),
    );
    expect(requirements.requiredFieldGroups).toEqual([
      expect.objectContaining({ id: "paymentClockStart", minRequired: 1 }),
    ]);
    expect(getPtrsAdapterLabel("direct_payment")).toBe(
      "Direct / self-contained transactions",
    );
    expect(requirements.requiredFieldGroups[0].fields).not.toContain(
      "invoiceDueDate",
    );
    expect(
      getPtrsDatasetMappingReadiness("direct_payment", [
        { canonicalField: "payee_entity_name" },
        { canonicalField: "payee_entity_abn" },
        { canonicalField: "invoice_reference_number" },
        { canonicalField: "payment_amount" },
        { canonicalField: "payment_date" },
        { canonicalField: "invoice_issue_date" },
      ]).ready,
    ).toBe(true);
  });
});

test("mapping reachability keeps transaction datasets isolated", () => {
  const datasets = [
    { id: "sap", purpose: "transaction" },
    { id: "direct", purpose: "transaction" },
    { id: "vendors", purpose: "reference" },
  ];
  const joins = [
    {
      from: { datasetId: "sap" },
      to: { datasetId: "vendors" },
    },
    {
      from: { datasetId: "vendors" },
      to: { datasetId: "direct" },
    },
  ];
  expect(
    Array.from(getReachablePtrsDatasetIds(datasets, joins, "sap")),
  ).toEqual(["sap", "vendors"]);
  expect(
    Array.from(getReachablePtrsDatasetIds(datasets, joins, "direct")),
  ).toEqual(["direct", "vendors"]);
});
