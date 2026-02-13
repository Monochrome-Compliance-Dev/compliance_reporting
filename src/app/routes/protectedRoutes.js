import { Outlet } from "react-router";
import Landing from "app/Landing";
import { RequireRoles } from "./RequireRoles";
import Role from "context/role";
import ptrsRoutes from "slices/ptrs/ptrsRouteConfig";
import { PtrsProvider } from "slices/ptrs/context/PtrsContext";

function ProtectedAppLayout() {
  return (
    <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
      <Outlet />
    </RequireRoles>
  );
}

function PtrsRouteProvider() {
  return (
    <PtrsProvider>
      <Outlet />
    </PtrsProvider>
  );
}

export const protectedRoutes = [
  {
    path: "app",
    Component: ProtectedAppLayout,
    children: [
      { index: true, Component: Landing },
      {
        path: "ptrs",
        Component: PtrsRouteProvider,
        children: ptrsRoutes,
      },
    ],
  },
];
