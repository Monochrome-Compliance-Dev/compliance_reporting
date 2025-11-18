import { useMemo } from "react";
import {
  usePtrsStatus,
  usePtrsUploadStatus,
  // usePtrsMapStatus,
  // usePtrsValidateStatus,
  // usePtrsRulesStatus,
  // usePtrsSbiStatus,
  // usePtrsMetricsStatus,
  // usePtrsReportStatus,
} from "./usePtrsQueries";

export function useStepStatuses(ptrsId, step) {
  // const hasId = !!ptrsId;

  // ---- Always call hooks (never conditional) ----
  const ptrs = usePtrsStatus(ptrsId);

  const upload = usePtrsUploadStatus(ptrsId);

  // For map, validate, rules, etc., we pass enabled:false instead
  // (React Query supports disabling the fetch while keeping the hook order intact)
  // const mapStatus = usePtrsMapStatus(ptrsId, { enabled: hasId });
  // const validate = usePtrsValidateStatus(ptrsId, { enabled: hasId });
  // const rules = usePtrsRulesStatus(ptrsId, { enabled: hasId });
  // const sbi = usePtrsSbiStatus(ptrsId, { enabled: hasId });
  // const metrics = usePtrsMetricsStatus(ptrsId, { enabled: hasId });
  // const report = usePtrsReportStatus(ptrsId, { enabled: hasId });

  // ---- Gates ----
  const gates = useMemo(() => {
    const uploadDone = upload?.status === "completed";
    const ingestedCount = upload?.rowCounts?.ingested ?? 0;
    const hasPrimary = uploadDone && ingestedCount > 0;

    return {
      uploadDone,
      ingestedCount,
      hasPrimary,

      // Step gates
      data: uploadDone && ingestedCount > 0,

      tables: uploadDone && ingestedCount > 0,

      // map: !!mapStatus?.selected,

      // stage: !!mapStatus?.selected && uploadDone && ingestedCount > 0,

      // validate: ["clean", "clean_with_warnings"].includes(validate?.status),

      // rules: rules?.status === "applied" && !!rules?.datasetVersionId,

      // sbi: sbi?.lastImport?.status === "completed",

      // metrics: metrics?.status === "ready",

      // report:
      //   metrics?.status === "ready" &&
      //   ["ready_for_review", "approved", "submitted"].includes(
      //     report?.state || ""
      //   ),
    };
  }, [upload]);

  return {
    ptrs,
    upload,
    // map: mapStatus,
    // validate,
    // rules,
    // sbi,
    // metrics,
    // report,
    gates,
  };
}
