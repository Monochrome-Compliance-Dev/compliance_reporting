import { RequireFeature } from "app/routes";
import { Outlet } from "react-router";
import { DataHubProvider } from "./context/DataHubContext";

export default function DataHub() {
  return (
    <RequireFeature feature="ptrs">
      <DataHubProvider>
        <Outlet />
      </DataHubProvider>
    </RequireFeature>
  );
}
