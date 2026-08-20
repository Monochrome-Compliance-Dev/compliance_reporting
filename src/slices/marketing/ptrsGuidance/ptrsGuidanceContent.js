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
    searchTerms: [
      "trade credit arrangement",
      "trade credit ptrs",
      "what counts as trade credit",
      "trade credit payment times reporting",
      "payment after supply ptrs",
      "payment terms trade credit",
      "is this a trade credit arrangement",
      "what transactions count for ptrs",
    ],
    alternateQuestions: [
      "What counts as a trade credit arrangement for PTRS?",
      "When is a payment considered trade credit?",
      "Does payment have to occur after supply to count for PTRS?",
      "How do I know if a transaction is a trade credit arrangement?",
    ],
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
    searchTerms: [
      "direct debit ptrs",
      "eft ptrs",
      "automatic payments ptrs",
      "electronic funds transfer payment times reporting",
      "does payment method matter ptrs",
      "which payment methods count for ptrs",
      "direct debit payment times report",
      "eft payment times report",
      "automatic invoice payment ptrs",
    ],
    alternateQuestions: [
      "Do direct debits need to be included in a Payment Times Report?",
      "Are EFT payments reportable under PTRS?",
      "Does the way an invoice is paid affect whether it is reportable?",
      "Are automatic payments included in Payment Times Reporting?",
    ],
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
    searchTerms: [
      "disputed invoices ptrs",
      "disputed payments ptrs",
      "invoice dispute payment times reporting",
      "exclude disputed invoices ptrs",
      "disputed supplier invoice ptrs",
      "payment dispute reporting",
      "can disputed invoices be excluded",
    ],
    alternateQuestions: [
      "Can disputed invoices be excluded from PTRS?",
      "Do I have to report payments relating to disputed invoices?",
      "What happens to a payment if the invoice is in dispute?",
      "How are supplier disputes treated in Payment Times Reporting?",
    ],
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
    searchTerms: [
      "partial payment ptrs",
      "part payment ptrs",
      "part paid invoice payment times reporting",
      "partially paid invoice ptrs",
      "multiple payments against invoice ptrs",
      "invoice instalments ptrs",
      "partial settlement ptrs",
    ],
    alternateQuestions: [
      "How are partial payments treated for PTRS?",
      "What happens if an invoice is only partly paid?",
      "Do part payments count in payment-time calculations?",
      "Which payment date do I use when an invoice is paid in instalments?",
    ],
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
    searchTerms: [
      "calculate payment time ptrs",
      "ptrs payment days calculation",
      "payment time formula ptrs",
      "invoice date to payment date ptrs",
      "invoice receipt date ptrs",
      "calendar days payment times reporting",
      "how many days to pay ptrs",
      "payment time calculation payment times report",
    ],
    alternateQuestions: [
      "How many days does PTRS say an invoice took to pay?",
      "Which dates are used to calculate payment time?",
      "Does PTRS calculate payment time from the invoice date or receipt date?",
      "Are payment times calculated using calendar days?",
    ],
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
  {
    slug: "are-credit-card-payments-included",
    type: "question",
    category: "Payments",
    title: "Are credit card payments included in PTRS?",
    shortAnswer:
      "Credit card payments can be excluded in some circumstances, but they are not automatically excluded simply because a credit card was used.",
    explanation:
      "A reporting entity may exclude a credit card payment if the payment is less than $100 including GST, or if the card is subject to a genuinely enforced internal policy that prohibits its use for trade credit arrangements. A policy that prohibits payment of invoices by credit card, or restricts cards to point-of-sale transactions and prepayments, will generally support the exclusion.",
    practicalNote:
      "Do not remove every credit card transaction from the dataset. The $100 exclusion can be applied directly, but higher-value payments need to be assessed against the relevant credit card policy before being excluded.",
    searchTerms: [
      "credit card payments ptrs",
      "corporate card ptrs",
      "credit card exclusion ptrs",
      "exclude credit card payments payment times reporting",
      "100 dollar credit card ptrs",
      "company credit card invoices ptrs",
      "credit card policy ptrs",
      "card payments payment times report",
    ],
    alternateQuestions: [
      "Can credit card payments be excluded from PTRS?",
      "Do corporate card transactions need to be reported?",
      "Are credit card payments under $100 excluded from PTRS?",
      "Does a company credit card policy affect Payment Times Reporting?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Credit cards",
        paragraphs: ["157", "158", "159", "160", "161", "162"],
        pages: ["40-41"],
      },
    ],
    related: [
      "do-direct-debits-and-eft-payments-count",
      "what-payments-can-be-excluded",
      "what-if-a-supplier-does-not-have-an-abn",
    ],
    seoTitle: "Are Credit Card Payments Included in PTRS?",
    seoDescription:
      "Understand when credit card payments can be excluded from Payment Times Reporting and when further assessment is required.",
  },
  {
    slug: "are-deposits-and-milestone-payments-included",
    type: "question",
    category: "Payments",
    title: "Are deposits and milestone payments included in PTRS?",
    shortAnswer:
      "It depends on the timing of payment relative to supply. A deposit paid before supply is generally not reportable, while a milestone payment can be reportable where payment can occur at least one calendar day after the relevant supply.",
    explanation:
      "A single contract can contain several separate payment arrangements, and each needs to be classified on its own. The Regulator's worked example shows an upfront deposit paid before supply as not reportable. Milestones already prepaid by that deposit are also not reportable. Later milestone payments are trade credit arrangements where payment can be made at least one calendar day after completion of the relevant phase.",
    practicalNote:
      "Do not classify an entire project or contract as one transaction. Deposits, milestone payments and other payment obligations may have different PTRS treatment even when they arise under the same agreement.",
    searchTerms: [
      "deposit payments ptrs",
      "milestone payments ptrs",
      "progress payments ptrs",
      "advance payment ptrs",
      "prepayment ptrs",
      "upfront deposit payment times reporting",
      "construction milestone payments ptrs",
      "project payments ptrs",
      "stage payments ptrs",
    ],
    alternateQuestions: [
      "Do deposits need to be included in PTRS?",
      "Are milestone or progress payments reportable?",
      "Does an upfront payment count as trade credit?",
      "How are staged payments under a contract treated for PTRS?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Agreements with multiple arrangements",
        paragraphs: ["113"],
        examples: ["23", "24"],
        pages: ["32-33"],
      },
    ],
    related: [
      "what-is-a-trade-credit-arrangement",
      "what-payments-can-be-excluded",
      "what-is-a-partial-payment",
    ],
    seoTitle: "Are Deposits and Milestone Payments Included in PTRS?",
    seoDescription:
      "Learn how deposits, milestone payments and multiple payment arrangements are treated for Payment Times Reporting.",
  },
  {
    slug: "what-payments-can-be-excluded",
    type: "question",
    category: "Exclusions",
    title: "What payments can be excluded from PTRS?",
    shortAnswer:
      "The Regulator provides specific exclusions, including certain government and employee payments, payments to entities without an ABN, intragroup payments and qualifying credit card payments.",
    explanation:
      "Exclusions need to be applied according to the specific rules rather than through broad assumptions about payment types. Government and employee payments are excluded because they are not trade credit arrangements. Payments to payees without an ABN and payments within the same consolidated group are excluded from the TCP Dataset. Certain credit card payments may also be excluded. Partial payments are treated differently: they remain relevant to the TCP Dataset but are excluded from the SBTCP Dataset for payment-time calculations until the obligation is settled.",
    practicalNote:
      "Treat exclusions as individual classification rules, not as a general cleanup exercise. The Regulator may review the methodology and assumptions used to remove transactions from the reporting population.",
    searchTerms: [
      "ptrs exclusions",
      "payment times reporting exclusions",
      "payments excluded from ptrs",
      "what can I leave out of ptrs",
      "which payments do not count ptrs",
      "exclude transactions payment times report",
      "non reportable payments ptrs",
      "ptrs excluded payments list",
    ],
    alternateQuestions: [
      "Which payments can I leave out of a Payment Times Report?",
      "What transactions are excluded from PTRS?",
      "Which supplier payments do not have to be reported?",
      "What should be removed from the Trade Credit Payment Dataset?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Government and employee payments",
        paragraphs: ["115", "116", "117", "118", "119"],
        pages: ["34"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Entity without an ABN",
        paragraphs: ["151", "152", "153"],
        pages: ["39-40"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Intragroup payments",
        paragraphs: ["154", "155", "156"],
        pages: ["40"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Credit cards",
        paragraphs: ["157", "158", "159", "160", "161", "162"],
        pages: ["40-41"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Partial payments",
        paragraphs: ["164", "165"],
        pages: ["41-42"],
      },
    ],
    related: [
      "are-credit-card-payments-included",
      "are-payments-to-government-entities-included",
      "are-employee-payments-included",
      "are-intragroup-payments-included",
      "what-if-a-supplier-does-not-have-an-abn",
    ],
    seoTitle: "What Payments Can Be Excluded From PTRS?",
    seoDescription:
      "See the main payment exclusions that apply when preparing Payment Times Reporting datasets and how they should be treated.",
  },
  {
    slug: "are-payments-to-government-entities-included",
    type: "question",
    category: "Exclusions",
    title: "Are payments to government entities included in PTRS?",
    shortAnswer:
      "No. Payments to government entities are not trade credit arrangements for PTRS purposes and must be excluded from the reporting datasets.",
    explanation:
      "The Regulator states that payments to government entities, corporate Commonwealth entities and local government bodies are excluded from reporting. The Small Business Identification Tool includes a list of Commonwealth, State and Local Government ABNs that can assist reporting entities with identifying these payments.",
    practicalNote:
      "Government suppliers should be identified deliberately rather than relying only on supplier names. The SBI Tool can help identify government ABNs in the dataset.",
    searchTerms: [
      "government payments ptrs",
      "government suppliers ptrs",
      "council payments ptrs",
      "commonwealth suppliers ptrs",
      "state government payments payment times reporting",
      "local government ptrs",
      "government abn ptrs",
      "exclude government payments ptrs",
    ],
    alternateQuestions: [
      "Do payments to government suppliers need to be reported?",
      "Are council payments included in PTRS?",
      "Do Commonwealth or State Government invoices count for PTRS?",
      "How do I identify government suppliers to exclude from PTRS?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Government and employee payments",
        paragraphs: ["115", "116", "117"],
        pages: ["34"],
      },
    ],
    related: [
      "what-payments-can-be-excluded",
      "are-employee-payments-included",
      "what-is-the-small-business-identification-tool",
    ],
    seoTitle: "Are Government Payments Included in PTRS?",
    seoDescription:
      "Find out how payments to Commonwealth, State and local government entities are treated under Payment Times Reporting.",
  },
  {
    slug: "are-employee-payments-included",
    type: "question",
    category: "Exclusions",
    title: "Are employee payments included in PTRS?",
    shortAnswer:
      "No. Employee-related payments are excluded from Payment Times Reporting.",
    explanation:
      "Employee payments include payments subject to Pay As You Go withholding and payments relating to employee benefits, including superannuation contributions. Where it is unclear whether an individual is an employee, the Regulator may consider the way the person is remunerated. GST treatment or the presence of an ABN may indicate that the arrangement is instead with a contractor.",
    practicalNote:
      "The distinction is about the nature of the relationship, not simply whether a payment was made to an individual. Contractor payments may still need to be assessed as trade credit payments.",
    searchTerms: [
      "employee payments ptrs",
      "staff payments ptrs",
      "payroll ptrs",
      "superannuation ptrs",
      "employee expenses payment times reporting",
      "payg payments ptrs",
      "contractor versus employee ptrs",
      "exclude employees ptrs",
    ],
    alternateQuestions: [
      "Do employee payments need to be included in PTRS?",
      "Are payroll or superannuation payments reportable?",
      "What about payments made to individual contractors?",
      "How does PTRS distinguish employees from contractors?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Government and employee payments",
        paragraphs: ["115", "118", "119"],
        pages: ["34"],
      },
    ],
    related: [
      "what-payments-can-be-excluded",
      "are-payments-to-government-entities-included",
      "what-is-a-trade-credit-arrangement",
    ],
    seoTitle: "Are Employee Payments Included in PTRS?",
    seoDescription:
      "Understand why employee payments are excluded from PTRS and how contractor arrangements may need different treatment.",
  },
  {
    slug: "are-intragroup-payments-included",
    type: "question",
    category: "Exclusions",
    title: "Are payments between related companies included in PTRS?",
    shortAnswer:
      "Payments between entities in the same consolidated group are excluded, but payments to other related entities are not automatically excluded.",
    explanation:
      "The Regulator requires payments between entities in the same consolidated group to be excluded from the TCP Dataset. This applies even where the receiving entity has annual revenue below $10 million. However, a related entity that is not a controlled entity is not covered by the intragroup exclusion.",
    practicalNote:
      "Do not treat every related-party payment as intragroup. The relevant question is whether the entities form part of the same consolidated group for reporting purposes.",
    searchTerms: [
      "intragroup payments ptrs",
      "intercompany payments ptrs",
      "related party payments ptrs",
      "related company invoices ptrs",
      "group company payments payment times reporting",
      "controlled entity payments ptrs",
      "subsidiary payments ptrs",
      "exclude intercompany transactions ptrs",
    ],
    alternateQuestions: [
      "Do intercompany payments need to be included in PTRS?",
      "Are related-party invoices reportable?",
      "Can payments between companies in the same group be excluded?",
      "Does the PTRS intragroup exclusion apply to every related entity?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Intragroup payments",
        paragraphs: ["154", "155", "156"],
        pages: ["40"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Intra-group payment",
      },
    ],
    related: [
      "what-payments-can-be-excluded",
      "what-is-a-trade-credit-arrangement",
    ],
    seoTitle: "Are Intragroup Payments Included in PTRS?",
    seoDescription:
      "Understand when payments between related or controlled entities must be excluded from Payment Times Reporting.",
  },
  {
    slug: "what-if-a-supplier-does-not-have-an-abn",
    type: "question",
    category: "Suppliers",
    title: "What if a supplier does not have an ABN?",
    shortAnswer:
      "Payments to a payee that does not have an ABN are excluded from the TCP Dataset.",
    explanation:
      "Where the reporting entity's records do not clearly establish whether a supplier has an ABN, it may sometimes be reasonable to assume that the supplier does not have one. Any such assumption should be documented, and the Regulator will consider whether the approach was reasonable in the circumstances.",
    practicalNote:
      "Missing ABN data is not automatically the same thing as the supplier not having an ABN. If the circumstances suggest the supplier is likely to have one, further investigation may be required before excluding the payment.",
    searchTerms: [
      "supplier no abn ptrs",
      "missing supplier abn ptrs",
      "vendor without abn payment times reporting",
      "blank abn ptrs",
      "supplier master missing abn",
      "exclude supplier no abn ptrs",
      "unknown abn ptrs",
      "no abn payment times report",
    ],
    alternateQuestions: [
      "What do I do if a supplier has no ABN?",
      "Can payments be excluded if the supplier ABN is missing?",
      "Is a blank ABN in the supplier master enough to exclude a payment?",
      "Do suppliers without an ABN count for PTRS?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Payer and payee details",
        paragraphs: ["129"],
        pages: ["35"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payment – Entity without an ABN",
        paragraphs: ["151", "152", "153"],
        examples: ["36"],
        pages: ["39-40"],
      },
    ],
    related: [
      "what-payments-can-be-excluded",
      "how-do-i-identify-small-business-suppliers",
      "what-is-the-small-business-identification-tool",
    ],
    seoTitle: "What If a Supplier Does Not Have an ABN? | PTRS",
    seoDescription:
      "Understand how suppliers without an ABN are treated in Payment Times Reporting and when assumptions about missing ABNs may be reasonable.",
  },
  {
    slug: "what-if-another-company-pays-an-invoice-on-our-behalf",
    type: "question",
    category: "Payments",
    title: "What if another company pays an invoice on our behalf?",
    shortAnswer:
      "The payment is generally reported by the entity that has the legal obligation to pay the supplier, even if another entity physically makes the payment.",
    explanation:
      "The Regulator focuses on which entity has the legal obligation to the supplier. A reporting entity may therefore need to report payments made on its behalf by an agent, broker, shared service entity or special purpose vehicle. If the third party is itself the contracting entity with the legal obligation to pay, the third party is responsible for reporting the payment if it is a reporting entity.",
    practicalNote:
      "Shared payment processes do not necessarily move the reporting obligation. When another entity makes the payment, identify which entity actually contracted with the supplier and carries the legal payment obligation.",
    searchTerms: [
      "third party payment ptrs",
      "shared services payment ptrs",
      "another company pays invoice ptrs",
      "centralised accounts payable ptrs",
      "agent pays supplier ptrs",
      "group payment centre ptrs",
      "who reports third party payment ptrs",
      "legal obligation to pay ptrs",
    ],
    alternateQuestions: [
      "Who reports an invoice if another company actually pays it?",
      "What happens when a shared services entity pays suppliers for us?",
      "Does the company making the bank payment have to report it?",
      "Who is responsible for PTRS when a third party pays the supplier?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Payments made by a Third Party",
        paragraphs: ["124", "125", "126"],
        pages: ["35"],
      },
    ],
    related: [
      "what-is-a-trade-credit-arrangement",
      "how-do-i-identify-small-business-suppliers",
    ],
    seoTitle: "What If Another Company Pays an Invoice for Us? | PTRS",
    seoDescription:
      "Learn which entity reports a payment where an agent, shared service entity or another third party pays the supplier.",
  },
  {
    slug: "how-do-i-identify-small-business-suppliers",
    type: "process",
    category: "Suppliers",
    title: "How do I identify small business suppliers for PTRS?",
    shortAnswer:
      "Prepare the Trade Credit Payment Dataset first, then run the supplier ABNs through the Small Business Identification Tool to determine which payments belong in the Small Business Trade Credit Payments Dataset.",
    explanation:
      "The TCP Dataset contains payments to Australian businesses with an ABN that meet the relevant trade credit requirements. Once that dataset has been prepared, supplier ABNs are checked using the SBI Tool. Payments to ABNs identified by the tool as small businesses must be included in the SBTCP Dataset and are then used for the relevant small-business payment-time calculations.",
    practicalNote:
      "Small-business identification comes after the trade credit population has been prepared. Do not start by filtering the entire accounts payable ledger to businesses you believe are small; first establish the correct TCP Dataset and then apply the SBI Tool.",
    searchTerms: [
      "identify small business suppliers ptrs",
      "small supplier identification ptrs",
      "small business vendor lookup ptrs",
      "which suppliers are small business ptrs",
      "small business abn check ptrs",
      "sbtcp suppliers",
      "supplier classification payment times reporting",
      "identify reportable suppliers ptrs",
      "small supplier check payment times report",
    ],
    alternateQuestions: [
      "How do I work out which suppliers are small businesses for PTRS?",
      "Which suppliers should be included in the small-business payment dataset?",
      "How do I check supplier ABNs for Payment Times Reporting?",
      "Do I identify small businesses before or after building the TCP Dataset?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Consolidation of payments",
        paragraphs: ["101", "102"],
        pages: ["28"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "SBTCP Dataset",
        paragraphs: ["163"],
        pages: ["41"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "SBTCP Dataset",
      },
    ],
    related: [
      "what-is-the-small-business-identification-tool",
      "what-if-a-supplier-does-not-have-an-abn",
      "what-is-a-trade-credit-arrangement",
    ],
    seoTitle: "How Do I Identify Small Business Suppliers for PTRS?",
    seoDescription:
      "Learn how supplier ABNs and the Small Business Identification Tool are used to create the PTRS small-business payment dataset.",
  },
  {
    slug: "what-is-the-small-business-identification-tool",
    type: "term",
    category: "Suppliers",
    title: "What is the Small Business Identification Tool?",
    shortAnswer:
      "The Small Business Identification Tool, or SBI Tool, identifies which supplier ABNs are treated as small businesses for Payment Times Reporting.",
    explanation:
      "After the Trade Credit Payment Dataset has been prepared, reporting entities run the supplier ABNs through the SBI Tool. Payments to ABNs identified as small businesses are included in the Small Business Trade Credit Payments Dataset. The Regulator also notes that the SBI Tool contains government ABNs that can assist reporting entities with excluding government payments.",
    practicalNote:
      "The SBI Tool is an identification step, not a substitute for preparing the underlying payment dataset correctly. A supplier being identified as a small business does not turn an otherwise non-reportable payment into a trade credit payment.",
    searchTerms: [
      "small business identification tool",
      "sbi tool",
      "ptrs sbi tool",
      "small business lookup ptrs",
      "small supplier lookup tool",
      "supplier abn lookup ptrs",
      "payment times small business tool",
      "small business identification ptrs",
      "sbi payment times reporting",
    ],
    alternateQuestions: [
      "What does the SBI Tool do?",
      "How do I use the Small Business Identification Tool for PTRS?",
      "Does the SBI Tool tell me which suppliers to report?",
      "Can I use the SBI Tool to identify government and small-business ABNs?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Excluded payments – Government and employee payments",
        paragraphs: ["117"],
        pages: ["34"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "SBTCP Dataset",
        paragraphs: ["163"],
        pages: ["41"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "SBI Tool",
      },
    ],
    related: [
      "how-do-i-identify-small-business-suppliers",
      "what-if-a-supplier-does-not-have-an-abn",
      "are-payments-to-government-entities-included",
    ],
    seoTitle: "What Is the Small Business Identification Tool? | PTRS",
    seoDescription:
      "Understand what the PTRS Small Business Identification Tool does and how it is used to identify small business supplier payments.",
  },
  {
    slug: "what-is-the-trade-credit-payment-dataset",
    type: "term",
    category: "Datasets",
    title: "What is the Trade Credit Payment Dataset?",
    shortAnswer:
      "The Trade Credit Payment Dataset, or TCP Dataset, is the population of payments made under trade credit arrangements by the reporting entity and its controlled entities during the reporting period.",
    explanation:
      "The TCP Dataset is the foundation for preparing a Payment Times Report. It must capture the specified information for payments made under trade credit arrangements by the reporting entity and the entities it controls. The dataset is then refined through the required exclusions and classifications before supplier ABNs are assessed using the Small Business Identification Tool.",
    practicalNote:
      "Think of the TCP Dataset as the reportable payment population before the small-business filter is applied. Getting this population right matters because the later PTRS calculations depend on it.",
    searchTerms: [
      "tcp dataset",
      "trade credit payment dataset",
      "trade credit payments dataset",
      "ptrs payment dataset",
      "ptrs transaction population",
      "payment times reporting dataset",
      "reportable payment population ptrs",
      "build tcp dataset",
    ],
    alternateQuestions: [
      "What does TCP Dataset mean in PTRS?",
      "Which payments go into the Trade Credit Payment Dataset?",
      "Is the TCP Dataset the same as the final Payment Times Report?",
      "How do I build the payment population for PTRS?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Preparing the TCP Dataset",
        paragraphs: ["127", "128", "129", "130", "131"],
        pages: ["35-36"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Datasets: In practice",
        paragraphs: ["170", "171", "172"],
        pages: ["43"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "TCP Dataset",
      },
    ],
    related: [
      "what-is-the-small-business-trade-credit-payment-dataset",
      "what-data-do-i-need-to-prepare-a-payment-times-report",
      "what-payments-can-be-excluded",
      "how-do-i-identify-small-business-suppliers",
    ],
    seoTitle: "What Is the Trade Credit Payment Dataset? | PTRS",
    seoDescription:
      "Understand what the PTRS Trade Credit Payment Dataset is, which payments it contains and how it supports a Payment Times Report.",
  },
  {
    slug: "what-is-the-small-business-trade-credit-payment-dataset",
    type: "term",
    category: "Datasets",
    title: "What is the Small Business Trade Credit Payment Dataset?",
    shortAnswer:
      "The Small Business Trade Credit Payment Dataset, or SBTCP Dataset, contains the reportable trade credit payments made to suppliers identified as small businesses for PTRS purposes.",
    explanation:
      "After preparing the TCP Dataset, the supplier ABNs are run through the Small Business Identification Tool. Payments to suppliers identified by the tool as small businesses are included in the SBTCP Dataset, subject to the applicable treatment of items such as partial payments. The SBTCP Dataset is then used for calculations including average, median, percentile payment times and payments made within terms.",
    practicalNote:
      "The SBTCP Dataset should not be built directly from the accounts payable ledger. The Regulator's process is to prepare the TCP Dataset first and then apply the small-business identification step.",
    searchTerms: [
      "sbtcp dataset",
      "small business trade credit payment dataset",
      "small business trade credit payments dataset",
      "small business payment dataset ptrs",
      "ptrs small business dataset",
      "small supplier payment population",
      "sbtcp ptrs",
      "final small business payments ptrs",
    ],
    alternateQuestions: [
      "What does SBTCP Dataset mean?",
      "Which payments belong in the small-business PTRS dataset?",
      "How is the SBTCP Dataset different from the TCP Dataset?",
      "Which dataset is used to calculate P95?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "SBTCP Dataset",
        paragraphs: ["163"],
        pages: ["41"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Calculate Payment Times – Partial payments",
        paragraphs: ["164", "165"],
        pages: ["41-42"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Datasets: In practice",
        paragraphs: ["170", "171", "172"],
        pages: ["43"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "SBTCP Dataset",
      },
    ],
    related: [
      "what-is-the-trade-credit-payment-dataset",
      "how-do-i-identify-small-business-suppliers",
      "what-is-the-small-business-identification-tool",
      "what-is-p95-in-payment-times-reporting",
    ],
    seoTitle: "What Is the SBTCP Dataset? | Payment Times Reporting",
    seoDescription:
      "Learn what the Small Business Trade Credit Payment Dataset contains and how it is used for PTRS payment-time calculations.",
  },
  {
    slug: "what-data-do-i-need-to-prepare-a-payment-times-report",
    type: "process",
    category: "Preparation",
    title: "What data do I need to prepare a Payment Times Report?",
    shortAnswer:
      "You need enough transaction, supplier and payment information to identify trade credit payments, apply the required classifications and exclusions, identify small-business suppliers and calculate payment times.",
    explanation:
      "The Regulator's guidance identifies the core information expected in the TCP and SBTCP datasets. This includes payer and payee details, ABNs, payment date and amount, whether the payment was by credit card, eInvoice capability, partial-payment status, invoice issue and receipt dates where relevant, payment terms, RCTI status, small-business identification and payment time.",
    practicalNote:
      "The data does not have to live in one perfect system. The Regulator allows entities to use multiple datasets or custom reports provided the required payments are accurately collected, classified and understood and the methodology can be reproduced.",
    searchTerms: [
      "data needed for ptrs",
      "ptrs data requirements",
      "payment times report data",
      "what fields do I need ptrs",
      "ptrs transaction data",
      "prepare payment times report",
      "payment times reporting data requirements",
      "accounts payable data ptrs",
      "ptrs required columns",
    ],
    alternateQuestions: [
      "What do I need to give someone to prepare my PTRS report?",
      "Which fields are required for Payment Times Reporting?",
      "What information should I extract from accounts payable for PTRS?",
      "Do I need one dataset to prepare a Payment Times Report?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Preparing the TCP Dataset",
        paragraphs: ["127", "128", "129", "130", "131"],
        pages: ["35-36"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Datasets: In practice",
        paragraphs: ["170", "171", "172", "173"],
        pages: ["43-44"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Final TCP Dataset",
        reference: "TCP Dataset fields",
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Final SBTCP Dataset",
        reference: "SBTCP Dataset fields",
      },
    ],
    related: [
      "what-is-the-trade-credit-payment-dataset",
      "what-is-the-small-business-trade-credit-payment-dataset",
      "how-is-payment-time-calculated",
      "which-payment-terms-should-i-use-for-ptrs",
    ],
    seoTitle: "What Data Do I Need for a Payment Times Report?",
    seoDescription:
      "See the transaction, supplier, invoice and payment data needed to prepare PTRS datasets and a Payment Times Report.",
  },
  {
    slug: "which-invoice-date-should-i-use-for-ptrs",
    type: "question",
    category: "Invoices",
    title: "Which invoice date should I use for PTRS?",
    shortAnswer:
      "If an invoice contains multiple dates that could represent the invoice date, the Regulator says to use the most recent one.",
    explanation:
      "The guidance gives the example of an invoice showing an 'invoice date' of 1 January and an 'issue date' of 3 January. The entity may use 3 January as the invoice date for reporting. The worked example similarly describes the invoice issue date as the supplier's issue date and notes that where multiple dates appear, the most recent date should be used.",
    practicalNote:
      "This matters because the invoice date can feed directly into the payment-time calculation. A consistent rule should therefore be applied to invoices that use different labels such as invoice date, issue date, billing date or date issued.",
    searchTerms: [
      "invoice date ptrs",
      "invoice issue date ptrs",
      "which invoice date payment times reporting",
      "billing date ptrs",
      "multiple invoice dates ptrs",
      "invoice date versus issue date",
      "ptrs invoice date rules",
      "date issued ptrs",
    ],
    alternateQuestions: [
      "What if an invoice has two different dates?",
      "Should I use invoice date or issue date for PTRS?",
      "What does PTRS mean by invoice issue date?",
      "Which date starts the payment-time calculation?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Invoice and receipt dates",
        paragraphs: ["142"],
        examples: ["31"],
        pages: ["38"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Invoice issue date",
      },
    ],
    related: [
      "does-the-invoice-receipt-date-affect-payment-time",
      "how-is-payment-time-calculated",
      "what-if-there-is-no-invoice",
      "which-payment-terms-should-i-use-for-ptrs",
    ],
    seoTitle: "Which Invoice Date Should I Use for PTRS?",
    seoDescription:
      "Learn which invoice date to use for Payment Times Reporting when an invoice shows multiple issue or billing dates.",
  },
  {
    slug: "does-the-invoice-receipt-date-affect-payment-time",
    type: "question",
    category: "Invoices",
    title: "Does the invoice receipt date affect payment time?",
    shortAnswer:
      "Yes, where the actual invoice receipt date has been recorded. For a normal invoice, PTRS payment time uses the shorter period calculated from invoice issue date or recorded invoice receipt date to payment date.",
    explanation:
      "The invoice receipt date only needs to be included in the TCP Dataset where it has been recorded. For payment-time calculations, a genuine recorded receipt date can shorten the measured payment time because the Regulator uses the shorter of the invoice-issue-to-payment period and the invoice-receipt-to-payment period.",
    practicalNote:
      "A system posting date is not automatically an invoice receipt date. The worked example says the receipt date should be digitally recorded and reflect when the invoice was actually received rather than when somebody later entered it into a system.",
    searchTerms: [
      "invoice receipt date ptrs",
      "invoice received date payment times reporting",
      "receipt date payment time",
      "invoice date versus receipt date ptrs",
      "ap posting date ptrs",
      "invoice received date calculation",
      "when was invoice received ptrs",
      "invoice receipt timestamp ptrs",
    ],
    alternateQuestions: [
      "Can I calculate PTRS payment time from the date we received the invoice?",
      "Is the AP posting date the same as invoice receipt date?",
      "Do I need an invoice receipt date for every PTRS transaction?",
      "What happens if we do not record when invoices are received?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Invoice and receipt dates",
        paragraphs: ["142"],
        pages: ["38"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Method to calculate payment times",
        paragraphs: ["166"],
        pages: ["42"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Invoice receipt date",
      },
    ],
    related: [
      "which-invoice-date-should-i-use-for-ptrs",
      "how-is-payment-time-calculated",
      "what-if-there-is-no-invoice",
    ],
    seoTitle: "Does Invoice Receipt Date Affect PTRS Payment Time?",
    seoDescription:
      "Understand when invoice receipt date can be used in PTRS and how it affects the calculation of payment time.",
  },
  {
    slug: "what-if-there-is-no-invoice",
    type: "question",
    category: "Invoices",
    title: "What if there is no invoice?",
    shortAnswer:
      "PTRS can still apply where there is no invoice. If there is another document demanding payment, that document can be used; otherwise payment time is measured from when the payment obligation started, which may be the supply date.",
    explanation:
      "The Regulator makes clear that its invoice guidance also applies to non-invoice payment documents. Where there is no invoice but there is a notice for payment, equivalent classifications can be applied to that notice. Where there is no invoice or other document demanding payment, payment time is calculated from the date the payment obligation commenced.",
    practicalNote:
      "Do not automatically exclude a transaction because there is no invoice number. The underlying supply and payment obligation determine whether the transaction is reportable.",
    searchTerms: [
      "no invoice ptrs",
      "payment without invoice ptrs",
      "notice for payment ptrs",
      "supplier payment no invoice",
      "no invoice payment times reporting",
      "supply date ptrs",
      "payment obligation date ptrs",
      "invoice missing ptrs",
    ],
    alternateQuestions: [
      "Can a payment be reportable if there was no invoice?",
      "How do I calculate payment time without an invoice?",
      "What date do I use when there is only a notice for payment?",
      "Does PTRS only apply to invoiced payments?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Preparing the TCP Dataset",
        reference: "Regulator Note – non-invoices",
        pages: ["35"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Method to calculate payment times",
        paragraphs: ["168", "169"],
        pages: ["42-43"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Steps 5 & 6 - SBTCP Dataset",
        reference: "Payment time where no invoice or notice for payment exists",
      },
    ],
    related: [
      "how-is-payment-time-calculated",
      "which-invoice-date-should-i-use-for-ptrs",
      "what-is-a-trade-credit-arrangement",
    ],
    seoTitle: "What If There Is No Invoice for PTRS?",
    seoDescription:
      "Learn how PTRS treats payments without invoices and which date is used to calculate payment time.",
  },
  {
    slug: "what-is-an-rcti-and-how-is-it-treated-for-ptrs",
    type: "term",
    category: "Invoices",
    title: "What is an RCTI and how is it treated for PTRS?",
    shortAnswer:
      "An RCTI is a Recipient Created Tax Invoice. PTRS applies a specific payment-time calculation to RCTIs using the RCTI issue date and payment date.",
    explanation:
      "Because the recipient rather than the supplier creates the tax invoice, RCTIs need to be identifiable separately in the TCP Dataset. The Regulator states that payment time for an RCTI is the number of calendar days between and including the RCTI issue date and the payment date.",
    practicalNote:
      "If RCTIs make up a substantial part of the payment population and the resulting payment-time metrics could be misleading without explanation, the guidance recommends using the report comments to provide context.",
    searchTerms: [
      "rcti ptrs",
      "recipient created tax invoice ptrs",
      "rcti payment time",
      "rcti payment times reporting",
      "how calculate rcti payment days",
      "recipient created invoice ptrs",
      "rcti invoice date ptrs",
    ],
    alternateQuestions: [
      "How do RCTIs work in Payment Times Reporting?",
      "Which date is used to calculate payment time for an RCTI?",
      "Do RCTIs need to be identified separately in the PTRS dataset?",
      "Does invoice receipt date apply to an RCTI?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "RCTIs",
        paragraphs: ["141"],
        pages: ["37"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Method to calculate payment times",
        paragraphs: ["167"],
        pages: ["42"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "RCTI",
      },
    ],
    related: [
      "how-is-payment-time-calculated",
      "which-invoice-date-should-i-use-for-ptrs",
      "does-the-invoice-receipt-date-affect-payment-time",
    ],
    seoTitle: "What Is an RCTI and How Is It Treated for PTRS?",
    seoDescription:
      "Understand Recipient Created Tax Invoices and the special PTRS payment-time calculation that applies to RCTIs.",
  },
  {
    slug: "which-payment-terms-should-i-use-for-ptrs",
    type: "question",
    category: "Payment terms",
    title: "Which payment terms should I use for PTRS?",
    shortAnswer:
      "Use the terms in a written contract where the contract specifies payment terms. If there is no written contract or it does not specify payment terms, use the relevant invoice or notice-for-payment terms.",
    explanation:
      "The Regulator establishes a hierarchy for determining payment terms. Written contract terms take precedence over invoice terms where they differ. Purchase orders can also establish written payment terms. If an invoice contains multiple inconsistent terms, the longer term is used. Payment terms must ultimately be expressed in calendar days.",
    practicalNote:
      "Do not assume the supplier invoice always provides the PTRS payment term. If your purchase order or contract establishes different terms, those contractual terms may be the ones that need to be reported.",
    searchTerms: [
      "payment terms ptrs",
      "contract terms versus invoice terms ptrs",
      "purchase order payment terms ptrs",
      "invoice terms payment times reporting",
      "which payment term ptrs",
      "net 30 ptrs",
      "payment terms calendar days",
      "ptrs payment terms hierarchy",
      "po terms ptrs",
    ],
    alternateQuestions: [
      "Do contract payment terms override invoice terms for PTRS?",
      "Should I use the PO terms or the supplier invoice terms?",
      "What if the invoice payment terms are different from the contract?",
      "How do I convert payment terms into calendar days?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Payment terms",
        paragraphs: ["143", "144", "145", "146", "147", "148", "149", "150"],
        examples: ["32", "33", "34", "35"],
        pages: ["38-39"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Contract/PO/Notice/Invoice payment terms",
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Glossary",
        reference: "Payment Term",
      },
    ],
    related: [
      "what-does-paid-within-terms-mean-for-ptrs",
      "how-is-payment-time-calculated",
      "which-invoice-date-should-i-use-for-ptrs",
    ],
    seoTitle: "Which Payment Terms Should I Use for PTRS?",
    seoDescription:
      "Learn whether contract, purchase order or invoice payment terms should be used when preparing a Payment Times Report.",
  },
  {
    slug: "what-does-paid-within-terms-mean-for-ptrs",
    type: "term",
    category: "Calculations",
    title: "What does paid within terms mean for PTRS?",
    shortAnswer:
      "A small-business payment is treated as paid within terms where its calculated payment time is less than or equal to its applicable payment term.",
    explanation:
      "The Payment Times Report requires the percentage of small-business payments made within terms. The Regulator calculates this using the number of payments in the SBTCP Dataset where Payment Time is less than or equal to Payment Term, divided by the total number of payments in the SBTCP Dataset.",
    practicalNote:
      "Payment time and payment term are different fields. One measures how long the payment actually took; the other represents how long the relevant agreement allowed the entity to take.",
    searchTerms: [
      "paid within terms ptrs",
      "ptrs within terms",
      "payment time versus payment term",
      "percentage paid within terms ptrs",
      "invoice paid on time ptrs",
      "ptrs payment terms performance",
      "within payment terms payment times report",
    ],
    alternateQuestions: [
      "How does PTRS decide whether an invoice was paid on time?",
      "What does percentage paid within terms mean?",
      "Is payment time the same thing as payment term?",
      "How is the within-terms percentage calculated?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Percentage of small business payment within terms",
        paragraphs: ["195"],
        pages: ["47"],
      },
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Payment terms",
        paragraphs: ["143", "144", "149", "150"],
        pages: ["38-39"],
      },
    ],
    related: [
      "which-payment-terms-should-i-use-for-ptrs",
      "how-is-payment-time-calculated",
      "what-is-p95-in-payment-times-reporting",
      "what-do-the-ptrs-payment-time-bands-mean",
    ],
    seoTitle: "What Does Paid Within Terms Mean for PTRS?",
    seoDescription:
      "Understand how PTRS determines whether small-business payments were made within their applicable payment terms.",
  },
  {
    slug: "what-is-p95-in-payment-times-reporting",
    type: "term",
    category: "Calculations",
    title: "What is P95 in Payment Times Reporting?",
    shortAnswer:
      "P95 is the 95th percentile payment time: the number of days within which 95% of the relevant small-business payments were made.",
    explanation:
      "The P95 measure is calculated using payment times in the SBTCP Dataset. If a reporting entity has a P95 of 28 days, that means 95% of the relevant payments were made within 28 days. The remaining 5% took longer.",
    practicalNote:
      "P95 focuses attention on the slower end of the payment population rather than the average experience. A relatively good average can therefore coexist with a much weaker P95.",
    searchTerms: [
      "p95 ptrs",
      "ptrs p95",
      "p95 payment times",
      "95th percentile payment time",
      "what does p95 mean",
      "p95 payment times reporting",
      "payment times p95",
      "95 percentile ptrs",
    ],
    alternateQuestions: [
      "What does P95 mean on a Payment Times Report?",
      "If my P95 is 30 days, what does that mean?",
      "Why does PTRS use the 95th percentile?",
      "Is P95 the same as average payment time?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "80th and 95th percentile payment times",
        paragraphs: ["192", "193"],
        examples: ["42"],
        pages: ["46-47"],
      },
    ],
    related: [
      "how-is-p95-calculated-for-ptrs",
      "what-do-the-ptrs-payment-time-bands-mean",
      "what-does-paid-within-terms-mean-for-ptrs",
      "how-is-payment-time-calculated",
    ],
    seoTitle: "What Is P95 in Payment Times Reporting?",
    seoDescription:
      "Understand what P95 means in PTRS and how the 95th percentile describes the slower end of small-business payment performance.",
  },
  {
    slug: "how-is-p95-calculated-for-ptrs",
    type: "process",
    category: "Calculations",
    title: "How is P95 calculated for PTRS?",
    shortAnswer:
      "P95 is calculated from the payment times in the SBTCP Dataset by finding the actual payment-time value at the 95th percentile.",
    explanation:
      "The Regulator says the 80th and 95th percentiles must be calculated using the SBTCP Dataset. The result must be an actual payment-time value found in the dataset, without averaging or interpolation. The guidance identifies tools such as Python numpy.percentile, R quantile and Excel PERCENTILE.INC, provided the resulting value is handled in accordance with that requirement.",
    practicalNote:
      "This is not simply '95% multiplied by the maximum payment time'. The payment times need to be ordered and the percentile identified from the actual distribution of payments.",
    searchTerms: [
      "calculate p95 ptrs",
      "p95 formula ptrs",
      "95th percentile formula payment times",
      "excel p95 ptrs",
      "percentile inc ptrs",
      "how calculate 95 percentile payments",
      "p95 calculation payment times reporting",
      "ptrs percentile calculation",
    ],
    alternateQuestions: [
      "What formula should I use for P95?",
      "Can I use Excel PERCENTILE.INC for PTRS?",
      "Can PTRS P95 be an interpolated value?",
      "How do I calculate the 95th percentile from payment days?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "80th and 95th percentile payment times",
        paragraphs: ["192", "193", "194"],
        examples: ["42"],
        pages: ["46-47"],
      },
    ],
    related: [
      "what-is-p95-in-payment-times-reporting",
      "how-is-payment-time-calculated",
      "what-is-the-small-business-trade-credit-payment-dataset",
      "what-do-the-ptrs-payment-time-bands-mean",
    ],
    seoTitle: "How Is P95 Calculated for PTRS?",
    seoDescription:
      "Learn how the 95th percentile payment time is calculated from the SBTCP Dataset for Payment Times Reporting.",
  },
  {
    slug: "what-do-the-ptrs-payment-time-bands-mean",
    type: "term",
    category: "Calculations",
    title: "What do the PTRS payment-time bands mean?",
    shortAnswer:
      "The Payment Times Report shows the percentage of invoices paid within 0–30 days, 31–60 days and more than 60 days.",
    explanation:
      "The Regulator requires reporting entities to calculate the percentage of the number of invoices falling into each of the three payment-time bands. The three percentages should total 100%, with a small allowance for rounding.",
    practicalNote:
      "These bands describe how payments are distributed across broad time ranges. They are different from P95, which identifies the payment-time value within which 95% of relevant payments were made.",
    searchTerms: [
      "ptrs payment bands",
      "0 30 days ptrs",
      "31 60 days ptrs",
      "over 60 days ptrs",
      "payment times reporting bands",
      "invoice payment buckets ptrs",
      "payment ageing ptrs",
      "ptrs days categories",
    ],
    alternateQuestions: [
      "What do 0–30, 31–60 and over 60 days mean in PTRS?",
      "How are invoices grouped by payment time?",
      "Do the PTRS payment bands have to add to 100%?",
      "Are the payment-time bands the same as P95?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Percentage of invoices paid within specified days",
        paragraphs: ["196"],
        pages: ["47"],
      },
    ],
    related: [
      "what-is-p95-in-payment-times-reporting",
      "how-is-p95-calculated-for-ptrs",
      "how-is-payment-time-calculated",
      "what-does-paid-within-terms-mean-for-ptrs",
    ],
    seoTitle: "What Do the PTRS 0–30, 31–60 and 60+ Day Bands Mean?",
    seoDescription:
      "Understand the PTRS payment-time bands for invoices paid within 0–30 days, 31–60 days and more than 60 days.",
  },
  {
    slug: "who-needs-to-approve-a-payment-times-report",
    type: "question",
    category: "Reporting",
    title: "Who needs to approve a Payment Times Report?",
    shortAnswer:
      "A Payment Times Report must be approved in writing by an authorised responsible member before it is submitted.",
    explanation:
      "The Regulator requires the report to identify the responsible member who approved it. Depending on the type of entity, this may be an individual member of the entity's principal governing body, a sole trustee, an administrator or another prescribed responsible member. A person holding power of attorney for an eligible responsible member may also approve the report.",
    practicalNote:
      "The approval itself does not need to be attached to the submitted report, but it must exist in writing before submission and may be reviewed by the Regulator during compliance activity.",
    searchTerms: [
      "ptrs report approval",
      "who approves payment times report",
      "responsible member ptrs",
      "director approval ptrs",
      "payment times reporting sign off",
      "who signs ptrs report",
      "written approval ptrs",
      "ptrs approver",
    ],
    alternateQuestions: [
      "Does a director have to approve the Payment Times Report?",
      "Can an employee approve a PTRS report?",
      "Does PTRS approval need to be in writing?",
      "Do I need to upload the signed approval with the report?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Contextual Information and Approvals – Report approval",
        paragraphs: ["210", "211", "212"],
        examples: ["45"],
        pages: ["49-50"],
      },
      {
        source: "Worked Example – Standard Payment Times Report",
        section: "Standard Payment Times Report",
        reference: "Approver fields",
      },
    ],
    related: [
      "what-records-should-i-keep-for-ptrs",
      "how-long-do-ptrs-records-need-to-be-kept",
      "what-data-do-i-need-to-prepare-a-payment-times-report",
    ],
    seoTitle: "Who Needs to Approve a Payment Times Report?",
    seoDescription:
      "Learn who can approve a PTRS report, when written approval is required and whether the approval must be submitted.",
  },
  {
    slug: "how-long-do-ptrs-records-need-to-be-kept",
    type: "question",
    category: "Record keeping",
    title: "How long do PTRS records need to be kept?",
    shortAnswer:
      "Information used to prepare a Payment Times Report must be retained for seven years.",
    explanation:
      "The seven-year record-keeping requirement applies to the information used to prepare the report, including the data and methods used to classify payments, assumptions and interpretations, and documentation relating to governance and approval processes.",
    practicalNote:
      "The retention requirement goes beyond keeping a copy of the submitted report. You should be able to explain how the underlying payment population, exclusions, classifications and calculations were produced.",
    searchTerms: [
      "ptrs record retention",
      "how long keep ptrs records",
      "payment times reporting records seven years",
      "ptrs seven year retention",
      "payment times report evidence retention",
      "keep ptrs data",
      "ptrs record keeping requirement",
    ],
    alternateQuestions: [
      "How many years do I need to keep PTRS records?",
      "Can I delete the working files after submitting the report?",
      "Does the seven-year rule apply to the underlying PTRS data?",
      "What evidence might the Regulator ask to review later?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Record keeping",
        paragraphs: ["227", "228", "229"],
        pages: ["53"],
      },
    ],
    related: [
      "what-records-should-i-keep-for-ptrs",
      "who-needs-to-approve-a-payment-times-report",
      "what-data-do-i-need-to-prepare-a-payment-times-report",
    ],
    seoTitle: "How Long Must PTRS Records Be Kept?",
    seoDescription:
      "Understand the seven-year PTRS record-retention requirement and which Payment Times Reporting records need to be retained.",
  },
  {
    slug: "what-records-should-i-keep-for-ptrs",
    type: "question",
    category: "Record keeping",
    title: "What records should I keep for PTRS?",
    shortAnswer:
      "Keep the underlying data, classification methodology, assumptions and interpretations, governance and approval records, and enough detail to reproduce any automated extraction or reconciliation process used to prepare the report.",
    explanation:
      "The Regulator specifically requires entities to retain the data and methods used to classify payments, assumptions and interpretations made when preparing the report, and documentation of governance and approval processes. Where automated systems or customised extraction methods are used, the entity should also retain the relevant rules, parameters and reconciliation steps.",
    practicalNote:
      "A good PTRS audit trail should allow someone who was not involved in the original preparation to understand how the submitted numbers were produced and why particular transactions were included, excluded or classified in a particular way.",
    searchTerms: [
      "ptrs records to keep",
      "ptrs audit trail",
      "payment times reporting evidence",
      "ptrs methodology documentation",
      "ptrs reconciliation records",
      "ptrs working papers",
      "payment times report supporting documents",
      "ptrs audit evidence",
      "ptrs data lineage",
    ],
    alternateQuestions: [
      "What supporting evidence should I retain for a Payment Times Report?",
      "Do I need to document PTRS assumptions and exclusions?",
      "What should be in a PTRS audit trail?",
      "Do automated PTRS processes need to be documented?",
    ],
    sourceReferences: [
      {
        source: "Payment Times Reporting Guidance Materials",
        section: "Record keeping",
        paragraphs: ["227", "228", "229"],
        pages: ["53"],
      },
    ],
    related: [
      "how-long-do-ptrs-records-need-to-be-kept",
      "who-needs-to-approve-a-payment-times-report",
      "what-is-the-trade-credit-payment-dataset",
      "what-data-do-i-need-to-prepare-a-payment-times-report",
    ],
    seoTitle: "What Records Should I Keep for PTRS?",
    seoDescription:
      "See what data, methodology, assumptions, approvals and reconciliation evidence should be retained to support a Payment Times Report.",
  },
];

export default ptrsGuidanceContent;
