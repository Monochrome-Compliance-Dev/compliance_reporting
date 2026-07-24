import { Outlet } from "react-router";
import Landing from "app/Landing";
import { RequireRoles } from "./RequireRoles";
import Role from "context/role";
import ptrsRoutes from "slices/ptrs/ptrsRouteConfig";
import Ptrs from "slices/ptrs/Ptrs";
import DataHub from "slices/dataHub/DataHub";
import dataHubRoutes from "slices/dataHub/dataHubRouteConfig";
import ComplianceDashboardLayout from "shared/layouts/ComplianceDashboardLayout";
import BossLayout from "app/boss/BossLayout";
import bossRoutes from "./bossRoutes";

function ProtectedAppLayout() {
  return (
    <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
      <ComplianceDashboardLayout>
        <Outlet />
      </ComplianceDashboardLayout>
    </RequireRoles>
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
        Component: Ptrs,
        children: ptrsRoutes,
      },
      {
        path: "data-hub",
        Component: DataHub,
        children: dataHubRoutes,
      },
      {
        path: "boss",
        Component: BossLayout,
        children: bossRoutes,
      },
    ],
  },
];
