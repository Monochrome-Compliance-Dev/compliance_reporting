// Industry pages
import Industries from "slices/marketing/industries/Industries";
import ConstructionPaymentReporting from "slices/marketing/construction/ConstructionPaymentReporting";
import ConstructionPaymentDiagnostic from "slices/marketing/construction/ConstructionPaymentDiagnostic";
import PaymentTimesReportingPrint from "slices/marketing/ptrs/PaymentTimesReporting.print";

// Insights
import IndustryInsights from "slices/marketing/insights/IndustryInsights";
import BlogIndex from "slices/marketing/insights/blog/BlogIndex";
import BlogPostPage from "slices/marketing/insights/blog/BlogPostPage";
import KnowledgeIndex from "slices/marketing/insights/knowledge/KnowledgeIndex";
import KnowledgeArticlePage from "slices/marketing/insights/knowledge/KnowledgeArticlePage";

// Service pages
import Services from "slices/marketing/services/Services";
import PaymentHealthCheck from "slices/marketing/services/PaymentHealthCheck";
import PaymentTimesReporting from "slices/marketing/ptrs/PaymentTimesReporting";

// Public pages
import { About } from "slices/public/static";
import { Contact, ContactThankyou } from "slices/public/forms";
import PriceTier from "slices/marketing/pricing/PriceTier";

// App routes
import Login from "slices/users/components/Login";
import ForgotPassword from "slices/users/components/ForgotPassword";
import ResetPassword from "slices/users/components/ResetPassword";
import VerifyEmail from "slices/users/components/VerifyEmail";

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

  // Industry pages
  { path: "industries", Component: Industries },
  {
    path: "industries/construction/payment-reporting",
    Component: ConstructionPaymentReporting,
  },
  {
    path: "industries/construction/payment-diagnostic",
    Component: ConstructionPaymentDiagnostic,
  },

  // Utility pages
  {
    path: "payment-times-reporting-print",
    Component: PaymentTimesReportingPrint,
  },

  // Insights
  { path: "insights", Component: IndustryInsights },
  { path: "insights/blog", Component: BlogIndex },
  { path: "insights/blog/:slug", Component: BlogPostPage },
  { path: "insights/knowledge", Component: KnowledgeIndex },
  { path: "insights/knowledge/:slug", Component: KnowledgeArticlePage },

  // Service pages
  { path: "services", Component: Services },
  {
    path: "services/payment-health-check",
    Component: PaymentHealthCheck,
  },
  {
    path: "services/payment-times-reporting",
    Component: PaymentTimesReporting,
  },

  // Public pages
  { path: "about", Component: About },

  // Public forms
  { path: "contact", Component: Contact },
  { path: "thankyou-contact", Component: ContactThankyou },

  { path: "pricing", Component: PriceTier },
];
