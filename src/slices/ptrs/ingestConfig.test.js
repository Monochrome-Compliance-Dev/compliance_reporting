import {
  getPtrsAdapterLabel,
  getPtrsAdapterMappingRequirements,
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
        "payerEntityName",
        "payerEntityAbn",
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
  });
});
