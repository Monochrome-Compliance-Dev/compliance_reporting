import { useMemo, useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import { Box, Stack, Paper } from "@mui/material";
import { usePulseContext } from "../../../context/PulseContext";
import { useAlert } from "../../../context";
import { pulseService } from "../../../services/pulse/pulse";
import EngagementContainerForm from "./EngagementContainerForm";
import EngagementAssignmentsEditor from "./EngagementAssignmentsEditor";
import QuickAddClientDialog from "./QuickAddClientDialog";

import { useSearchParams } from "react-router";
import { userService } from "../../../services";

export default function EngagementPage() {
  const {
    clients = [],
    resources = [],
    engagements = [],
    upsertEngagement,
    upsertClient,
  } = usePulseContext();
  const { showAlert } = useAlert();

  const [searchParams] = useSearchParams();

  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const id = searchParams.get("id");
    setSelectedId(id || null);
  }, [searchParams]);

  const selected = useMemo(
    () => engagements.find((e) => String(e.id) === String(selectedId)) || null,
    [engagements, selectedId]
  );

  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const handleQuickAddClient = () => setClientDialogOpen(true);
  const handleCreateClient = async ({ name, email }) => {
    const created = await pulseService.clients.create({
      id: nanoid(10),
      name,
      email,
    });
    upsertClient(created);
    showAlert("Client created", "success");
    setClientDialogOpen(false);
  };

  const handleSaveContainer = useCallback(
    async (values) => {
      let payload = {
        id: selected ? selected.id : nanoid(10),
        name: values.name,
        clientId: values.clientId,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        budgetHours: Number(values.budgetHours || 0),
        customerId: userService.userValue.customerId,
      };

      selected
        ? (payload = { ...payload, updatedBy: userService.userValue.id })
        : (payload = { ...payload, createdBy: userService.userValue.id });

      const saved = selected
        ? await pulseService.engagements.update(String(selected.id), payload)
        : await pulseService.engagements.create(payload);

      upsertEngagement(saved);
      showAlert(
        selected ? "Engagement updated" : "Engagement created",
        "success"
      );
      if (!selected) setSelectedId(saved.id);
    },
    [selected, upsertEngagement, showAlert]
  );

  const handleSaveAssignments = useCallback(
    async (assignments) => {
      if (!selected && assignments?.length) return; // defensive; should not happen
      const existing = selected || null;
      const updated = { ...(existing || {}), assignments };
      const saved = await pulseService.engagements.update(
        String(existing.id),
        updated
      );
      upsertEngagement(saved);
      showAlert("Assignments saved", "success");
    },
    [selected, upsertEngagement, showAlert]
  );

  const containerInitial = selected
    ? {
        name: selected.name || "",
        clientId: String(selected.clientId || ""),
        startDate: selected.startDate || "",
        endDate: selected.endDate || "",
      }
    : { name: "", clientId: "", startDate: "", endDate: "" };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box p={2}>
          <EngagementContainerForm
            mode={selected ? "edit" : "create"}
            initialValues={containerInitial}
            clients={clients}
            onSubmit={handleSaveContainer}
            onQuickAddClient={handleQuickAddClient}
          />
        </Box>
      </Paper>

      <EngagementAssignmentsEditor
        engagementId={selected ? String(selected.id) : ""}
        resources={resources}
        initialAssignments={selected?.assignments || []}
        onSave={handleSaveAssignments}
      />

      <QuickAddClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onCreate={handleCreateClient}
      />
    </Stack>
  );
}
