import ClientRegister from "../features/clients/ClientRegister";

// Publicly available
import Contact from "../components/common/Contact";
import PublicComplianceNavigator from "../solutions/ptrs/PublicComplianceNavigator";
import PTRSolution from "../solutions/ptrs/PTRSolution";
import ResourcePage from "../solutions/ptrs/ResourcePage";
import { SubmissionChecklistViewer } from "../solutions/ptrs/SubmissionChecklistViewer";

// Policy documents
import ClientServiceAgreement from "../components/policies/ClientServiceAgreement";
import PrivacyPolicy from "../components/policies/PrivacyPolicy";

// Static page viewer
import StaticPageViewer from "../components/StaticPageViewer";

// PTRS
// Testing pdf email
import TestPdfEmail from "../solutions/ptrs/TestPdfEmail";

import ForgotPassword from "../features/users/ForgotPassword";
import ResetPassword from "../features/users/ResetPassword";
import Login from "../features/users/Login";
import GettingStartedPage from "../solutions/ptrs/GettingStarted";
import FAQ from "../solutions/ptrs/FAQ";
import Booking from "../components/common/Booking";
import ContactThankyou from "../components/common/ContactThankyou";
import BookingThankyou from "../components/common/BookingThankyou";
import BlogIndex from "../routes/BlogIndex";
import LegalDisclaimer from "../components/policies/LegalDisclaimer";
import VerifyEmail from "../features/users/VerifyEmail";
import FirstUserRegister from "../features/users/FirstUserRegister";
// import PtrsPriceTier:PriceTier from "../components/ptrs/PriceTier";
import SignUp from "../components/common/SignUp";
import SignUpThankyou from "../components/common/SignUpThankyou";
import CompNavThankyou from "../components/common/CompNavThankyou";

// CaaS
import LandingPage from "../components/common/LandingPage";
import PriceTier from "../components/common/PriceTier";

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
import About from "../components/common/About";

const isPublicOnlyMode = process.env.REACT_APP_PUBLIC_ONLY === "false";

const allPublicRoutes = [
  { path: "/", Component: LandingPage },
  { path: "/pricing", Component: PriceTier },
  {
    path: "/clients/register",
    Component: ClientRegister,
  },
  { path: "/clients/register-first-user", Component: FirstUserRegister },
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
];

const launchPublicRoutes = [
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
