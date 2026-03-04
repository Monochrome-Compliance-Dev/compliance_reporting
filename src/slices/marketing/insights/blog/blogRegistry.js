import PaymentReportingProblemsAreDataArchitectureProblems from "./posts/payment-reporting-problems-are-data-architecture-problems";
import WhySopaComplianceDoesntGuaranteeStrongPtrsResults from "./posts/why-sopa-compliance-doesnt-guarantee-strong-ptrs-results";

export const blogPosts = [
  {
    slug: "why-sopa-compliance-doesnt-guarantee-strong-ptrs-results",
    title:
      "Why Security of Payment compliance doesn’t guarantee strong PTRS results in construction",
    dateISO: "2026-03-03",
    description:
      "Security of Payment and Payment Times Reporting measure different clocks. In construction, progress claims and approval cycles can make those clocks diverge.",
    tags: ["Construction", "PTRS", "Security of Payment", "Payment data"],
    Component: WhySopaComplianceDoesntGuaranteeStrongPtrsResults,
  },
  {
    slug: "payment-reporting-problems-are-data-architecture-problems",
    title:
      "When payment reporting problems are actually data architecture problems",
    dateISO: "2026-03-04",
    description:
      "Payment reporting outcomes are often determined long before reports are prepared. In many cases the real issue sits in the architecture of the underlying payment data.",
    tags: ["PTRS", "Payment data", "Reporting", "Compliance"],
    Component: PaymentReportingProblemsAreDataArchitectureProblems,
  },
];
