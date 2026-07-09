import TransformationWorkspacePage from "platform/transformation/TransformationWorkspacePage";
import TransformationWorkingDatasetPage from "platform/transformation/TransformationWorkingDatasetPage";

const transformationRoutes = [
  {
    index: true,
    Component: TransformationWorkspacePage,
  },
  {
    path: "working-datasets/:workingDatasetId",
    Component: TransformationWorkingDatasetPage,
  },
];

export default transformationRoutes;
