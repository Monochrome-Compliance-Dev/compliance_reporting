import { useRoutes } from "react-router";
import ptrsRoutes from "./routeConfig";

export default function PtrsV2() {
  return useRoutes(ptrsRoutes);
}
