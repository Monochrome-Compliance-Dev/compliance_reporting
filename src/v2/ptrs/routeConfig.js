import PtrsV2Layout from "./PtrsV2Layout";
import GuardedRoutePtrs from "./GuardedRoutePtrs";
import CreateRunPanel from "./panels/CreateRunPanel";
import DataConsole from "./panels/DataConsole";
import MapPanel from "./panels/MapPanel";
import LandingPanel from "./panels/LandingPanel";
import { Navigate } from "react-router";

const ptrsRoutes = [
  {
    Component: PtrsV2Layout,
    children: [
      {
        Component: () => <GuardedRoutePtrs id="landing" />,
        children: [{ path: "landing", Component: LandingPanel }],
      },
      {
        Component: () => <GuardedRoutePtrs id="create" />,
        children: [{ path: "create", Component: CreateRunPanel }],
      },
      {
        Component: () => <GuardedRoutePtrs id="data" />,
        children: [{ path: "data", Component: DataConsole }],
      },
      {
        Component: () => <GuardedRoutePtrs id="map" />,
        children: [{ path: "map", Component: MapPanel }],
      },
      {
        Component: () => <GuardedRoutePtrs id="validate" />,
        children: [
          {
            path: "validate",
            Component: () => <div>Validate &amp; fix errors</div>,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="rules" />,
        children: [
          {
            path: "rules",
            Component: () => <div>Apply exclusions &amp; transforms</div>,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="sbi" />,
        children: [
          {
            path: "sbi",
            Component: () => <div>SBI export/import</div>,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="metrics" />,
        children: [
          {
            path: "metrics",
            Component: () => <div>Metrics snapshot</div>,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="report" />,
        children: [
          {
            path: "report",
            Component: () => <div>Compose &amp; export report</div>,
          },
        ],
      },
      { index: true, Component: () => <Navigate to="landing" replace /> },
      { path: "*", Component: () => <Navigate to="landing" replace /> },
    ],
  },
];

export default ptrsRoutes;
