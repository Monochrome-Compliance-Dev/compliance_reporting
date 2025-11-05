import { useMemo } from "react";
import {
  useRunStatus,
  useRunUploadStatus,
  useRunMapStatus,
  useValidationStatus,
  useRulesStatus,
  useSbiStatus,
  useMetricsStatus,
  useReportStatus,
} from "./usePtrsQueries";

export function useStepStatuses(runId, step) {
  const enable = (ids) => !!runId && (!step || ids.includes(step));
  // Debug: show which queries are enabled for this render
  if (process.env.NODE_ENV !== "production") {
    console.groupCollapsed("[useStepStatuses]", { runId, step });
    console.log("enabled:", {
      data: enable(["data"]),
      tables: enable(["tables"]),
      map: enable(["tables", "map", "stage"]),
      validate: enable(["validate"]),
      rules: enable(["rules"]),
      sbi: enable(["sbi"]),
      metrics: enable(["metrics"]),
      report: enable(["report"]),
    });
    console.groupEnd();
  }

  const run = useRunStatus(runId, { enabled: !!runId }); // always
  const runUpload = useRunUploadStatus(runId, {
    // we need upload status while on Upload, Tables, and Map
    enabled: enable(["data", "tables", "map"]),
  });
  const map = useRunMapStatus(runId, {
    // schema/mappings are needed from Tables onward
    enabled: enable(["tables", "map", "stage"]),
  });
  const validate = useValidationStatus(runId, {
    enabled: enable(["validate"]),
  });
  const rules = useRulesStatus(runId, { enabled: enable(["rules"]) });
  const sbi = useSbiStatus(runId, { enabled: enable(["sbi"]) });
  const metrics = useMetricsStatus(runId, { enabled: enable(["metrics"]) });
  const report = useReportStatus(runId, { enabled: enable(["report"]) });

  const gates = useMemo(
    () => ({
      // convenience locals
      // (kept inside useMemo so they stay in the dependency graph)
      ...(() => {
        const uploadDone = runUpload?.status === "completed";
        const ingestedCount = runUpload?.rowCounts?.ingested ?? 0;
        const hasPrimary = uploadDone && ingestedCount > 0;
        return { uploadDone, ingestedCount, hasPrimary };
      })(),

      // NOTE: 'create' step removed; first step is now 'data'. No back-compat alias.

      // require completed upload with ingested rows
      data:
        runUpload?.status === "completed" &&
        (runUpload?.rowCounts?.ingested ?? 0) > 0,

      tables:
        runUpload?.status === "completed" &&
        (runUpload?.rowCounts?.ingested ?? 0) > 0,

      // Map is only satisfied when actual mappings exist
      map: !!map?.mappings && Object.keys(map?.mappings || {}).length > 0,

      validate: ["clean", "clean_with_warnings"].includes(validate?.status),
      rules: rules?.status === "applied" && !!rules?.datasetVersionId,
      sbi: sbi?.lastImport?.status === "completed",
      metrics: metrics?.status === "ready",
      report:
        metrics?.status === "ready" &&
        ["ready_for_review", "approved", "submitted"].includes(
          report?.state || ""
        ),
    }),
    [run, runUpload, map, validate, rules, sbi, metrics, report]
  );
  console.log("report state", report?.state, "metrics", metrics?.status);
  return { run, runUpload, map, validate, rules, sbi, metrics, report, gates };
}
