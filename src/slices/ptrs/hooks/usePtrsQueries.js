// Centralised PTRS queries & mutations.
// Aligned to the new upload-centric backend. We keep the same hook names to
// avoid ripples, but interpret ptrsId === uploadId.

import { useQuery, useMutation } from "@tanstack/react-query";
import { ptrsTraffic } from "./ptrsTrafficController";
import * as api from "../services/ptrsApi";
import {
  applyExclusions,
  previewExclusions,
  listExclusionKeywords,
  createExclusionKeyword,
  deleteExclusionKeyword,
  updateExclusionKeyword,
} from "../services/exclusions.ptrsApi";
import { getSbiStatus, importSbiResults } from "../services/sbi.ptrsApi";
import { getValidate, runValidate } from "../services/validate.ptrsApi";
import { getMetrics, updateMetricsDraft } from "../services/metrics.ptrsApi";
import { getReportSnapshot } from "../services/report.ptrsApi";

// ---- Keys (per ptrs) ---------------------------------------------------------
const K = {
  data: (id) => ["ptrs", "data", id],
  tables: (id) => ["ptrs", "tables", id],
  map: (id) => ["ptrs", "map", id],
  stage: (id) => ["ptrs", "stage", id],
  exclusionsPreview: (id, { category, profileId, limit }) => [
    "ptrs",
    "exclusions",
    "preview",
    id,
    category || "all",
    profileId || "none",
    Number(limit) || 10,
  ],
  exclusionKeywords: (id, { profileId }) => [
    "ptrs",
    "exclusions",
    "keywords",
    id,
    profileId || "none",
  ],
  rules: (id) => ["ptrs", "rules", id],
  sbi: (id) => ["ptrs", "sbi", id],
  validate: (id) => ["ptrs", "validate", id],
  metrics: (id) => ["ptrs", "metrics", id],
  report: (id) => ["ptrs", "report", id],
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

export function useExclusionsPreviewQuery(
  ptrsId,
  { profileId = null, category = "all", limit = 10 } = {},
) {
  const enabled = !!ptrsId;

  return useQuery({
    queryKey: K.exclusionsPreview(ptrsId, { category, profileId, limit }),
    queryFn: async () =>
      previewExclusions(ptrsId, { profileId, category, limit }),
    enabled,
    staleTime: 0,
  });
}

export function useExclusionKeywordsQuery(ptrsId, { profileId } = {}) {
  const enabled = !!ptrsId && !!profileId;

  return useQuery({
    queryKey: K.exclusionKeywords(ptrsId, { profileId }),
    queryFn: async () => listExclusionKeywords(ptrsId, { profileId }),
    enabled,
    staleTime: 0,
  });
}

export function useCreateExclusionKeywordMutation(ptrsId) {
  return useMutation({
    mutationFn: ({ profileId, keyword, field, matchType, notes }) =>
      createExclusionKeyword(ptrsId, {
        profileId,
        keyword,
        field,
        matchType,
        notes,
      }),
  });
}

export function useUpdateExclusionKeywordMutation(ptrsId) {
  return useMutation({
    mutationFn: ({ profileId, keywordId, keyword, field, matchType, notes }) =>
      updateExclusionKeyword(ptrsId, {
        profileId,
        keywordId,
        keyword,
        field,
        matchType,
        notes,
      }),
  });
}

export function useDeleteExclusionKeywordMutation(ptrsId) {
  return useMutation({
    mutationFn: ({ profileId, keywordId }) =>
      deleteExclusionKeyword(ptrsId, { profileId, keywordId }),
  });
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
    return { status: "idle", data: null, error: null, refetch: null };
  }

  if (query.isLoading) {
    return {
      status: "loading",
      data: null,
      error: null,
      refetch: query.refetch,
    };
  }

  if (query.isError) {
    return {
      status: "error",
      data: null,
      error: query.error?.message || "Failed to load Metrics",
      refetch: query.refetch,
    };
  }

  return {
    status: "success",
    data: query.data || null,
    error: null,
    refetch: query.refetch,
  };
}

export function usePtrsReportSummary(ptrsId) {
  const enabled = !!ptrsId;

  const query = useQuery({
    queryKey: K.report(ptrsId),
    queryFn: async () => getReportSnapshot(ptrsId),
    enabled,
    staleTime: 10_000,
  });

  if (!enabled) {
    return { status: "idle", data: null, error: null, refetch: null };
  }

  if (query.isLoading) {
    return {
      status: "loading",
      data: null,
      error: null,
      refetch: query.refetch,
    };
  }

  if (query.isError) {
    return {
      status: "error",
      data: null,
      error: query.error?.message || "Failed to load Report snapshot",
      refetch: query.refetch,
    };
  }

  return {
    status: "success",
    data: query.data || null,
    error: null,
    refetch: query.refetch,
  };
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
  return useMutation({
    // createPtrs already returns a normalised PTRS row
    mutationFn: (payload) => api.createPtrs(payload),
    onSuccess: (row) => {
      const id = row?.id;
      if (id) {
        ptrsTraffic.emit(id, { reason: "ptrs_created" });
      }
    },
  });
}

export function useUploadCsvMutation(ptrsId) {
  return useMutation({
    // uploadCsv already returns a normalised ingest summary
    mutationFn: ({ file }) => api.uploadCsv(ptrsId, file),
    onSuccess: () => {
      ptrsTraffic.emit(ptrsId, { reason: "datasets_uploaded" });
    },
  });
}

export function useUpdatePtrsMutation(ptrsId) {
  return useMutation({
    // updatePtrs already returns the updated PTRS row (plain object)
    mutationFn: (payload) => api.updatePtrs(ptrsId, payload),
    onSuccess: (row) => {
      const id = row?.id ?? ptrsId;
      if (id) {
        ptrsTraffic.emit(id, { reason: "ptrs_updated" });
      }
    },
  });
}

export function useUpdateMetricsDraftMutation(ptrsId) {
  return useMutation({
    mutationFn: (patch) => updateMetricsDraft(ptrsId, patch),
    onSuccess: () => {
      ptrsTraffic.emit(ptrsId, { reason: "metrics_draft_updated" });
    },
  });
}

// Stubs for now — real endpoints coming with /execute, /calc, /report
export function useSelectMapMutation() {
  return useMutation({ mutationFn: async () => ({}) });
}

export function useValidateMutation(ptrsId) {
  return useMutation({
    mutationFn: async () => runValidate(ptrsId),
    onSuccess: () => {
      ptrsTraffic.emit(ptrsId, { reason: "validate_ran" });
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
  return useMutation({
    mutationFn: ({ file }) => importSbiResults(ptrsId, file),
    onSuccess: () => {
      ptrsTraffic.emit(ptrsId, { reason: "sbi_imported" });
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

// Removed legacy mutation-based preview hook to prevent duplicate calls.

export function useApplyExclusionsMutation(ptrsId) {
  return useMutation({
    mutationFn: ({ profileId = null, category = "all" } = {}) =>
      applyExclusions(ptrsId, { profileId, category }),
    onSuccess: () => {
      if (ptrsId) {
        ptrsTraffic.emit(ptrsId, { reason: "exclusions_applied" });
      }
    },
  });
}
