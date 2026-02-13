import PaymentTimesReporting from "slices/marketing/ptrs/PaymentTimesReporting";
import PaymentTimesReportingPrint from "slices/marketing/ptrs/PaymentTimesReporting.print";
import { Contact, ContactThankyou } from "slices/public/forms";
import { About } from "slices/public/static";
import Login from "slices/users/Login";

export const publicRoutes = [
  {
    path: "login",
    Component: Login,
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
    path: "payment-times-reporting-print",
    Component: PaymentTimesReportingPrint,
  },
];
