import CustomerRegister from "../features/customers/CustomerRegister";
import PulseLanding from "../features/pulseLanding/PulseLanding";
import PulsePricing from "../features/pulseLanding/PulsePricing";
import PulseMaximiser from "../features/pulseLanding/PulseMaximiserWidget";

// Publicly available
import Contact from "../components/forms/Contact";
import PublicComplianceNavigator from "../solutions/ptrs/PublicComplianceNavigator";
import PTRSolution from "../solutions/ptrs/PTRSolution";
import ResourcePage from "../solutions/ptrs/ResourcePage";
import { SubmissionChecklistViewer } from "../solutions/ptrs/SubmissionChecklistViewer";

// Policy documents
import ClientServiceAgreement from "../components/policies/ClientServiceAgreement";
import PrivacyPolicy from "../components/policies/PrivacyPolicy";

// Static page viewer
import StaticPageViewer from "../components/shared/StaticPageViewer";

// PTRS
// Testing pdf email
import TestPdfEmail from "../solutions/ptrs/TestPdfEmail";

import ForgotPassword from "../features/users/ForgotPassword";
import ResetPassword from "../features/users/ResetPassword";
import Login from "../features/users/Login";
import GettingStartedPage from "../solutions/ptrs/GettingStarted";
import FAQ from "../solutions/ptrs/FAQ";
import Booking from "../components/forms/Booking";
import ContactThankyou from "../components/forms/ContactThankyou";
import BookingThankyou from "../components/forms/BookingThankyou";
import BlogIndex from "../routes/BlogIndex";
import LegalDisclaimer from "../components/policies/LegalDisclaimer";
import VerifyEmail from "../features/users/VerifyEmail";
import FirstUserRegister from "../features/users/FirstUserRegister";
// import PtrsPriceTier:PriceTier from "../components/ptrs/PriceTier";
import SignUp from "../components/forms/SignUp";
import SignUpThankyou from "../components/forms/SignUpThankyou";
import CompNavThankyou from "../components/forms/CompNavThankyou";

// CaaS
import LandingPage from "../components/static/LandingPage";
import PriceTier from "../components/pricing/PriceTier";

// Solutions
import Solutions from "../solutions/Solutions";

// Products
import ModernSlavery from "../solutions/ms/ModernSlavery";
import WhistleBlower from "../solutions/wb/WhistleBlower";
import DirectorObligations from "../solutions/do/DirectorObligations";
import RiskRegister from "../solutions/rr/RiskRegister";
import WorkingCapitalAnalysis from "../solutions/wc/WorkingCapitalAnalysis";
import ESGReporting from "../solutions/esg/ESGReporting";

// TODO: add Testimonials component
// import Testimonials from "../components/common/Testimonials";
import About from "../components/static/About";
import PartnersLanding from "../components/partners/PartnersLanding";
import PartnerModernSlavery from "../components/partners/products/ModernSlavery";
import PartnerLayout from "../components/partners/PartnerLayout";
import PulseJoin from "../features/pulseLanding/PulseJoin";

const isPublicOnlyMode =
  String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

