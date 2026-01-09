// Centralised PTRS v2 queries & mutations.
// Aligned to the new upload-centric backend. We keep the same hook names to
// avoid ripples, but interpret ptrsId === uploadId.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/ptrsApi";
import { getSbiStatus, importSbiResults } from "../services/sbi.ptrsApi";
import { getValidate, runValidate } from "../services/validate.ptrsApi";
import { getMetrics, updateMetricsDraft } from "../services/metrics.ptrsApi";

// ---- Keys (per ptrs) ---------------------------------------------------------
const K = {
  data: (id) => ["ptrs", "v2", "data", id],
  tables: (id) => ["ptrs", "v2", "tables", id],
  map: (id) => ["ptrs", "v2", "map", id],
  stage: (id) => ["ptrs", "v2", "stage", id],
  rules: (id) => ["ptrs", "v2", "rules", id],
  sbi: (id) => ["ptrs", "v2", "sbi", id],
  validate: (id) => ["ptrs", "v2", "validate", id],
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

export function usePtrsUploadStatus(ptrsId) {
  if (!ptrsId) {
    return { status: "idle", rowCounts: { ingested: 0 } };
  }

  // MVP assumption: if a PTRS run exists and we got here,
  // we treat upload as "completed" and let the data/map steps
  // show any real problems.
  return { status: "completed", rowCounts: { ingested: 0 } };
}

// Map status from /map endpoint
// export function usePtrsMapStatus(ptrsId) {
//   const enabled = !!ptrsId;
//   const query = useQuery({
//     queryKey: K.map(ptrsId),
//     queryFn: async () => {
//       const res = await api.getPtrsMap(ptrsId);
//       const map = res?.data?.map || null;
//       return {
//         selected: !!map,
//         schemaCompatible: true, // assume ok for now
//       };
//     },
//     enabled,
//     staleTime: 10_000,
//   });
//   return query.data ?? { selected: false, schemaCompatible: false };
// }

export function usePtrsTablesStatus(ptrsId) {
  return { status: "idle", tablesCount: 0 };
}

export function usePtrsStageStatus(ptrsId) {
  return { status: "idle" };
}

export function usePtrsRulesStatus() {
  return { status: "idle", datasetVersionId: null };
}

export function usePtrsSbiStatus(ptrsId) {
  const enabled = !!ptrsId;

  const query = useQuery({
    queryKey: K.sbi(ptrsId),
    queryFn: async () => getSbiStatus(ptrsId),
    enabled,
    staleTime: 10_000,
  });

  const latest = query.data?.latestUpload || null;

  if (!enabled) {
    return { status: "idle", lastImport: null };
  }

  if (query.isLoading) {
    return { status: "loading", lastImport: null };
  }

  if (query.isError) {
    return {
      status: "error",
      lastImport: null,
      error: query.error?.message || "Failed to load SBI status",
    };
  }

  return {
    status: latest?.status || "not_started",
    lastImport: latest,
  };
}

export function usePtrsValidateSummary(ptrsId) {
  const enabled = !!ptrsId;

  const query = useQuery({
    queryKey: K.validate(ptrsId),
    queryFn: async () => getValidate(ptrsId),
    enabled,
    staleTime: 10_000,
  });

  if (!enabled) {
    return { status: "idle", data: null, error: null };
  }

  if (query.isLoading) {
    return { status: "loading", data: null, error: null };
  }

  if (query.isError) {
    return {
      status: "error",
      data: null,
      error: query.error?.message || "Failed to load Validate summary",
    };
  }

  return { status: "success", data: query.data || null, error: null };
}

export function usePtrsMetricsSummary(ptrsId) {
  const enabled = !!ptrsId;

  const query = useQuery({
    queryKey: K.metrics(ptrsId),
    queryFn: async () => getMetrics(ptrsId),
    enabled,
    staleTime: 10_000,
  });

  if (!enabled) {
    return { status: "idle", data: null, error: null };
  }

  if (query.isLoading) {
    return { status: "loading", data: null, error: null };
  }

  if (query.isError) {
    return {
      status: "error",
      data: null,
      error: query.error?.message || "Failed to load Metrics",
    };
  }

  return { status: "success", data: query.data || null, error: null };
}

export function usePtrsMetricsStatus(ptrsId) {
  const q = usePtrsMetricsSummary(ptrsId);
  if (q.status !== "success") return { status: q.status, snapshotId: null };

  const reportId = q.data?.header?.reportId || null;
  const basedOnRowCount = q.data?.quality?.basedOnRowCount || 0;

  return {
    status: basedOnRowCount > 0 ? "ready" : "empty",
    snapshotId: reportId,
  };
}

export function usePtrsReportStatus() {
  return { state: "draft" };
}

// ---- Mutations (v2 minimal set) -----------------------------------------------
export function useCreatePtrsMutation() {
  const qc = useQueryClient();
  return useMutation({
    // createPtrs already returns a normalised PTRS row
    mutationFn: (payload) => api.createPtrs(payload),
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
    // uploadCsv already returns a normalised ingest summary
    mutationFn: ({ file }) => api.uploadCsv(ptrsId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.data(ptrsId) });
      qc.invalidateQueries({ queryKey: K.map(ptrsId) });
    },
  });
}

export function useUpdatePtrsMutation(ptrsId) {
  const qc = useQueryClient();
  return useMutation({
    // updatePtrs already returns the updated PTRS row (plain object)
    mutationFn: (payload) => api.updatePtrs(ptrsId, payload),
    onSuccess: (row) => {
      const id = row?.id ?? ptrsId;
      if (id) {
        qc.invalidateQueries({ queryKey: K.data(id) });
        qc.invalidateQueries({ queryKey: K.stage(id) });
        qc.invalidateQueries({ queryKey: K.map(id) });
      }
    },
  });
}

export function useUpdateMetricsDraftMutation(ptrsId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (patch) => updateMetricsDraft(ptrsId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.metrics(ptrsId) });
    },
  });
}

// Stubs for now — real endpoints coming with /execute, /calc, /report
export function useSelectMapMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}

export function useValidateMutation(ptrsId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => runValidate(ptrsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.validate(ptrsId) });
    },
  });
}

export function useApplyRulesMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}

export function useSbiExportMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}

export function useSbiImportMutation(ptrsId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ file }) => importSbiResults(ptrsId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.sbi(ptrsId) });
      qc.invalidateQueries({ queryKey: K.stage(ptrsId) });
      qc.invalidateQueries({ queryKey: K.validate(ptrsId) });
    },
  });
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
