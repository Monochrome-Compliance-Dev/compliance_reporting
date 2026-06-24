import DataHubLayout from "./DataHubLayout";
import LandingPanel from "./panels/LandingPanel";
import CreateDatasetCard from "./panels/CreateDatasetCard";

const dataHubRoutes = [
  {
    id: "dataHubRoot",
    Component: DataHubLayout,
    children: [
      { index: true, Component: LandingPanel },
      { path: "create", Component: CreateDatasetCard },
    ],
  },
];

export default dataHubRoutes;
