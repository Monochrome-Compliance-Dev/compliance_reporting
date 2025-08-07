import { Typography } from "@mui/material";
import CollapsibleTable from "./CollapsibleTable";
import { useReportContext } from "../../context";
import { stepConfigs } from "../../config/stepConfigs";

export default function StepView({ stepId }) {
  const { records } = useReportContext();

  if (!records) {
    return <Typography variant="body1">No records available.</Typography>;
  }

  const recommendedExclusionCount = records.filter(
    (r) => r.hasExclusion
  ).length;
  const issuesCount = records.filter((r) => r.hasIssue).length;

  return (
    <>
      {(stepId === 1 || stepId === 2) && (
        <>
          <Typography variant="body1" sx={{ mb: 2 }}>
            🟡 <strong>{records.length}</strong> record(s) loaded for review.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ⚠️ <strong>{issuesCount}</strong> record(s) with potential issues.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            🧠 <strong>{recommendedExclusionCount}</strong> record(s) are
            recommended by the system to be excluded from TCP.
          </Typography>
        </>
      )}

      <CollapsibleTable
        editableFields={stepConfigs[`step${stepId}`].editableFields}
        hiddenColumns={stepConfigs[`step${stepId}`].hiddenColumns}
        records={records}
      />
    </>
  );
}
