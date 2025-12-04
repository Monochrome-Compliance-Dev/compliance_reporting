import { Stack, Paper, Typography } from "@mui/material";
import RuleCard from "./RuleCard";

export default function RuleList({ rules, headers, onUpdate, onRemove }) {
  if (!rules?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No rules yet. Click “Add rule” to create your first one.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {rules.map((rule, idx) => (
        <Paper key={rule.id} variant="outlined" sx={{ p: 2 }}>
          <RuleCard
            rule={rule}
            index={idx}
            headers={headers}
            onUpdate={onUpdate}
            onRemove={() => onRemove(idx)}
          />
        </Paper>
      ))}
    </Stack>
  );
}
