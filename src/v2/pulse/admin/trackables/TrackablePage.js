import { useMemo, useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import { Box, Stack, Paper } from "@mui/material";
import { useAlert, usePulseContext } from "context";
import TrackableContainerForm from "./TrackableContainerForm";
import TrackablesAllocationEditor from "./TrackablesAllocationEditor";
import QuickAddClientDialog from "./QuickAddClientDialog";

import { useSearchParams } from "react-router";
import { userService } from "services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // clients
  listClients,
  createClient,
  // resources
  listResources,
  // trackables
  listTrackables,
  createTrackable,
  updateTrackable,
  // allocations
  listAllocationsByTrackable,
  createAllocation,
  updateAllocation,
  deleteAllocation,
} from "../../services/pulseApi";

export function useTrackableOps() {
  const { showAlert } = useAlert();
  const qc = useQueryClient();

  // Trackable mutations
  const createTrackableMutation = useMutation({
    mutationFn: (payload) => createTrackable(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pulse", "trackables"] }),
  });
  const updateTrackableMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTrackable(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pulse", "trackables"] }),
  });

  // Allocation mutations
  const createAllocationMutation = useMutation({
    mutationFn: (payload) => createAllocation(payload),
  });
  const updateAllocationMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAllocation(id, payload),
  });
  const deleteAllocationMutation = useMutation({
    mutationFn: (id) => deleteAllocation(id),
  });

  // Save (create/update) details, enforcing server acknowledgement
  const saveDetails = async ({ values, selected }) => {
    const base = {
      name: values.name,
      clientId: values.clientId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      budgetHours: Number(values.budgetHours || 0),
      budgetAmount: Number(values.budgetAmount || 0),
      customerId: userService.userValue.customerId,
    };

    if (selected?.id) {
      const updated = await updateTrackableMutation.mutateAsync({
        id: String(selected.id),
        payload: { ...base, updatedBy: userService.userValue.id },
      });
      if (
        !updated ||
        (updated.id && String(updated.id) !== String(selected.id))
      ) {
        throw new Error("Update failed or mismatched id");
      }
      showAlert("Trackable updated", "success");
      return updated;
    }

    const saved = await createTrackableMutation.mutateAsync({
      ...base,
      createdBy: userService.userValue.id,
    });
    if (!saved || !saved.id) throw new Error("Create returned no id");
    showAlert("Trackable created", "success");
    return saved;
  };

  // Save allocations for a given trackable id
  const saveAllocations = async (trackableId, rows) => {
    const server =
      (await listAllocationsByTrackable(String(trackableId))) || [];
    const serverIds = new Set(server.map((a) => String(a.id)));

    const ui = Array.isArray(rows) ? rows : [];
    const toCreate = ui.filter((r) => !r?.id);
    const toUpdate = ui.filter((r) => !!r?.id && serverIds.has(String(r.id)));
    const toDelete = server.filter(
      (s) => !ui.find((r) => String(r?.id || "") === String(s.id))
    );

    const createResults = await Promise.allSettled(
      toCreate.map((row) =>
        createAllocationMutation.mutateAsync({ ...row, trackableId })
      )
    );
    const createErr = createResults.find((r) => r.status === "rejected");
    if (createErr)
      throw createErr.reason || new Error("Failed to create allocations");

    const updateResults = await Promise.allSettled(
      toUpdate.map((row) => {
        const { id, ...body } = row;
        return updateAllocationMutation.mutateAsync({
          id: String(id),
          payload: body,
        });
      })
    );
    const updateErr = updateResults.find((r) => r.status === "rejected");
    if (updateErr)
      throw updateErr.reason || new Error("Failed to update allocations");

    const deleteResults = await Promise.allSettled(
      toDelete.map((row) =>
        deleteAllocationMutation.mutateAsync(String(row.id))
      )
    );
    const deleteErr = deleteResults.find((r) => r.status === "rejected");
    if (deleteErr)
      throw deleteErr.reason || new Error("Failed to delete allocations");

    const latest =
      (await listAllocationsByTrackable(String(trackableId))) || [];
    showAlert("Allocations saved", "success");
    return Array.isArray(latest) ? latest : [];
  };

  return { saveDetails, saveAllocations };
}

