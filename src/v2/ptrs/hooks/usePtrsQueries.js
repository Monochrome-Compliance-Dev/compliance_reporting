// .js only; react-router (no dom). Centralised PTRS v2 queries & mutations.
// Aligned to the new upload-centric backend. We keep the same hook names to
// avoid ripples, but interpret ptrsId === uploadId.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/ptrsApi";
import { useOutletContext } from "react-router";

// ---- Keys (per ptrs) ---------------------------------------------------------
const K = {
  data: (id) => ["ptrs", "v2", "data", id],
  tables: (id) => ["ptrs", "v2", "tables", id],
  map: (id) => ["ptrs", "v2", "map", id],
  stage: (id) => ["ptrs", "v2", "stage", id],
  rules: (id) => ["ptrs", "v2", "rules", id],
  validate: (id) => ["ptrs", "v2", "validate", id],
  sbi: (id) => ["ptrs", "v2", "sbi", id],
  metrics: (id) => ["ptrs", "v2", "metrics", id],
  report: (id) => ["ptrs", "v2", "report", id],
};

// ---- Minimal search/list stubs (not used in v2 flow yet) ----------------------
export function usePtrsSearch() {
  return [];
}
export function usePtrsByPeriod() {
  return [];
}

// ---- Status queries ------------------------------------------------------------
// Existence check: if we have an id, consider it "exists" (we created it client-side).
export function usePtrsStatus(ptrsId) {
  const exists = !!ptrsId;
  return { exists, ptrsId };
}

// Ptrs upload status derived from sample count
export function usePtrsUploadStatus(ptrsId) {
  const enabled = !!ptrsId;
  const query = useQuery({
    queryKey: K.data(ptrsId),
    queryFn: async () => {
      const res = await api.getPtrsSample(ptrsId, { limit: 1, offset: 0 });
      const total = res?.data?.total ?? 0;
      return {
        status: total > 0 ? "completed" : "idle",
        rowCounts: { ingested: total },
      };
    },
    enabled,
    staleTime: 10_000,
  });
  return (
    query.data ?? {
      status: "idle",
      rowCounts: { ingested: 0 },
    }
  );
}

// Map status from /map endpoint
export function usePtrsMapStatus(ptrsId) {
  const enabled = !!ptrsId;
  const query = useQuery({
    queryKey: K.map(ptrsId),
    queryFn: async () => {
      const res = await api.getPtrsMap(ptrsId);
      const map = res?.data?.map || null;
      return {
        selected: !!map,
        schemaCompatible: true, // assume ok for now
      };
    },
    enabled,
    staleTime: 10_000,
  });
  return query.data ?? { selected: false, schemaCompatible: false };
}

export function usePtrsTablesStatus(ptrsId) {
  return { status: "idle", tablesCount: 0 };
}

export function usePtrsStageStatus(ptrsId) {
  return { status: "idle" };
}

// The rest of the statuses are not wired yet in v2; return inert placeholders.
export function usePtrsValidateStatus() {
  return { status: "pending", errorsCount: 0, warningsCount: 0 };
}
export function usePtrsRulesStatus() {
  return { status: "idle", datasetVersionId: null };
}
export function usePtrsSbiStatus() {
  return { lastImport: { status: "idle" }, status: "idle" };
}
export function usePtrsMetricsStatus() {
  return { status: "idle", snapshotId: null };
}
export function usePtrsReportStatus() {
  return { state: "draft" };
}

// ---- Mutations (v2 minimal set) -----------------------------------------------
export function useCreatePtrsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createPtrs(payload).then((res) => res?.data),
    onSuccess: (row) => {
      const id = row?.id;
      if (id) {
        qc.invalidateQueries({ queryKey: K.data(id) });
      }
    },
  });
}

export function useUploadCsvMutation(ptrsId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }) =>
      api.uploadCsv(ptrsId, file).then((res) => res?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.data(ptrsId) });
      qc.invalidateQueries({ queryKey: K.map(ptrsId) });
    },
  });
}

// Stubs for now — real endpoints coming with /execute, /calc, /report
export function useSelectMapMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useValidateMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useApplyRulesMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useSbiExportMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useSbiImportMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useRecomputeMetricsMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}
export function useReportMutations() {
  const createDraft = useMutation({ mutationFn: async () => ({}) });
  const changeState = useMutation({ mutationFn: async () => ({}) });
  const downloadPdf = useMutation({ mutationFn: async () => ({}) });
  return { createDraft, changeState, downloadPdf };
}
