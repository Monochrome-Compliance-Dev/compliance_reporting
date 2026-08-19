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
];

export default ptrsGuidanceContent;