export default function TrackablePage() {
  const { showAlert } = useAlert();
  const { config } = usePulseContext();
  const qc = useQueryClient();
  const { saveDetails: saveDetailsOp, saveAllocations: saveAllocationsOp } =
    useTrackableOps();

  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(null);

  // Read selected id from URL
  useEffect(() => {
    const id = searchParams.get("id");
    setSelectedId(id || null);
  }, [searchParams]);

  // Data queries
  const { data: rawTrackables } = useQuery({
    queryKey: ["pulse", "trackables"],
    queryFn: listTrackables,
  });
  const trackables = useMemo(
    () => (Array.isArray(rawTrackables) ? rawTrackables : []),
    [rawTrackables]
  );

  const { data: rawClients } = useQuery({
    queryKey: ["pulse", "clients"],
    queryFn: listClients,
  });
  const clients = Array.isArray(rawClients) ? rawClients : [];

  const { data: rawResources } = useQuery({
    queryKey: ["pulse", "resources"],
    queryFn: listResources,
  });
  const resources = Array.isArray(rawResources) ? rawResources : [];

  // Selected entity
  const selected = useMemo(
    () => trackables.find((e) => String(e.id) === String(selectedId)) || null,
    [trackables, selectedId]
  );

  // Allocations for the selected trackable
  const [selectedAllocations, setSelectedAllocations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selected?.id) return;
      try {
        const list =
          (await listAllocationsByTrackable(String(selected.id))) || [];
        if (!cancelled) setSelectedAllocations(Array.isArray(list) ? list : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load allocations", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: (payload) => createClient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pulse", "clients"] }),
  });

  // Quick add client
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const handleQuickAddClient = () => setClientDialogOpen(true);
  const handleCreateClient = async ({ name, email }) => {
    try {
      const created = await createClientMutation.mutateAsync({
        id: nanoid(10),
        name,
        email,
      });
      showAlert("Client created", "success");
      setClientDialogOpen(false);
      return created;
    } catch (e) {
      showAlert("Failed to create client", "error");
      return null;
    }
  };

  // Save details
  const handleSaveContainer = useCallback(
    async (values) => {
      try {
        const saved = await saveDetailsOp({ values, selected });
        if (!selected && saved?.id) setSelectedId(String(saved.id));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          "Failed to save trackable — server did not confirm success",
          e
        );
        showAlert("Failed to save trackable", "error");
      }
    },
    [selected, saveDetailsOp, showAlert]
  );

  // Save allocations
  const handleSaveAllocations = useCallback(
    async (rows) => {
      if (!selected?.id) return;
      try {
        const latest = await saveAllocationsOp(String(selected.id), rows);
        setSelectedAllocations(latest);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save allocations", err);
        showAlert("Failed to save allocations", "error");
      }
    },
    [selected?.id, saveAllocationsOp, showAlert]
  );

  // Initial values for the form (respect tenant config on client field via the form itself)
  const containerInitial = selected
    ? {
        name: selected.name || "",
        clientId: String(selected.clientId || ""),
        startDate: selected.startDate || "",
        endDate: selected.endDate || "",
      }
    : { name: "", clientId: "", startDate: "", endDate: "" };

  const requiresClient = config?.requiresClient !== false; // default true

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box p={2}>
          <TrackableContainerForm
            mode={selected ? "edit" : "create"}
            initialValues={containerInitial}
            clients={clients}
            config={config}
            onSubmit={handleSaveContainer}
            onQuickAddClient={requiresClient ? handleQuickAddClient : undefined}
          />
        </Box>
      </Paper>

      <TrackablesAllocationEditor
        trackableId={selected ? String(selected.id) : ""}
        resources={resources}
        initialAllocations={selectedAllocations}
        onSave={handleSaveAllocations}
      />

      <QuickAddClientDialog
        open={!!requiresClient && clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onCreate={handleCreateClient}
      />
    </Stack>
  );
}
