import WhatIsPTRS from "./articles/what-is-ptrs";
import WhatIsP95 from "./articles/what-is-p95";

export const knowledgeArticles = [
  {
    slug: "what-is-the-payment-times-reporting-scheme",
    title: "What is the Payment Times Reporting Scheme?",
    description:
      "A plain-English overview of the PTRS, why it exists, and why payment transparency matters for large reporting entities and small business suppliers.",
    category: "PTRS fundamentals",
    Component: WhatIsPTRS,
  },
  {
    slug: "what-is-p95",
    title: "What is P95?",
    description:
      "A practical explanation of P95 payment performance and why it has become one of the most important measures in payment behaviour reporting.",
    category: "Payment metrics",
    Component: WhatIsP95,
  },
];
