import PaymentTimesReporting from "slices/marketing/ptrs/PaymentTimesReporting";
import PaymentTimesReportingPrint from "slices/marketing/ptrs/PaymentTimesReporting.print";
import ConstructionPaymentReporting from "slices/marketing/construction/ConstructionPaymentReporting";
import IndustryInsights from "slices/marketing/insights/IndustryInsights";
import { Contact, ContactThankyou } from "slices/public/forms";
import { About } from "slices/public/static";
import Login from "slices/users/components/Login";
import ForgotPassword from "slices/users/components/ForgotPassword";
import ResetPassword from "slices/users/components/ResetPassword";
import VerifyEmail from "slices/users/components/VerifyEmail";

export const publicRoutes = [
  {
    path: "login",
    Component: Login,
  },
  {
    path: "forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "reset-password",
    Component: ResetPassword,
  },
  {
    path: "verify",
    Component: VerifyEmail,
  },
  {
    path: "contact",
    Component: Contact,
  },
  {
    path: "thankyou-contact",
    Component: ContactThankyou,
  },
  { path: "about", Component: About },
  { path: "payment-times-reporting", Component: PaymentTimesReporting },
  {
    path: "construction-payment-reporting",
    Component: ConstructionPaymentReporting,
  },
  {
    path: "insights",
    Component: IndustryInsights,
  },
  {
    path: "payment-times-reporting-print",
    Component: PaymentTimesReportingPrint,
  },
];
