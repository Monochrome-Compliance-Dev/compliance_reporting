// src/v2/pulse/PulseV2.js
import { useRoutes } from "react-router";
import pulseRoutes from "./routeConfig";

export default function PulseV2() {
  return useRoutes(pulseRoutes);
}
