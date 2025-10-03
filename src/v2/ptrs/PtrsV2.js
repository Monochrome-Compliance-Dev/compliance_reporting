import { Routes, Route, Navigate } from "react-router";
import PtrsV2Layout from "./PtrsV2Layout";
import GuardedRoute from "./GuardedRoute";
import CreateRunPanel from "./panels/CreateRunPanel";
import UploadPanel from "./panels/UploadPanel";
import PlaceholderPanel from "./panels/PlaceholderPanel";

export default function PtrsV2() {
  return (
    <Routes>
      <Route element={<PtrsV2Layout />}>
        <Route element={<GuardedRoute id="create" />}>
          <Route path="create" element={<CreateRunPanel />} />
        </Route>
        <Route element={<GuardedRoute id="upload" />}>
          <Route path="upload" element={<UploadPanel />} />
        </Route>
        <Route element={<GuardedRoute id="map" />}>
          <Route
            path="map"
            element={<PlaceholderPanel title="Map columns" />}
          />
        </Route>
        <Route element={<GuardedRoute id="validate" />}>
          <Route
            path="validate"
            element={<PlaceholderPanel title="Validate & fix errors" />}
          />
        </Route>
        <Route element={<GuardedRoute id="rules" />}>
          <Route
            path="rules"
            element={<PlaceholderPanel title="Apply exclusions & transforms" />}
          />
        </Route>
        <Route element={<GuardedRoute id="sbi" />}>
          <Route
            path="sbi"
            element={<PlaceholderPanel title="SBI export/import" />}
          />
        </Route>
        <Route element={<GuardedRoute id="metrics" />}>
          <Route
            path="metrics"
            element={<PlaceholderPanel title="Metrics snapshot" />}
          />
        </Route>
        <Route element={<GuardedRoute id="report" />}>
          <Route
            path="report"
            element={<PlaceholderPanel title="Compose & export report" />}
          />
        </Route>
        <Route index element={<Navigate to="create" replace />} />
        <Route path="*" element={<Navigate to="create" replace />} />
      </Route>
    </Routes>
  );
}
