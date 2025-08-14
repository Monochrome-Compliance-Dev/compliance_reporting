import { Typography } from "@mui/material";
import CollapsibleTable from "./CollapsibleTable";
import { stepConfigs } from "../../config/stepConfigs";

export default function StepView({
  stepId,
  tcpRecords,
  editTcpRecord,
  saveTcpUpdates,
  recomputeFlags,
}) {
  const records = Array.isArray(tcpRecords)
    ? tcpRecords
    : tcpRecords && Array.isArray(tcpRecords.data)
      ? tcpRecords.data
      : [];

  if (!records.length) {
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
        onRecordChange={(id, field, value) => {
          // local edit; caller can explicitly save later
          editTcpRecord(id, field, value);
        }}
        onSaveUpdates={async () => {
          await saveTcpUpdates();
          recomputeFlags();
        }}
      />
    </>
  );
}
