import { Outlet } from "react-router";
import Landing from "app/Landing";
import { RequireRoles } from "./RequireRoles";
import Role from "context/role";
import ptrsRoutes from "slices/ptrs/ptrsRouteConfig";
import Ptrs from "slices/ptrs/Ptrs";
import ComplianceDashboardLayout from "shared/layouts/ComplianceDashboardLayout";
import BossLayout from "app/boss/BossLayout";
import bossRoutes from "./bossRoutes";
import PlatformFoundationPage from "platform/shell/PlatformFoundationPage";
import PlatformDataUploadPage from "platform/data/PlatformDataUploadPage";
import TransformationWorkspacePage from "platform/transformation/TransformationWorkspacePage";

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
        path: "platform",
        Component: PlatformFoundationPage,
      },
      {
        path: "platform/data",
        Component: PlatformDataUploadPage,
      },
      {
        path: "platform/transformation",
        Component: TransformationWorkspacePage,
      },
      {
        path: "boss",
        Component: BossLayout,
        children: bossRoutes,
      },
    ],
  },
];
