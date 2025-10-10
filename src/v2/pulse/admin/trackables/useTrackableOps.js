// src/v2/pulse/admin/trackables/useTrackableOps.js
import { useAlert } from "context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "services";
import {
  listAssignmentsByTrackable,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createTrackable,
  updateTrackable,
} from "../../services/pulseApi";

export function useTrackableOps() {
  const { showAlert } = useAlert();
  const qc = useQueryClient();

  // --- Trackable mutations
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

  // --- Assignment mutations
  const createAssignmentMutation = useMutation({
    mutationFn: (payload) => createAssignment(payload),
  });
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAssignment(id, payload),
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => deleteAssignment(id),
  });

  // --- Save (create/update) trackable details
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
      if (!updated || String(updated.id) !== String(selected.id))
        throw new Error("Update failed or mismatched id");
      showAlert("Trackable updated", "success");
      return updated;
    }

    const saved = await createTrackableMutation.mutateAsync({
      ...base,
      createdBy: userService.userValue.id,
    });
    if (!saved?.id) throw new Error("Create returned no id");
    showAlert("Trackable created", "success");
    return saved;
  };

  // --- Save assignments for a trackable
  const saveAssignments = async (trackableId, rows) => {
    const server =
      (await listAssignmentsByTrackable(String(trackableId))) || [];
    const serverIds = new Set(server.map((a) => String(a.id)));

    const ui = Array.isArray(rows) ? rows : [];
    const toCreate = ui.filter((r) => !r?.id);
    const toUpdate = ui.filter((r) => !!r?.id && serverIds.has(String(r.id)));
    const toDelete = server.filter(
      (s) => !ui.find((r) => String(r?.id || "") === String(s.id))
    );

    await Promise.allSettled(
      toCreate.map((row) =>
        createAssignmentMutation.mutateAsync({ ...row, trackableId })
      )
    );
    await Promise.allSettled(
      toUpdate.map((row) => {
        const { id, ...body } = row;
        return updateAssignmentMutation.mutateAsync({
          id: String(id),
          payload: body,
        });
      })
    );
    await Promise.allSettled(
      toDelete.map((row) =>
        deleteAssignmentMutation.mutateAsync(String(row.id))
      )
    );

    const latest =
      (await listAssignmentsByTrackable(String(trackableId))) || [];
    showAlert("Assignments saved", "success");
    return Array.isArray(latest) ? latest : [];
  };

  return { saveDetails, saveAssignments };
}
