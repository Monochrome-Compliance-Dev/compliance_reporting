import RequireRoles from "./RequireRoles";
import Role from "../context/role";
import { ReportProvider, TcpProvider } from "../context/";
import ComplianceDashboardLayout from "../components/layouts/ComplianceDashboardLayout";

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
import MetricDetail from "../features/esg/MetricDetail";
import MsDashboard from "../features/ms/MsDashboard";
import MsReportingPeriod from "../features/ms/MsReportingPeriod";
import MsInterviewForm from "../features/ms/MsInterviewForm";
import MsTraining from "../features/ms/MsTraining";
import MsGrievances from "../features/ms/MsGrievances";
import MsSupplierRisks from "../features/ms/MsSupplierRisks";

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
    path: "/reports",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Audit, Role.Boss]}>
        <ReportProvider>
          <ReportsLayout />
        </ReportProvider>
      </RequireRoles>
    ),
    errorElement: <ReportErrorBoundary />,
    children: [
      { path: ":code/:reportId", Component: ReportWizard },
      { path: ":code/:reportId/connect", Component: ConnectExternalSystems },
      { path: ":code/:reportId/selection", Component: XeroSelection },
      { path: ":code/:reportId/progress", Component: XeroConnectProgress },
      { path: "steps", Component: StepsOverview },
    ],
  },
  {
    path: "/data",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <TcpProvider>
          <DataLayout />
        </TcpProvider>
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
          <EsgDashboard />
        </ComplianceDashboardLayout>
      </RequireRoles>
    ),
  },
  {
    path: "/esg/:reportingPeriodId",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <EsgReportingPeriod />
      </RequireRoles>
    ),
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
          <MsDashboard />
        </ComplianceDashboardLayout>
      </RequireRoles>
    ),
  },
  {
    path: "/ms/:reportingPeriodId",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MsReportingPeriod />
      </RequireRoles>
    ),
  },
  {
    path: "/ms/:reportingPeriodId/interview",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MsInterviewForm />
      </RequireRoles>
    ),
  },
  {
    path: "/ms/training",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MsTraining />
      </RequireRoles>
    ),
  },
  {
    path: "/ms/grievances",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MsGrievances />
      </RequireRoles>
    ),
  },
  {
    path: "/ms/supplier-risks",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <MsSupplierRisks />
      </RequireRoles>
    ),
  },
];
