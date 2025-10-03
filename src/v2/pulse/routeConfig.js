import PulseLayout from "components/layouts/PulseLayout";
import PulseSolutionLanding from "./PulseSolutionLanding";
import PulseAdminConsole from "./admin/PulseAdminConsole";

const pulseRoutes = [
  {
    Component: PulseLayout,
    children: [
      { index: true, Component: PulseSolutionLanding },
      { path: "admin", Component: PulseAdminConsole },
      { path: "*", Component: PulseSolutionLanding },
    ],
  },
];

export default pulseRoutes;
