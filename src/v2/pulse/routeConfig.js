import PulseLayout from "components/layouts/PulseLayout";
import PulseSolutionLanding from "./PulseSolutionLanding";
import PulseAdminConsole from "./admin/PulseAdminConsole";
import BudgetView from "./admin/budgets/BudgetView";
import BudgetBuilder from "./admin/budgets/BudgetBuilder";
import ResourceView from "./admin/resources/ResourceView";
import ResourceAssignmentView from "./admin/resources/ResourceAssignmentView";
import TrackableView from "./admin/trackables/TrackableView";
import TrackableWizard from "./admin/trackables/TrackableWizard";

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
            path: "trackables/new",
            Component: TrackableWizard,
          },
          {
            path: "trackables/:id",
            Component: TrackableWizard,
          },
          { path: "budgets", Component: BudgetView },
          { path: "budgets/builder", Component: BudgetBuilder },
          { path: "assignments", Component: ResourceAssignmentView },
          { path: "resources", Component: ResourceView },
        ],
      },
      { path: "*", Component: PulseSolutionLanding },
    ],
  },
];

export default pulseRoutes;
