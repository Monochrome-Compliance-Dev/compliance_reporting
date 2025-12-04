import { Stack, Paper, Typography } from "@mui/material";

export default function RuleExecutionTimeline({ history }) {
  // FE must not normalise backend shape, but it must render defensively.
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        No transformation history recorded yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      {history.map((step) => (
        <Paper key={step.id} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2">{step.label}</Typography>
          {step.description && (
            <Typography variant="body2" color="text.secondary">
              {step.description}
            </Typography>
          )}
          {step.createdAt && (
            <Typography variant="caption">
              {new Date(step.createdAt).toLocaleString()}
            </Typography>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
