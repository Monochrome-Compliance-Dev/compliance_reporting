import DataHubLayout from "./DataHubLayout";
import LandingPanel from "./panels/LandingPanel";
import CreateRunCard from "./panels/CreateRunCard";
import UploadPanel from "./panels/UploadPanel";

const dataHubRoutes = [
  {
    id: "dataHubRoot",
    Component: DataHubLayout,
    children: [
      { index: true, Component: LandingPanel },
      { path: "landing", Component: LandingPanel },
      { path: "create", Component: CreateRunCard },
      { path: "upload", Component: UploadPanel },
      { path: "link", Component: LandingPanel },
      { path: "map", Component: LandingPanel },
      { path: "stage", Component: LandingPanel },
      { path: "exclusions", Component: LandingPanel },
      { path: "rules", Component: LandingPanel },
      { path: "sbi", Component: LandingPanel },
      { path: "validate", Component: LandingPanel },
    ],
  },
];

export default dataHubRoutes;
