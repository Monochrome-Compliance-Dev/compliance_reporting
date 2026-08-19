const ptrsGuidanceContent = [
  {
    slug: "what-is-a-trade-credit-arrangement",
    type: "term",
    category: "Trade credit",
    title: "What is a trade credit arrangement?",
    shortAnswer:
      "For Payment Times Reporting, a trade credit arrangement exists where payment is made, or can be made, at least one calendar day after the supply of goods or services.",
    explanation:
      "The important point is that the arrangement can still be a trade credit arrangement even where payment is actually made earlier. What matters is whether the agreed arrangement allowed payment to occur at least one calendar day after supply, or whether payment was in fact made at least one calendar day after supply.",
    practicalNote:
      "This means you should not classify payments simply by how or when they were ultimately paid. The underlying arrangement needs to be understood.",
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Trade Credit Arrangements",
        paragraphs: ["112"],
        examples: ["22"],
        pages: ["32"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Trade Credit Arrangement (TCA)",
      },
    ],
    related: [
      "do-direct-debits-and-eft-payments-count",
      "are-deposits-and-milestone-payments-included",
      "are-disputed-payments-included",
    ],
    seoTitle: "What Is a Trade Credit Arrangement? | PTRS Guidance",
    seoDescription:
      "Understand what counts as a trade credit arrangement for Payment Times Reporting and how the Regulator applies the definition.",
  },
  {
    slug: "do-direct-debits-and-eft-payments-count",
    type: "question",
    category: "Payments",
    title: "Do direct debits and EFT payments count for PTRS?",
    shortAnswer:
      "The payment method itself does not determine whether a payment is reportable. The key question is whether the payment was made under a reportable trade credit arrangement and whether a specific exclusion applies.",
    explanation:
      "The Regulator's guidance defines reportable trade credit payments by reference to the underlying arrangement, not by whether payment was made by EFT, direct debit or another payment method. A payment made under a trade credit arrangement should therefore be considered for inclusion unless one of the specific exclusions in the Rules or guidance applies.",
    practicalNote:
      "Do not remove payments from your dataset simply because they were made by direct debit or EFT. First determine whether the underlying transaction was a trade credit arrangement, then apply the relevant exclusions.",
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Trade Credit Arrangements",
        paragraphs: ["112"],
        examples: ["22"],
        pages: ["32"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Preparing the TCP Dataset",
        paragraphs: ["127", "130"],
        pages: ["35"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Trade Credit Payment",
      },
    ],
    sourceNote:
      "The Regulator's guidance does not specifically identify direct debit or EFT as separate inclusion or exclusion categories. This answer is based on the Regulator's definition of a trade credit arrangement and the absence of a payment-method exclusion for those methods.",
    related: [
      "what-is-a-trade-credit-arrangement",
      "are-credit-card-payments-included",
      "are-disputed-payments-included",
    ],
    seoTitle: "Do Direct Debits and EFT Payments Count for PTRS?",
    seoDescription:
      "Find out whether direct debit and EFT payments should be included when preparing Payment Times Reporting datasets.",
  },
  {
    slug: "are-disputed-payments-included",
    type: "question",
    category: "Payments",
    title: "Are disputed payments included in PTRS?",
    shortAnswer:
      "Yes. A reporting entity cannot exclude a payment simply because it is disputed.",
    explanation:
      "The Regulator requires disputed payments to remain in the Trade Credit Payment Dataset. If the dispute is resolved, the payment is reported according to the amended arrangement. If payment is made while the dispute remains unresolved, the original arrangement is used.",
    practicalNote:
      "A dispute is not a general exclusion. The transaction still needs to be understood and treated according to the circumstances of the dispute and its resolution.",
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Disputed Payments",
        paragraphs: ["120", "121"],
        examples: ["26", "27"],
        pages: ["34"],
      },
    ],
    related: [
      "what-is-a-trade-credit-arrangement",
      "what-is-a-partial-payment",
      "how-is-payment-time-calculated",
    ],
    seoTitle: "Are Disputed Payments Included in PTRS?",
    seoDescription:
      "Understand how disputed invoices and payments are treated under the Payment Times Reporting Scheme.",
  },
  {
    slug: "what-is-a-partial-payment",
    type: "term",
    category: "Payments",
    title: "What is a partial payment for PTRS?",
    shortAnswer:
      "A partial payment is a payment that does not fully settle the related payment obligation.",
    explanation:
      "Partial payments remain in the Trade Credit Payment Dataset, but they are excluded from payment-time calculations until the relevant obligation is fully settled. The payment that ultimately discharges the obligation is treated separately for the relevant payment-time calculations.",
    practicalNote:
      "Do not assume every payment against an invoice is a separate completed payment obligation. You need to determine whether the payment actually settled the obligation or was only a partial payment.",
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Preparing the TCP Dataset",
        paragraphs: ["135", "136", "137"],
        pages: ["35-36"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Partial payments",
        paragraphs: ["164", "165"],
        examples: ["37"],
        pages: ["41-42"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Partial payment",
      },
    ],
    related: [
      "how-is-payment-time-calculated",
      "what-is-a-trade-credit-arrangement",
      "are-disputed-payments-included",
    ],
    seoTitle: "What Is a Partial Payment for PTRS?",
    seoDescription:
      "Learn how partial payments are identified and treated in Payment Times Reporting datasets and payment-time calculations.",
  },
  {
    slug: "how-is-payment-time-calculated",
    type: "process",
    category: "Calculations",
    title: "How is payment time calculated for PTRS?",
    shortAnswer:
      "For an invoice, payment time is generally the shorter period between the invoice issue date and payment date, or the invoice receipt date and payment date.",
    explanation:
      "The calculation includes both the starting date and the payment date. For Recipient Created Tax Invoices, payment time runs from the RCTI issue date to the payment date. Where there is no invoice or other document demanding payment, payment time is calculated from the date the payment obligation commenced, which may be the date of supply. Payment time is expressed in calendar days and cannot be less than zero.",
    practicalNote:
      "The invoice receipt date can materially affect reported payment time, but only where that date is properly captured. The worked example distinguishes invoice issue date, invoice receipt date and payment date for this reason.",
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Method to calculate payment times",
        paragraphs: ["166", "167", "168", "169"],
        pages: ["42-43"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Payment Time",
      },
    ],
    related: [
      "what-is-a-partial-payment",
      "what-is-a-trade-credit-arrangement",
      "are-disputed-payments-included",
    ],
    seoTitle: "How Is Payment Time Calculated for PTRS?",
    seoDescription:
      "Understand how payment time is calculated for invoices, RCTIs and other payment obligations under Payment Times Reporting.",
  },
];

export default ptrsGuidanceContent;
