import RequireRoles from "./RequireRoles";
import Role from "../context/role";
import { ReportProvider } from "../context/ReportContext";
import { TcpProvider } from "../context/TcpContext";

import Dashboard from "../features/users/Dashboard";
import AdminDashboard from "../features/users/AdminDashboard";
import BossDashboard from "../features/boss/BossDashboard";

import UsersLayout from "../features/users/UsersLayout";
import Users from "../features/users/Users";
import CreateUser from "../features/users/CreateUser";

import Clients from "../features/clients/Clients";
import ClientRegister from "../features/clients/ClientRegister";

import ReportsLayout from "../features/reports/ReportsLayout";
import ReportWizard from "../features/reports/ptrs/ReportWizard";
import ConnectExternalSystems from "../features/reports/ptrs/ConnectExternalSystems";
import XeroSelection from "../features/reports/ptrs/XeroSelection";
import XeroConnectProgress from "../features/reports/ptrs/XeroConnectProgress";
import StepsOverview from "../features/reports/ptrs/StepsOverview";
import ReportErrorBoundary from "../components/navigation/ReportErrorBoundary";

import DataLayout from "../features/data/DataLayout";
import DataConsole from "../features/data/DataConsole";
import DataErrorBoundary from "../components/navigation/DataErrorBoundary";

import EsgDashboard from "../features/esg/EsgDashboard";
import EsgReportingPeriod from "../features/esg/EsgReportingPeriod";

export const protectedRoutes = [
  {
    path: "/dashboard",
    element: (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <Dashboard />
      </RequireRoles>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireRoles allowed={[Role.Admin, Role.Boss]}>
        <AdminDashboard />
      </RequireRoles>
    ),
    children: [
      {
        path: "users",
        element: <UsersLayout />,
        children: [
          {
            index: true,
            element: <Users />,
          },
          {
            path: "create",
            element: <CreateUser />,
          },
        ],
      },
    ],
  },
  {
    path: "/boss",
    element: (
      <RequireRoles allowed={[Role.Boss]}>
        <BossDashboard />
      </RequireRoles>
    ),
    children: [
      {
        path: "clients",
        children: [
          { index: true, element: <Clients /> },
          { path: "register", element: <ClientRegister /> },
        ],
      },
      {
        path: "content",
        children: [
          {
            path: "faq",
            element: require("../features/admin/content/EditFaq").default,
          },
          {
            path: "blog/:slug",
            element: require("../features/admin/content/EditBlog").default,
          },
        ],
      },
    ],
  },
  {
    path: "/reports",
    element: (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Audit, Role.Boss]}>
        <ReportProvider>
          <ReportsLayout />
        </ReportProvider>
      </RequireRoles>
    ),
    errorElement: <ReportErrorBoundary />,
    children: [
      { path: ":code/:reportId", element: <ReportWizard /> },
      { path: ":code/:reportId/connect", element: <ConnectExternalSystems /> },
      { path: ":code/:reportId/selection", element: <XeroSelection /> },
      { path: ":code/:reportId/progress", element: <XeroConnectProgress /> },
      { path: "steps", element: <StepsOverview /> },
    ],
  },
  {
    path: "/data",
    element: (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <TcpProvider>
          <DataLayout />
        </TcpProvider>
      </RequireRoles>
    ),
    errorElement: <DataErrorBoundary />,
    children: [{ path: ":code/console", element: <DataConsole /> }],
  },
  {
    path: "/esg",
    element: (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <EsgDashboard />
      </RequireRoles>
    ),
  },
  {
    path: "/esg/:reportingPeriodId",
    element: (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <EsgReportingPeriod />
      </RequireRoles>
    ),
  },
];
