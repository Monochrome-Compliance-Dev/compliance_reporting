// .js only; react-router (no dom). Centralised PTRS v2 queries & mutations.
// Aligned to the new upload-centric backend. We keep the same hook names to
// avoid ripples, but interpret runId === uploadId.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/ptrsApi";
import { useOutletContext } from "react-router";

// ---- Keys (per run) ---------------------------------------------------------
const K = {
  run: (id) => ["ptrs", "v2", "run", id],
  map: (id) => ["ptrs", "v2", "map", id],
  valid: (id) => ["ptrs", "v2", "validation", id],
  rules: (id) => ["ptrs", "v2", "rules", id],
  sbi: (id) => ["ptrs", "v2", "sbi", id],
  summary: (id) => ["ptrs", "v2", "summary", id],
  report: (id) => ["ptrs", "v2", "report", id],
};

// ---- Minimal search/list stubs (not used in v2 flow yet) ----------------------
export function useRunsSearch() {
  return [];
}
export function useRunsByPeriod() {
  return [];
}

// ---- Status queries ------------------------------------------------------------
// Existence check: if we have an id, consider it "exists" (we created it client-side).
export function useRunStatus(runId) {
  const exists = !!runId;
  return { exists, runId };
}

// Run upload status derived from sample count
export function useRunUploadStatus(runId) {
  const enabled = !!runId;
  const query = useQuery({
    queryKey: K.run(runId),
    queryFn: async () => {
      const res = await api.getRunSample(runId, { limit: 1, offset: 0 });
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
export function useRunMapStatus(runId) {
  const enabled = !!runId;
  const query = useQuery({
    queryKey: K.map(runId),
    queryFn: async () => {
      const res = await api.getRunMap(runId);
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

// The rest of the statuses are not wired yet in v2; return inert placeholders.
export function useValidationStatus() {
  return { status: "pending", errorsCount: 0, warningsCount: 0 };
}
export function useRulesStatus() {
  return { status: "idle", datasetVersionId: null };
}
export function useSbiStatus() {
  return { lastImport: { status: "idle" }, status: "idle" };
}
export function useMetricsStatus() {
  return { status: "idle", snapshotId: null };
}
export function useReportStatus() {
  return { state: "draft" };
}

// ---- Mutations (v2 minimal set) -----------------------------------------------
export function useCreateRunMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createRun(payload).then((res) => res?.data),
    onSuccess: (row) => {
      const id = row?.id;
      if (id) {
        qc.invalidateQueries({ queryKey: K.run(id) });
      }
    },
  });
}

export function useUploadCsvMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }) =>
      api.uploadCsv(runId, file).then((res) => res?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.run(runId) });
      qc.invalidateQueries({ queryKey: K.map(runId) });
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

// ---- Shared context hook --------------------------------------------------
// Access profileId and other outlet-provided PTRS v2 context values.
export function usePtrsV2Context() {
  const ctx = useOutletContext?.() || {};

  return {
    profileId: ctx.profileId || null,
    profiles: ctx.profiles || [],
    setProfileId: ctx.setProfileId || (() => {}),
  };
}
