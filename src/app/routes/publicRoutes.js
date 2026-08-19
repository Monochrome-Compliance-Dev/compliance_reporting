import PaymentTimesReporting from "slices/marketing/ptrs/PaymentTimesReporting";
import PaymentHealthCheck from "slices/marketing/services/PaymentHealthCheck";
import { PricingPage } from "slices/marketing/pricing/PricingPage";
import PaymentTimesReportingPrint from "slices/marketing/ptrs/PaymentTimesReporting.print";
import ConstructionPaymentReporting from "slices/marketing/construction/ConstructionPaymentReporting";
import IndustryInsights from "slices/marketing/insights/IndustryInsights";
import PaymentTimesExplorerLaunch from "slices/marketing/insights/PaymentTimesExplorerLaunch";
import Services from "slices/marketing/services/Services";
import Industries from "slices/marketing/industries/Industries";
import KnowledgeIndex from "slices/marketing/insights/knowledge/KnowledgeIndex";
import KnowledgeArticlePage from "slices/marketing/insights/knowledge/KnowledgeArticlePage";
import BlogIndex from "slices/marketing/insights/blog/BlogIndex";
import BlogPostPage from "slices/marketing/insights/blog/BlogPostPage";
import { Contact, ContactThankyou } from "slices/public/forms";
import { About } from "slices/public/static";
import Login from "slices/users/components/Login";
import ForgotPassword from "slices/users/components/ForgotPassword";
import ResetPassword from "slices/users/components/ResetPassword";
import VerifyEmail from "slices/users/components/VerifyEmail";
import ConstructionPaymentDiagnostic from "slices/marketing/construction/ConstructionPaymentDiagnostic";
import RegulatorPaymentTimesSearchPage from "slices/marketing/regulatorPaymentTimes/RegulatorPaymentTimesSearchPage";
import RegulatorPaymentTimesCompanyPage from "slices/marketing/regulatorPaymentTimes/RegulatorPaymentTimesCompanyPage";
import RegulatorPaymentTimesIndustryPage from "slices/marketing/regulatorPaymentTimes/RegulatorPaymentTimesIndustryPage";
import RegulatorPaymentTimesIndustryDetailPage from "slices/marketing/regulatorPaymentTimes/RegulatorPaymentTimesIndustryDetailPage";
import PtrsGuidanceIndex from "slices/marketing/ptrsGuidance/PtrsGuidanceIndex";
import PtrsGuidancePage from "slices/marketing/ptrsGuidance/PtrsGuidancePage";

const isPublicOnlyMode =
  String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

export const publicRoutes = [
  ...(isPublicOnlyMode
    ? []
    : [
        { path: "login", Component: Login },
        { path: "forgot-password", Component: ForgotPassword },
        { path: "reset-password", Component: ResetPassword },
        { path: "verify", Component: VerifyEmail },
      ]),
  { path: "contact", Component: Contact },
  { path: "thankyou-contact", Component: ContactThankyou },
  { path: "about", Component: About },
  { path: "services", Component: Services },
  { path: "industries", Component: Industries },
  { path: "payment-times-reporting", Component: PaymentTimesReporting },
  { path: "payment-health-check", Component: PaymentHealthCheck },
  { path: "pricing", Component: PricingPage },
  {
    path: "construction-payment-reporting",
    Component: ConstructionPaymentReporting,
  },
  {
    path: "construction-payment-diagnostic",
    Component: ConstructionPaymentDiagnostic,
  },
  { path: "insights/blog", Component: BlogIndex },
  { path: "insights/blog/:slug", Component: BlogPostPage },
  { path: "insights/knowledge", Component: KnowledgeIndex },
  {
    path: "insights/knowledge/:slug",
    Component: KnowledgeArticlePage,
  },
  {
    path: "insights/payment-times-explorer",
    Component: PaymentTimesExplorerLaunch,
  },
  { path: "insights", Component: IndustryInsights },
  { path: "ptrs-guidance", Component: PtrsGuidanceIndex },
  { path: "ptrs-guidance/:slug", Component: PtrsGuidancePage },
  {
    path: "payment-times-reporting-print",
    Component: PaymentTimesReportingPrint,
  },
  {
    path: "regulator-payment-times",
    Component: RegulatorPaymentTimesSearchPage,
  },
  {
    path: "regulator-payment-times/industries",
    Component: RegulatorPaymentTimesIndustryPage,
  },
  {
    path: "regulator-payment-times/industry/:industrySlug",
    Component: RegulatorPaymentTimesIndustryDetailPage,
  },
  {
    path: "regulator-payment-times/:companySlug",
    Component: RegulatorPaymentTimesCompanyPage,
  },
];
