export const ptrsGuidance = [
  {
    step: 1,
    name: "Step 1",
    description: "Review TCP status",
    requirement:
      "Review each payment record and untick the TCP checkbox if the record should not be treated as a TCP. If unticked, a comment must be provided to explain the reason.",
  },
];

export const _ptrsGuidance = [
  {
    name: "Peppol enabled eInvoice",
    description:
      "A Peppol enabled eInvoice is an electronic invoice that is compliant with the Peppol standard. It allows for seamless exchange of invoices between businesses and government entities.",
    guidanceMaterial: "Paragraphs 138-140, Examples 29-30",
    requirement:
      "The reporting entity needs to record whether the TCP was a 'Peppol eInvoice capable' payment.",
  },
  {
    name: "RCTI",
    description:
      "Recipient Created Tax Invoice (RCTI) is an invoice created by the recipient of goods or services on behalf of the supplier.",
    guidanceMaterial: "Paragraphs 141 and 167",
    requirement:
      "The reporting entity needs to record whether the TCP was an RCTI.",
  },
  {
    name: "Credit Card Payment",
    description:
      "A credit card payment is a transaction made using a credit card to settle an invoice.",
    guidanceMaterial: "Paragraphs 151-153, 168-169",
    requirement:
      "The reporting entity needs to record whether the payment was made using a credit card, and if so, record the details of said card. (This is to clearly identify thoe cards that are subject to a relevant internal policy - which may allow for the payment to be excluded from the dataset).",
  },
  {
    name: "Partial Payment",
    description:
      "A partial payment is a payment that does not fully settle the related obligation. If the payment did not fully settle the obligation, it must be recorded as a partial payment.",
    guidanceMaterial: "Paragraphs 135-137, 164-165, Example 37",
    requirement:
      "The reporting entity needs to record whether the TCP was a partial payment.",
  },
  {
    name: "Small Business Identification (SBI)",
    description:
      "To determine whether a payment was made to a small business, the reporting entity must submit the relevant ABNs to the Payment Times Small Business Identification Tool.",
    guidanceMaterial: "Section 13(5)",
    requirement:
      "The reporting entity must extract the ABNs from the TCP dataset, upload them to the SBI Tool (external), and upload the resulting list of ABNs that are NOT small businesses. The platform will then flag all other ABNs as small business payments.",
  },
  {
    name: "Payment Term",
    description:
      "The payment term refers to the period within which a payment should be made after the invoice date. Contract/PO payment terms take precedence over invoice payment terms.",
    guidanceMaterial: "Paragraphs 143-150, Examples 33-35",
    requirement:
      "The reporting entity needs to record the payment terms for each TCP.",
    conditions: [
      {
        condition:
          "The payment has terms captured under the Contract/PO payment terms (i.e. express terms for the payment were set out in a contract or Purchase Order).",
        paymentTerm:
          "Determined in accordance with the contract or PO and converted into the largest possible number of calendar days (regardless of when the invoice was actually issued or received), if applicable.",
        example:
          "'EOM' would have a Payment Term of 31 days, 'End of Next Month' would have a Payment Term of 62 days, etc.)",
        guidance: "Paragraphs 149-150, Example 35",
      },
      {
        condition:
          "The payment does not have terms captured under the Contract/PO payment terms (i.e. there were no express terms for the payment set out in a contract or Purchase Order), but it does have terms captured under the Invoice payment terms (i.e. express terms for a payment were set out in the invoice).",
        paymentTerm:
          "Determined in accordance with the Invoice payment terms - converted into the largest possible number of calendar days, if applicable.",
      },
      {
        condition:
          "Neither of the above apply (i.e. there were no express terms for payment set out in a contract or Purchase Order or Invoice).",
        paymentTerm:
          "The number of calendar days between the Invoice issue date and the Invoice due date.",
        example:
          "If the invoice was issued on 1 July and the due date was 31 July, the payment term would be 30 days.",
      },
    ],
  },
];
