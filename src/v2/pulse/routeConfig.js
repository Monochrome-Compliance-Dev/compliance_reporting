import PulseLayout from "components/layouts/PulseLayout";
import PulseSolutionLanding from "./PulseSolutionLanding";
import PulseAdminConsole from "./admin/PulseAdminConsole";
import BudgetView from "./admin/budgets/BudgetView";
import BudgetBuilder from "./admin/budgets/BudgetBuilder";
import ResourceView from "./admin/resources/ResourceView";
import ResourceAllocationView from "./admin/resources/ResourceAllocationView";
import TrackableView from "./admin/trackables/TrackableView";
import TrackableWizard from "./admin/trackables/TrackableWizard";
import TrackablePage from "./admin/trackables/TrackablePage";

const pulseRoutes = [
  {
    Component: PulseLayout,
    children: [
      { index: true, Component: PulseSolutionLanding },
      {
        path: "admin",
        children: [
          { index: true, Component: PulseAdminConsole },
          // The following routes currently render the admin console as a placeholder.
          // Swap these Components with the real pages you copied into v2 when ready.
          { path: "clients", Component: PulseAdminConsole },
          {
            path: "trackables",
            Component: TrackableView,
          },
          {
            path: "trackables/:id",
            Component: TrackablePage,
          },
          {
            path: "trackables/new",
            Component: TrackableWizard,
          },
          { path: "budgets", Component: BudgetView },
          { path: "budgets/builder", Component: BudgetBuilder },
          { path: "allocations", Component: ResourceAllocationView },
          { path: "resources", Component: ResourceView },
        ],
      },
      { path: "*", Component: PulseSolutionLanding },
    ],
  },
];

export default pulseRoutes;
