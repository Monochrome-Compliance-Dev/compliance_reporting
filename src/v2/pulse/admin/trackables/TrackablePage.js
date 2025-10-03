import { useMemo, useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import { Box, Stack, Paper } from "@mui/material";
import { usePulseContext } from "../../../context/PulseContext";
import { useAlert } from "../../../context";
import { pulseService } from "../../../services/pulse/pulse";
import EngagementContainerForm from "./TrackableContainerForm";
import EngagementAssignmentsEditor from "./TrackablesAllocationEditor";
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

  // Ensure assignments are loaded for the selected engagement (and don't clobber with empty lists)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selected?.id) return;
      try {
        const resp = await pulseService.assignments.listByEngagement(
          String(selected.id)
        );
        const list = (resp && resp.data) || resp || [];
        if (cancelled) return;
        // Merge into the selected engagement in context; keep existing rows if server returns empty
        const current =
          engagements.find((e) => String(e.id) === String(selected.id)) ||
          selected;
        const existing = Array.isArray(current.assignments)
          ? current.assignments
          : [];
        const merged = list && list.length > 0 ? list : existing;
        upsertEngagement({ ...current, assignments: merged });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load assignments", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Depend only on id to avoid re-render loops that clear assignments
  }, [selected?.id]);

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
    async (rows) => {
      if (!selected) return;
      try {
        // Get current server-side assignments for diffing
        const serverRaw = await pulseService.assignments.listByEngagement(
          String(selected.id)
        );
        const server = (serverRaw && serverRaw.data) || serverRaw || [];
        const serverIds = new Set(server.map((a) => String(a.id)));

        const ui = Array.isArray(rows) ? rows : [];
        const toCreate = ui.filter((r) => !r?.id);
        const toUpdate = ui.filter(
          (r) => !!r?.id && serverIds.has(String(r.id))
        );
        const toDelete = server.filter(
          (s) => !ui.find((r) => String(r?.id || "") === String(s.id))
        );

        // CREATE: forward full payloads from editor (no id in body)
        const createResults = await Promise.allSettled(
          toCreate.map((row) => pulseService.assignments.create(row))
        );
        const createErr = createResults.find((r) => r.status === "rejected");
        if (createErr)
          throw createErr.reason || new Error("Failed to create assignments");

        // UPDATE: diff-only from editor; remove id from body
        const updateResults = await Promise.allSettled(
          toUpdate.map((row) => {
            const { id, ...body } = row;
            return pulseService.assignments.patch(String(id), body);
          })
        );
        const updateErr = updateResults.find((r) => r.status === "rejected");
        if (updateErr)
          throw updateErr.reason || new Error("Failed to update assignments");

        // DELETE: remove any server rows not present in UI
        const deleteResults = await Promise.allSettled(
          toDelete.map((row) => pulseService.assignments.delete(String(row.id)))
        );
        const deleteErr = deleteResults.find((r) => r.status === "rejected");
        if (deleteErr)
          throw deleteErr.reason || new Error("Failed to delete assignments");

        // Reload from server and reflect in context so UI shows truth
        const afterRaw = await pulseService.assignments.listByEngagement(
          String(selected.id)
        );
        const after = (afterRaw && afterRaw.data) || afterRaw || [];
        const current =
          engagements.find((e) => String(e.id) === String(selected.id)) ||
          selected;
        const existing = Array.isArray(current.assignments)
          ? current.assignments
          : [];
        const merged = after && after.length > 0 ? after : existing;
        upsertEngagement({ ...current, assignments: merged });
        showAlert("Assignments saved", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save assignments", err);
        showAlert("Failed to save assignments", "error");
      }
    },
    [selected, engagements, upsertEngagement, showAlert]
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
