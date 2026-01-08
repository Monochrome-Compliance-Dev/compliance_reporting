// src/v2/ptrs/routeConfig.js
import PtrsV2Layout from "./PtrsV2Layout";
import LandingPanel from "./panels/LandingPanel";
import DataConsole from "./panels/DataConsole";
import TablesAndJoinsPanel from "./panels/TablesAndJoinsPanel";
import MapPanel from "./panels/MapPanel";
import StagePanel from "./panels/StagePanel";
import RulesPanel from "./panels/RulesPanel";
import SbiPanel from "./panels/SbiPanel";
import ValidatePanel from "./panels/ValidatePanel";

const ptrsRoutes = [
  {
    Component: PtrsV2Layout,
    children: [
      // Show Landing at /v2/ptrs and /v2/ptrs/landing
      { index: true, Component: LandingPanel },
      { path: "landing", Component: LandingPanel },
      // Wizard steps
      { path: "create", Component: DataConsole },
      { path: "data", Component: DataConsole },
      { path: "tables", Component: TablesAndJoinsPanel },
      { path: "map", Component: MapPanel },
      { path: "stage", Component: StagePanel },
      { path: "rules", Component: RulesPanel },
      { path: "sbi", Component: SbiPanel },
      {
        path: "validate",
        Component: ValidatePanel,
      },
      // // Future steps (placeholders)
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
