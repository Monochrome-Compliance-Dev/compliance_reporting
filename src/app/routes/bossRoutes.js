// Boss admin nested routes under /app/boss (route-object config)
import { Navigate } from "react-router";

import CustomersListPage from "slices/customers/CustomersListPage";
import usersRoutes from "slices/users/usersRouteConfig";

const bossRoutes = [
  // /app/boss
  { index: true, element: <Navigate to="customers" replace /> },

  // /app/boss/customers
  { path: "customers", Component: CustomersListPage },

  { path: "users", children: usersRoutes },

  // Catch-all under /app/boss
  { path: "*", element: <Navigate to="customers" replace /> },
];

export default bossRoutes;
