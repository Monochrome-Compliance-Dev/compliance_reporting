import PtrsLayout from "./PtrsLayout";
import LandingPanel from "./panels/LandingPanel";
import DataConsole from "./panels/DataConsole";
import XeroImportPanel from "./panels/XeroImportPanel";
import XeroTenantSelectionPanel from "./panels/XeroTenantSelectionPanel";
import XeroConnectProgressPanel from "./panels/XeroConnectProgressPanel";
import TablesAndJoinsPanel from "./panels/TablesAndJoinsPanel";
import MapPanel from "./panels/MapPanel";
import StagePanel from "./panels/StagePanel";
import ExclusionsPanel from "./panels/ExclusionsPanel";
import RulesPanel from "./panels/RulesPanel";
import SbiPanel from "./panels/SbiPanel";
import ValidatePanel from "./panels/ValidatePanel";
import MetricsPanel from "./panels/MetricsPanel";
import ReportPanel from "./panels/ReportPanel";
import PtrsMetricsDashboard from "./screens/PtrsMetricsDashboard";
import PtrsMetricsDashboardV2 from "./components/PtrsMetricsDashboard";
import PackPanel from "./panels/PackPanel";
import XeroCallbackPanel from "./panels/XeroCallbackPanel";
import LearningPanel from "./panels/LearningPanel";

const ptrsRoutes = [
  {
    id: "ptrsRoot",
    Component: PtrsLayout,
    children: [
      // Show Landing at /app/ptrs and /app/ptrs/landing
      { index: true, Component: LandingPanel },
      { path: "landing", Component: LandingPanel },
      // Wizard steps
      { path: "create", Component: DataConsole },
      {
        path: "xero",
        children: [
          // Import page (index) and explicit alias for direct navigation
          { index: true, Component: XeroImportPanel },
          { path: "import", Component: XeroImportPanel },

          { path: "select", Component: XeroTenantSelectionPanel },
          { path: "progress", Component: XeroConnectProgressPanel },
          { path: "callback", Component: XeroCallbackPanel },
        ],
      },
      { path: "data", Component: DataConsole },
      { path: "tables", Component: TablesAndJoinsPanel },
      { path: "map", Component: MapPanel },
      { path: "stage", Component: StagePanel },
      { path: "exclusions", Component: ExclusionsPanel },
      { path: "rules", Component: RulesPanel },
      { path: "sbi", Component: SbiPanel },
      {
        path: "validate",
        Component: ValidatePanel,
      },
      { path: "metrics", Component: MetricsPanel },
      { path: "dashboard", Component: PtrsMetricsDashboard },
      { path: "dashboard-v2/:reportKey", Component: PtrsMetricsDashboardV2 },
      { path: "report", Component: ReportPanel },
      { path: "report-v2/:reportKey", Component: ReportPanel },
      {
        path: "pack",
        Component: PackPanel,
      },
      {
        path: "learning",
        element: <LearningPanel />,
      },
      // Optional: catch-all can just show Landing as well (no Navigate)
      // { path: "*", Component: LandingPanel },
    ],
  },
];

export default ptrsRoutes;
