import { Typography } from "@mui/material";

export default function RuleSummaryPreview({ rule }) {
  const when = rule.when?.[0];
  const label = rule.label || rule.id;
  return (
    <Typography variant="caption" color="text.secondary">
      Rule "{label}" applies when {when?.field} {when?.op} {when?.value}
    </Typography>
  );
}
