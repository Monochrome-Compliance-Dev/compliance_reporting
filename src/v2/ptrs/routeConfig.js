import PtrsV2Layout from "./PtrsV2Layout";
import GuardedRoutePtrs from "./GuardedRoutePtrs";
import CreateRunPanel from "./panels/CreateRunPanel";
import UploadPanel from "./panels/UploadPanel";
import PlaceholderPanel from "./panels/PlaceholderPanel";
import { Navigate } from "react-router";

const ptrsRoutes = [
  {
    Component: PtrsV2Layout,
    children: [
      {
        Component: () => <GuardedRoutePtrs id="create" />,
        children: [{ path: "create", Component: CreateRunPanel }],
      },
      {
        Component: () => <GuardedRoutePtrs id="upload" />,
        children: [{ path: "upload", Component: UploadPanel }],
      },
      {
        Component: () => <GuardedRoutePtrs id="map" />,
        children: [
          {
            path: "map",
            Component: () => <PlaceholderPanel title="Map columns" />,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="validate" />,
        children: [
          {
            path: "validate",
            Component: () => <PlaceholderPanel title="Validate & fix errors" />,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="rules" />,
        children: [
          {
            path: "rules",
            Component: () => (
              <PlaceholderPanel title="Apply exclusions & transforms" />
            ),
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="sbi" />,
        children: [
          {
            path: "sbi",
            Component: () => <PlaceholderPanel title="SBI export/import" />,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="metrics" />,
        children: [
          {
            path: "metrics",
            Component: () => <PlaceholderPanel title="Metrics snapshot" />,
          },
        ],
      },
      {
        Component: () => <GuardedRoutePtrs id="report" />,
        children: [
          {
            path: "report",
            Component: () => (
              <PlaceholderPanel title="Compose & export report" />
            ),
          },
        ],
      },
      { index: true, Component: () => <Navigate to="create" replace /> },
      { path: "*", Component: () => <Navigate to="create" replace /> },
    ],
  },
];

export default ptrsRoutes;
