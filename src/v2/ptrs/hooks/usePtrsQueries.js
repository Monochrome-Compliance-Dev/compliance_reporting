// .js only; react-router (no dom). Centralised PTRS v2 queries & mutations.
// Assumes QueryClientProvider is already at app root.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/ptrsApi";

// ---- Keys (per run) ---------------------------------------------------------
const K = {
  run: (runId) => ["ptrs", "run", "status", runId],
  upload: (runId) => ["ptrs", "upload", "status", runId],
  map: (runId) => ["ptrs", "map", "status", runId],
  valid: (runId) => ["ptrs", "validation", "status", runId],
  rules: (runId) => ["ptrs", "rules", "status", runId],
  sbi: (runId) => ["ptrs", "sbi", "status", runId],
  summary: (runId) => ["ptrs", "summary", runId],
  report: (runId) => ["ptrs", "report", "status", runId],
};

// ---- Search/list keys ------------------------------------------------------
const K_SEARCH = {
  runs: (filters) => [
    "ptrs",
    "runs",
    "search",
    String(filters?.name || ""),
    String(filters?.periodKey || ""),
  ],
  runsByPeriod: (periodKey) => [
    "ptrs",
    "runs",
    "byPeriod",
    String(periodKey || ""),
  ],
};

// ---- Search/list queries ---------------------------------------------------
export function useRunsSearch(filters, opts = {}) {
  const enabled =
    Boolean(filters?.name) &&
    Boolean(filters?.periodKey) &&
    (opts.enabled ?? true);
  const query = useQuery({
    queryKey: K_SEARCH.runs(filters),
    queryFn: () => api.listRuns(filters).then((res) => res?.data),
    enabled,
    staleTime: 15_000,
  });
  return query.data ?? [];
}

export function useRunsByPeriod(periodKey, opts = {}) {
  const enabled = Boolean(periodKey) && (opts.enabled ?? true);
  const query = useQuery({
    queryKey: K_SEARCH.runsByPeriod(periodKey),
    queryFn: () => api.listRuns({ periodKey }).then((res) => res?.data),
    enabled,
    staleTime: 15_000,
  });
  return query.data ?? [];
}

// ---- Status queries ---------------------------------------------------------
export function useRunStatus(runId) {
  return (
    useQuery({
      queryKey: K.run(runId),
      queryFn: () => api.getRunStatus(runId).then((res) => res?.data),
      enabled: !!runId,
      staleTime: 15_000,
    }).data ?? { exists: !!runId, runId }
  );
}

export function useUploadStatus(runId) {
  return (
    useQuery({
      queryKey: K.upload(runId),
      queryFn: () => api.getUploadStatus(runId).then((res) => res?.data),
      enabled: !!runId,
      refetchInterval: (data) => (data?.status === "running" ? 1500 : false),
    }).data ?? { status: "idle", rowCounts: { ingested: 0 } }
  );
}

export function useColumnMapStatus(runId) {
  return (
    useQuery({
      queryKey: K.map(runId),
      queryFn: () => api.getMapStatus(runId).then((res) => res?.data),
      enabled: !!runId,
    }).data ?? { selected: false, schemaCompatible: false }
  );
}

export function useValidationStatus(runId) {
  return (
    useQuery({
      queryKey: K.valid(runId),
      queryFn: () => api.getValidationStatus(runId).then((res) => res?.data),
      enabled: !!runId,
      refetchInterval: (d) => (d?.status === "running" ? 1500 : false),
    }).data ?? { status: "pending", errorsCount: 0, warningsCount: 0 }
  );
}

export function useRulesStatus(runId) {
  return (
    useQuery({
      queryKey: K.rules(runId),
      queryFn: () => api.getRulesStatus(runId).then((res) => res?.data),
      enabled: !!runId,
    }).data ?? { status: "idle", datasetVersionId: null }
  );
}

export function useSbiStatus(runId) {
  return (
    useQuery({
      queryKey: K.sbi(runId),
      queryFn: () => api.getSbiStatus(runId).then((res) => res?.data),
      enabled: !!runId,
    }).data ?? { lastImport: { status: "idle" }, status: "idle" }
  );
}

export function useMetricsStatus(runId) {
  return (
    useQuery({
      queryKey: K.summary(runId),
      queryFn: () => api.getSummary(runId).then((res) => res?.data),
      enabled: !!runId,
    }).data ?? { status: "idle", snapshotId: null }
  );
}

export function useReportStatus(runId) {
  return (
    useQuery({
      queryKey: K.report(runId),
      queryFn: () => api.getReportStatus(runId).then((res) => res?.data),
      enabled: !!runId,
    }).data ?? { state: "draft" }
  );
}

// ---- Mutations (invalidate the right slices) --------------------------------
export function useCreateRunMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createRun(payload).then((res) => res?.data),
    onSuccess: (run) => {
      qc.invalidateQueries({ queryKey: K.run(run?.id) });
    },
  });
}

export function useUploadCsvMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, columnMapId }) =>
      api.uploadCsv(runId, file, columnMapId).then((res) => res?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.upload(runId) });
      qc.invalidateQueries({ queryKey: K.valid(runId) });
    },
  });
}

export function useSelectMapMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mapId) => api.selectMap(runId, mapId).then((res) => res?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.map(runId) }),
  });
}

export function useValidateMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.startValidation(runId).then((res) => res?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.valid(runId) }),
  });
}

export function useApplyRulesMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.applyRules(runId, payload).then((res) => res?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.rules(runId) });
      qc.invalidateQueries({ queryKey: K.summary(runId) });
    },
  });
}

export function useSbiExportMutation(runId) {
  return useMutation({
    mutationFn: () => api.exportSbi(runId).then((res) => res?.data),
  });
}

export function useSbiImportMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => api.importSbi(runId, file).then((res) => res?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.sbi(runId) });
      qc.invalidateQueries({ queryKey: K.summary(runId) });
    },
  });
}

export function useRecomputeMetricsMutation(runId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.recomputeMetrics(runId).then((res) => res?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.summary(runId) }),
  });
}

export function useReportMutations(runId) {
  const qc = useQueryClient();
  const createDraft = useMutation({
    mutationFn: (payload) =>
      api.createReportDraft(runId, payload).then((res) => res?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.report(runId) }),
  });
  const changeState = useMutation({
    mutationFn: (state) =>
      api.setReportState(runId, state).then((res) => res?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.report(runId) }),
  });
  const downloadPdf = useMutation({
    mutationFn: () => api.downloadReportPdf(runId).then((res) => res?.data),
  });
  return { createDraft, changeState, downloadPdf };
}
