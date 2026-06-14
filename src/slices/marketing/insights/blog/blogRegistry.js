import PaymentReportingProblemsAreDataArchitectureProblems from "./posts/payment-reporting-problems-are-data-architecture-problems";
import WhySopaComplianceDoesntGuaranteeStrongPtrsResults from "./posts/why-sopa-compliance-doesnt-guarantee-strong-ptrs-results";
import RetentionsAndPaymentReportingDistortions from "./posts/retentions-and-payment-reporting-distortions";
import HowWeeklyPaymentRunsDistortPaymentMetrics from "./posts/how-weekly-payment-runs-distort-payment-metrics";
import OperationalDelayVsBehaviouralDelay from "./posts/operational-delay-vs-behavioural-delay";

export const blogPosts = [
  {
    slug: "operational-delay-vs-behavioural-delay",
    title: "Operational Delay vs Behavioural Delay",
    dateISO: "2026-06-15",
    description:
      "Understanding the difference between operational delay and behavioural delay is critical when interpreting deteriorating payment metrics.",
    tags: ["PTRS", "Payment Behaviour", "P95", "Operations"],
    Component: OperationalDelayVsBehaviouralDelay,
  },
  {
    slug: "how-weekly-payment-runs-distort-payment-metrics",
    title: "How Weekly Payment Runs Distort Payment Metrics",
    dateISO: "2026-06-08",
    description:
      "Weekly payment runs often make operational sense, but they can quietly add elapsed reporting time and materially affect reported payment outcomes.",
    tags: ["PTRS", "Payment Behaviour", "P95", "Operations"],
    Component: HowWeeklyPaymentRunsDistortPaymentMetrics,
  },
  {
    slug: "retentions-and-payment-reporting-distortions",
    title: "How retentions can distort payment reporting metrics",
    dateISO: "2026-03-11",
    description:
      "Retention structures are common in construction, yet they can introduce timing patterns in payment data that produce unexpected outcomes in payment reporting metrics.",
    tags: ["Construction", "PTRS", "Payment data"],
    Component: RetentionsAndPaymentReportingDistortions,
  },
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
