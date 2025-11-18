// src/v2/routes/bossRoutes.js
// Boss admin nested routes under /v2/boss
import { Route, Navigate } from "react-router";
import CustomerAdminPage from "../customers/CustomerAdminPage";
import CustomerEntitlementsPage from "../customers/CustomerEntitlementsPage";

export function getBossRoutes() {
  return (
    <>
      {/* /v2/boss -> redirect to /v2/boss/customers */}
      <Route index element={<Navigate to="/v2/boss/customers" replace />} />
      <Route path="customers" element={<CustomerAdminPage />} />
      <Route
        path="customers/:customerId/entitlements"
        element={<CustomerEntitlementsPage />}
      />
      {/* Catch-all under /v2/boss -> send back to customers */}
      <Route path="*" element={<Navigate to="/v2/boss/customers" replace />} />
    </>
  );
}
