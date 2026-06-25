import DataHubLayout from "./DataHubLayout";
import LandingPanel from "./panels/LandingPanel";
import UploadDatasetCard from "./panels/UploadDatasetCard";
import MapPanel from "./panels/MapPanel";
import PublishPanel from "./panels/PublishPanel";

const dataHubRoutes = [
  {
    id: "dataHubRoot",
    Component: DataHubLayout,
    children: [
      { index: true, Component: LandingPanel },
      { path: "create", Component: UploadDatasetCard },
      { path: "map/:id", Component: MapPanel },
      { path: "publish/:id", Component: PublishPanel },
    ],
  },
];

export default dataHubRoutes;
