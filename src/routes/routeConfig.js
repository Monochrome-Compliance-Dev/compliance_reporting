import RequireRoles from "./RequireRoles";
import Role from "../context/role";
import { PtrsProvider, PulseProvider, TcpProvider } from "../context/";
import ComplianceDashboardLayout from "../components/layouts/ComplianceDashboardLayout";
import { Outlet } from "react-router";

import Dashboard from "../features/users/Dashboard";
import AdminDashboard from "../features/users/AdminDashboard";
import BossDashboard from "../features/boss/BossDashboard";

import UsersLayout from "../features/users/UsersLayout";
import Users from "../features/users/Users";
import CreateUser from "../features/users/CreateUser";

import Customers from "../features/customers/Customers";
import CustomerRegister from "../features/customers/CustomerRegister";

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
import PulseDashboard from "../features/pulse/PulseDashboard";
import ResourceView from "../features/pulse/ResourceView";
import ClientView from "../features/pulse/ClientView";
import EngagementView from "../features/pulse/EngagementView";
import TimesheetView from "../features/pulse/TimesheetView";

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
        path: "customers",
        children: [
          { index: true, Component: Customers },
          { path: "register", Component: CustomerRegister },
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
          <TcpProvider>
            <Outlet />
          </TcpProvider>
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
  {
    path: "/pulse",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <PulseProvider>
          <ComplianceDashboardLayout title="Pulse Dashboard" module="pulse">
            <Outlet />
          </ComplianceDashboardLayout>
        </PulseProvider>
      </RequireRoles>
    ),
    children: [
      {
        index: true,
        Component: PulseDashboard,
      },
      {
        path: "resources",
        Component: ResourceView,
      },
      {
        path: "engagements",
        Component: EngagementView,
      },
      {
        path: "clients",
        Component: ClientView,
      },
      {
        path: "timesheets",
        Component: TimesheetView,
      },
    ],
  },
];
