// Boss admin nested routes under /app/boss (route-object config)
import { Navigate } from "react-router";
import CustomerAdminPage from "slices/customers/CustomerAdminPage";
import CustomerEntitlementsPage from "slices/customers/CustomerEntitlementsPage";
import CustomerProfilesPage from "slices/customers/profiles/CustomerProfilesPage";

const bossRoutes = [
  // /app/boss -> redirect to /app/boss/customers
  { index: true, element: <Navigate to="/app/boss/customers" replace /> },

  { path: "customers", Component: CustomerAdminPage },
  {
    path: "customers/:customerId/entitlements",
    Component: CustomerEntitlementsPage,
  },
  { path: "customers/:customerId/profiles", Component: CustomerProfilesPage },

  // Catch-all under /app/boss -> send back to customers
  { path: "*", element: <Navigate to="/app/boss/customers" replace /> },
];

export default bossRoutes;
