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

  // --- debug: which step is active & what will be fetched this render
  // (remove once routing is stable)
  console.groupCollapsed("[useStepStatuses]", { runId, step });
  console.log("enabled:", {
    upload: !!runId && (!step || ["upload"].includes(step)),
    map: !!runId && (!step || ["upload", "map"].includes(step)),
    validate: !!runId && (!step || ["validate"].includes(step)),
    rules: !!runId && (!step || ["rules"].includes(step)),
    sbi: !!runId && (!step || ["sbi"].includes(step)),
    metrics: !!runId && (!step || ["metrics"].includes(step)),
    report: !!runId && (!step || ["report"].includes(step)),
  });
  console.groupEnd();

  const run = useRunStatus(runId, { enabled: !!runId }); // always
  const runUpload = useRunUploadStatus(runId, {
    // we need upload status while on Upload, Tables, and Map
    enabled: enable(["upload", "tables", "map"]),
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
      create: !!run?.exists,

      // initial upload must be completed and have rows
      upload:
        runUpload?.status === "completed" &&
        (runUpload?.rowCounts?.ingested ?? 0) > 0,

      // Tables becomes available once upload is completed.
      // (Later we can refine to require supporting datasets/joins.)
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
