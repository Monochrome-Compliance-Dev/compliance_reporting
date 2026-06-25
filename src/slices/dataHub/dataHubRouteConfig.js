import DataHubLayout from "./DataHubLayout";
import LandingPanel from "./panels/LandingPanel";
import UploadDatasetCard from "./panels/UploadDatasetCard";
import MapPanel from "./panels/MapPanel";

const dataHubRoutes = [
  {
    id: "dataHubRoot",
    Component: DataHubLayout,
    children: [
      { index: true, Component: LandingPanel },
      { path: "create", Component: UploadDatasetCard },
      { path: "map/:id", Component: MapPanel },
    ],
  },
];

export default dataHubRoutes;
