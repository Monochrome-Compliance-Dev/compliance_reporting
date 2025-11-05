// src/v2/ptrs/routeConfig.js
import PtrsV2Layout from "./PtrsV2Layout";
import LandingPanel from "./panels/LandingPanel";
import CreateRunPanel from "./panels/CreateRunPanel";
import TablesAndJoinsPanel from "./panels/TablesAndJoinsPanel";
import MapPanel from "./panels/MapPanel";
import StagePanel from "./panels/StagePanel";

const ptrsRoutes = [
  {
    Component: PtrsV2Layout,
    children: [
      // Show Landing at /v2/ptrs
      { index: true, Component: LandingPanel },

      // Wizard steps
      { path: "create", Component: CreateRunPanel },
      { path: "tables", Component: TablesAndJoinsPanel },
      { path: "map", Component: MapPanel },
      { path: "stage", Component: StagePanel },

      // Future steps (placeholders)
      {
        path: "validate",
        Component: () => <div>Validate &amp; fix errors</div>,
      },
      {
        path: "rules",
        Component: () => <div>Apply exclusions &amp; transforms</div>,
      },
      { path: "sbi", Component: () => <div>SBI export/import</div> },
      { path: "metrics", Component: () => <div>Metrics snapshot</div> },
      {
        path: "report",
        Component: () => <div>Compose &amp; export report</div>,
      },

      // Optional: catch-all can just show Landing as well (no Navigate)
      // { path: "*", Component: LandingPanel },
    ],
  },
];

export default ptrsRoutes;
