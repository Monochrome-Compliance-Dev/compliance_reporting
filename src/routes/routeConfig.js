import RequireRoles from "./RequireRoles";
import Role from "../context/role";
import { PtrsProvider, TcpProvider } from "../context/";
import ComplianceDashboardLayout from "../components/layouts/ComplianceDashboardLayout";
import { Outlet } from "react-router";

import Dashboard from "../features/users/Dashboard";
import AdminDashboard from "../features/users/AdminDashboard";
import BossDashboard from "../features/boss/BossDashboard";

import UsersLayout from "../features/users/UsersLayout";
import Users from "../features/users/Users";
import CreateUser from "../features/users/CreateUser";

import Clients from "../features/clients/Clients";
import ClientRegister from "../features/clients/ClientRegister";

import PtrsLayout from "../features/ptrs/PtrsLayout";
import PtrsWizard from "../features/ptrs/PtrsWizard";
import ConnectExternalSystems from "../features/ptrs/ConnectExternalSystems";
import XeroSelection from "../features/ptrs/XeroSelection";
import XeroConnectProgress from "../features/ptrs/XeroConnectProgress";
import StepsOverview from "../features/ptrs/StepsOverview";
import PtrsErrorBoundary from "../components/navigation/PtrsErrorBoundary";

import DataLayout from "../features/data/DataLayout";
import DataConsole from "../features/data/DataConsole";
import DataErrorBoundary from "../components/navigation/DataErrorBoundary";

import EsgDashboard from "../features/esg/EsgDashboard";
import EsgReportingPeriod from "../features/esg/EsgReportingPeriod";
import MetricDetail from "../features/esg/MetricDetail";
import MsDashboard from "../features/ms/MsDashboard";
import MsReportingPeriod from "../features/ms/MsReportingPeriod";
import MsInterviewForm from "../features/ms/MsInterviewForm";
import MsTraining from "../features/ms/MsTraining";
import MsGrievances from "../features/ms/MsGrievances";
import MsSupplierRisks from "../features/ms/MsSupplierRisks";
import PtrsDashboard from "../features/ptrs/PtrsDashboard";
import PtrsMetricsDashboard from "../features/ptrs/PtrsMetricsDashboard";

export const protectedRoutes = [
  {
    path: "/dashboard",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <Dashboard />
      </RequireRoles>
    ),
  },
  {
    path: "/admin",
    Component: () => (
      <RequireRoles allowed={[Role.Admin, Role.Boss]}>
        <AdminDashboard />
      </RequireRoles>
    ),
    children: [
      {
        path: "users",
        Component: UsersLayout,
        children: [
          {
            index: true,
            Component: Users,
          },
          {
            path: "create",
            Component: CreateUser,
          },
        ],
      },
    ],
  },
  {
    path: "/boss",
    Component: () => (
      <RequireRoles allowed={[Role.Boss]}>
        <BossDashboard />
      </RequireRoles>
    ),
    children: [
      {
        path: "clients",
        children: [
          { index: true, Component: Clients },
          { path: "register", Component: ClientRegister },
        ],
      },
      {
        path: "content",
        children: [
          {
            path: "faq",
            Component: require("../features/admin/content/EditFaq").default,
          },
          {
            path: "blog/:slug",
            Component: require("../features/admin/content/EditBlog").default,
          },
        ],
      },
    ],
  },
  {
    path: "/ptrs",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <PtrsProvider>
          <Outlet />
        </PtrsProvider>
      </RequireRoles>
    ),
    children: [
      {
        index: true,
        Component: () => (
          <ComplianceDashboardLayout title="PTRS Dashboard" module="ptrs">
            <PtrsDashboard />
          </ComplianceDashboardLayout>
        ),
      },
      {
        path: ":reportingPeriodId",
        children: [
          {
            index: true,
            Component: PtrsWizard,
          },
          {
            path: "connect",
            Component: ConnectExternalSystems,
          },
          {
            path: "selection",
            Component: XeroSelection,
          },
          {
            path: "progress",
            Component: XeroConnectProgress,
          },
        ],
      },
      {
        path: "metrics",
        Component: () => (
          <ComplianceDashboardLayout title="PTRS Dashboard" module="ptrs">
            <PtrsMetricsDashboard />
          </ComplianceDashboardLayout>
        ),
      },
    ],
  },
  {
    path: "/data",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <PtrsProvider>
          <TcpProvider>
            <DataLayout />
          </TcpProvider>
        </PtrsProvider>
      </RequireRoles>
    ),
    errorElement: <DataErrorBoundary />,
    children: [{ path: ":code/console", Component: DataConsole }],
  },
  {
    path: "/esg",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <ComplianceDashboardLayout title="ESG Dashboard" module="esg">
          <Outlet />
        </ComplianceDashboardLayout>
      </RequireRoles>
    ),
    children: [
      {
        index: true,
        Component: EsgDashboard,
      },
      {
        path: ":reportingPeriodId",
        Component: EsgReportingPeriod,
      },
    ],
  },
  {
    path: "/metrics/:metricId",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MetricDetail />
      </RequireRoles>
    ),
  },
  {
    path: "/ms",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <ComplianceDashboardLayout title="Modern Slavery Dashboard" module="ms">
          <Outlet />
        </ComplianceDashboardLayout>
      </RequireRoles>
    ),
    children: [
      {
        index: true,
        Component: MsDashboard,
      },
      {
        path: ":reportingPeriodId",
        Component: MsReportingPeriod,
      },
      {
        path: ":reportingPeriodId/interview",
        Component: MsInterviewForm,
      },
      {
        path: "training",
        Component: MsTraining,
      },
      {
        path: "grievances",
        Component: MsGrievances,
      },
      {
        path: "supplier-risks",
        Component: MsSupplierRisks,
      },
    ],
  },
];
