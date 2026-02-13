import { useRoutes } from "react-router";
import ptrsRoutes from "./ptrsRouteConfig";

export default function Ptrs() {
  return useRoutes(ptrsRoutes);
}
