import { useMemo } from "react";
import {
  useRunStatus,
  useUploadStatus,
  useColumnMapStatus,
  useValidationStatus,
  useRulesStatus,
  useSbiStatus,
  useMetricsStatus,
  useReportStatus,
} from "./usePtrsQueries";

export function useStepStatuses(runId, step) {
  const enable = (ids) => !!runId && ids.includes(step);

  const run = useRunStatus(runId, { enabled: !!runId }); // always okay to fetch
  const upload = useUploadStatus(runId, { enabled: enable(["upload"]) }); // only on Upload
  const map = useColumnMapStatus(runId, { enabled: enable(["upload", "map"]) }); // map shown during Upload/Map
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
      upload:
        upload?.status === "completed" &&
        (upload?.rowCounts?.ingested ?? 0) > 0,
      map: !!map?.selected && map?.schemaCompatible === true,
      validate: ["clean", "clean_with_warnings"].includes(validate?.status),
      rules: rules?.status === "applied" && !!rules?.datasetVersionId,
      sbi: sbi?.lastImport?.status === "completed",
      metrics: metrics?.status === "ready",
      report: ["draft", "ready_for_review", "approved", "submitted"].includes(
        report?.state || ""
      ),
    }),
    [run, upload, map, validate, rules, sbi, metrics, report]
  );

  return { run, upload, map, validate, rules, sbi, metrics, report, gates };
}
