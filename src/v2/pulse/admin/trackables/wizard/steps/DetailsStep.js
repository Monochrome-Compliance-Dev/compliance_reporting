import React from "react";
import { Paper } from "@mui/material";
import { useTrackableWizard } from "../context/TrackableWizardContext";
import TrackableContainerForm from "../../TrackableContainerForm";

export default function DetailsStep() {
  const {
    mode,
    // trackableId, // not needed by the form
    setTrackableId,
    setTrackableName,
    setIsStepDirty,
    setCanContinue,
    config, // <- tenant/wizard config (must include requiresClient flag)
  } = useTrackableWizard();

  // RHF form calls this only on real user edits (initial reset is suppressed in the form)
  const handleFormChange = () => {
    setIsStepDirty(true);
    setCanContinue(false);
  };

  // When the surrounding shell saves successfully, it should call onSaved itself.
  // Kept here in case the form is ever used in a self-contained submit mode.
  const handleSaved = (trackable) => {
    if (!trackable) return;
    setTrackableId(trackable.id);
    setTrackableName(trackable.name);
    setCanContinue(true);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <TrackableContainerForm
        mode={mode}
        config={config}
        onChange={handleFormChange}
        onSubmit={handleSaved}
      />
    </Paper>
  );
}