const allPublicRoutes = [
  { path: "/", Component: LandingPage },
  { path: "/pricing", Component: PriceTier },
  { path: "/pulse", Component: PulseLanding },
  { path: "/pulse/pricing", Component: PulsePricing },
  { path: "/pulse/join", Component: PulseJoin },
  { path: "/pulse/maximiser", Component: PulseMaximiser },
  {
    path: "/customers/register",
    Component: CustomerRegister,
  },
  { path: "/customers/register-first-user", Component: FirstUserRegister },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "compliance-navigator",
    Component: PublicComplianceNavigator,
  },
  { path: "thankyou-compliance-navigator", Component: CompNavThankyou },
  {
    path: "contact",
    Component: Contact,
  },
  {
    path: "blog/:slug",
    Component: StaticPageViewer,
  },
  {
    path: "blog",
    Component: BlogIndex,
  },
  {
    path: "thankyou-contact",
    Component: ContactThankyou,
  },
  {
    path: "ptr-solution",
    Component: PTRSolution,
  },
  {
    path: "test-pdf-email",
    Component: TestPdfEmail,
  },
  {
    path: "overview",
    Component: GettingStartedPage,
  },
  {
    path: "faq",
    Component: FAQ,
  },
  {
    path: "booking",
    Component: Booking,
  },
  {
    path: "resources",
    Component: ResourcePage,
  },
  {
    path: "resources/submission-checklist",
    Component: SubmissionChecklistViewer,
  },
  {
    path: "thankyou-booking",
    Component: BookingThankyou,
  },
  { path: "pricing", Component: PriceTier },
  { path: "/signup", Component: SignUp },
  { path: "thankyou-signup", Component: SignUpThankyou },
  { path: "about", Component: About },
  // Policy documents
  {
    path: "policy-documents/client-service-agreement",
    Component: ClientServiceAgreement,
  },
  {
    path: "policy-documents/privacy-policy",
    Component: PrivacyPolicy,
  },
  {
    path: "policy-documents/legal",
    Component: LegalDisclaimer,
  },
  {
    path: "/user/verify-email",
    Component: VerifyEmail,
  },
  {
    path: "/user/forgot-password",
    Component: ForgotPassword,
  },

  // Solutions
  { path: "/solutions", Component: Solutions },

  // Products
  { path: "/user/reset-password", Component: ResetPassword },
  { path: "payment-times-reporting", Component: PTRSolution },
  { path: "modern-slavery", Component: ModernSlavery },
  { path: "whistleblower-compliance", Component: WhistleBlower },
  { path: "director-obligations", Component: DirectorObligations },
  { path: "risk-register", Component: RiskRegister },
  { path: "working-capital", Component: WorkingCapitalAnalysis },
  { path: "esg-reporting", Component: ESGReporting },
  {
    path: "partners",
    Component: PartnerLayout,
    children: [
      {
        index: true,
        Component: PartnersLanding,
      },
      {
        path: "products/modern-slavery",
        Component: PartnerModernSlavery,
      },
    ],
  },
];

const launchPublicRoutes = [
  { path: "/pulse", Component: PulseLanding },
  { path: "/pulse/pricing", Component: PulsePricing },
  { path: "/pulse/join", Component: PulseJoin },
  { path: "/pulse/maximiser", Component: PulseMaximiser },
  {
    path: "compliance-navigator",
    Component: PublicComplianceNavigator,
  },
  { path: "thankyou-compliance-navigator", Component: CompNavThankyou },
  {
    path: "contact",
    Component: Contact,
  },
  {
    path: "blog/:slug",
    Component: StaticPageViewer,
  },
  {
    path: "blog",
    Component: BlogIndex,
  },
  {
    path: "thankyou-contact",
    Component: ContactThankyou,
  },
  {
    path: "payment-times-reporting",
    Component: PTRSolution,
  },
  {
    path: "overview",
    Component: GettingStartedPage,
  },
  {
    path: "faq",
    Component: FAQ,
  },
  {
    path: "booking",
    Component: Booking,
  },
  {
    path: "resources",
    Component: ResourcePage,
  },
  {
    path: "resources/submission-checklist",
    Component: SubmissionChecklistViewer,
  },
  {
    path: "thankyou-booking",
    Component: BookingThankyou,
  },
  { path: "thankyou-signup", Component: SignUpThankyou },
  { path: "about", Component: About },
  // Policy documents
  {
    path: "policy-documents/client-service-agreement",
    Component: ClientServiceAgreement,
  },
  {
    path: "policy-documents/privacy-policy",
    Component: PrivacyPolicy,
  },
  {
    path: "policy-documents/legal",
    Component: LegalDisclaimer,
  },
  { path: "modern-slavery", Component: ModernSlavery },
  { path: "whistleblower-compliance", Component: WhistleBlower },
  { path: "director-obligations", Component: DirectorObligations },
  { path: "risk-register", Component: RiskRegister },
  { path: "working-capital", Component: WorkingCapitalAnalysis },
  { path: "esg-reporting", Component: ESGReporting },
  // Super secret routes for boss access
  {
    path: "/bossmode",
    children: [{ path: "login", Component: Login }],
  },
];

export const publicRoutes = isPublicOnlyMode
  ? launchPublicRoutes
  : allPublicRoutes;
