import { RequireFeature } from "app/routes";
import { Outlet } from "react-router";
import { PtrsProvider } from "./context/PtrsContext";

export default function Ptrs() {
  return (
    <RequireFeature feature="ptrs">
      <PtrsProvider>
        <Outlet />
      </PtrsProvider>
    </RequireFeature>
  );
}
