import RequireRoles from "./RequireRoles";
import Role from "../context/role";
import { PtrsProvider, PulseProvider, TcpProvider } from "../context/";
import ComplianceDashboardLayout from "../components/layouts/ComplianceDashboardLayout";
import PulseLayout from "../components/layouts/PulseLayout";
import { Outlet } from "react-router";

import Dashboard from "../features/users/Dashboard";
import AdminDashboard from "../features/users/AdminDashboard";
import BossDashboard from "../features/boss/BossDashboard";

import UsersLayout from "../features/users/UsersLayout";
import Users from "../features/users/Users";
import CreateUser from "../features/users/CreateUser";

import Customers from "../features/customers/Customers";
import CustomerRegister from "../features/customers/CustomerRegister";

import PtrsWizard from "../features/ptrs/PtrsWizard";
import ConnectExternalSystems from "../features/ptrs/ConnectExternalSystems";
import XeroSelection from "../features/ptrs/XeroSelection";
import XeroConnectProgress from "../features/ptrs/XeroConnectProgress";

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
import PulseDashboard from "../features/pulse/dashboard/PulseDashboard";
import ResourceView from "../features/pulse/admin/resources/ResourceView";
import ClientView from "../features/pulse/admin/clients/ClientView";
import EngagementView from "../features/pulse/admin/engagements/EngagementView";
import TimesheetEditor from "../features/pulse/workspace/timesheets/TimesheetEditor";
import TimesheetList from "../features/pulse/workspace/timesheets/TimesheetList";
import TimesheetManage from "../features/pulse/workspace/timesheets/TimesheetManage";
import TimesheetView from "../features/pulse/workspace/timesheets/TimesheetView";
import PulseAdminConsole from "../features/pulse/admin/PulseAdminConsole";
import ResourceAllocationView from "../features/pulse/admin/resources/ResourceAllocationView";
import BudgetView from "../features/pulse/admin/budgets/BudgetView";
import BudgetBuilder from "../features/pulse/admin/budgets/BudgetBuilder";
import EngagementWizard from "../features/pulse/admin/engagements/EngagementWizard";
import XeroContactAlign from "../features/data/XeroContactAlign";
import PulseSolutionLanding from "../features/pulse/PulseSolutionLanding";
import PulseMaximiser from "../features/pulse/maximiser/PulseMaximiser";
import Workspace from "../features/pulse/workspace/Workspace";
import Welcome from "../features/stripe/Welcome";
import PulseMaximiserWidget from "../features/pulseLanding/PulseMaximiserWidget";
import MaximiserStudio from "../features/pulse/maximiser/MaximiserStudio";

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
    path: "/data-cleaning",
    Component: XeroContactAlign,
  },
  {
    path: "/pulse/maximiser",
    Component: PulseMaximiserWidget,
  },
  {
    path: "/pulse-solution",
    Component: () => (
      <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
        <PulseProvider>
          <PulseLayout title="Pulse">
            <Outlet />
          </PulseLayout>
        </PulseProvider>
      </RequireRoles>
    ),
    children: [
      {
        index: true,
        Component: () => (
          <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
            <PulseSolutionLanding />
          </RequireRoles>
        ),
      },
      {
        path: "dashboard",
        Component: () => (
          <RequireRoles allowed={[Role.Admin, Role.Boss]}>
            <PulseDashboard />
          </RequireRoles>
        ),
      },
      {
        path: "admin",
        Component: () => (
          <RequireRoles allowed={[Role.Admin, Role.Boss]}>
            <Outlet />
          </RequireRoles>
        ),
        children: [
          { index: true, Component: PulseAdminConsole },
          { path: "resources", Component: ResourceView },
          { path: "resources/allocation", Component: ResourceAllocationView },
          { path: "engagements", Component: EngagementView },
          { path: "engagements/manage", Component: EngagementWizard },
          { path: "clients", Component: ClientView },
          { path: "budgets", Component: BudgetView },
          { path: "budgets/:id", Component: BudgetBuilder },
        ],
      },
      {
        path: "maximiser",
        Component: () => (
          <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
            <PulseMaximiser />
          </RequireRoles>
        ),
      },
      {
        path: "maximiser/studio",
        Component: () => (
          <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
            <MaximiserStudio />
          </RequireRoles>
        ),
      },
      {
        path: "workplace",
        Component: () => (
          <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
            <Outlet />
          </RequireRoles>
        ),
        children: [
          { index: true, Component: Workspace },
          {
            path: "timesheets",
            Component: () => (
              <RequireRoles allowed={[Role.User, Role.Admin, Role.Boss]}>
                <Outlet />
              </RequireRoles>
            ),
            children: [
              { index: true, Component: TimesheetList },
              { path: "current", Component: TimesheetEditor },
              {
                path: "manage",
                Component: () => (
                  <RequireRoles allowed={[Role.Admin, Role.Boss]}>
                    <TimesheetManage />
                  </RequireRoles>
                ),
              },
              { path: "view/:id", Component: TimesheetView },
              { path: ":id", Component: TimesheetEditor },
            ],
          },
        ],
      },
    ],
  },
  { path: "/welcome", Component: Welcome },
];
