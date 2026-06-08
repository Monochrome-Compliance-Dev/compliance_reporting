import WhatDoesTheBottom20PercentMean from "./articles/what-does-the-bottom-20-percent-mean";
import WhatIsPTRS from "./articles/what-is-ptrs";
import WhatIsP95 from "./articles/what-is-p95";
import WhatDoesAP95Of30DaysMean from "./articles/what-does-a-p95-of-30-days-mean";

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
  {
    slug: "what-does-a-p95-of-30-days-mean",
    title: "What does a P95 of 30 days mean?",
    description:
      "A practical explanation of what a P95 result of 30 days means and why it has become an important benchmark for payment behaviour reporting.",
    category: "Payment metrics",
    Component: WhatDoesAP95Of30DaysMean,
  },
  {
    slug: "what-does-the-bottom-20-percent-mean",
    title: "What does the bottom 20% mean?",
    description:
      "A practical explanation of how the regulator compares payment performance within industry groups and what the bottom 20% actually represents.",
    category: "Regulator focus",
    Component: WhatDoesTheBottom20PercentMean,
  },
];
