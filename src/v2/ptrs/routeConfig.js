// src/v2/ptrs/routeConfig.js
import PtrsV2Layout from "./PtrsV2Layout";
import LandingPanel from "./panels/LandingPanel";
import DataConsole from "./panels/DataConsole";
import TablesAndJoinsPanel from "./panels/TablesAndJoinsPanel";
import MapPanel from "./panels/MapPanel";
// import StagePanel from "./panels/StagePanel";
// import RulesPanel from "./panels/RulesPanel";

const ptrsRoutes = [
  {
    Component: PtrsV2Layout,
    children: [
      // Show Landing at /v2/ptrs
      { index: true, Component: LandingPanel },
      // Wizard steps
      { path: "data", Component: DataConsole },
      { path: "tables", Component: TablesAndJoinsPanel },
      { path: "map", Component: MapPanel },
      // { path: "stage", Component: StagePanel },
      // { path: "rules", Component: RulesPanel },
      // // Future steps (placeholders)
      // {
      //   path: "validate",
      //   Component: () => <div>Validate &amp; fix errors</div>,
      // },
      // { path: "sbi", Component: () => <div>SBI export/import</div> },
      // { path: "metrics", Component: () => <div>Metrics snapshot</div> },
      // {
      //   path: "report",
      //   Component: () => <div>Compose &amp; export report</div>,
      // },
      // Optional: catch-all can just show Landing as well (no Navigate)
      // { path: "*", Component: LandingPanel },
    ],
  },
];

export default ptrsRoutes;
