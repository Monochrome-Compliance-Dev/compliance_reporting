import { Stack, Paper, Typography } from "@mui/material";

export default function RuleExecutionTimeline({ history }) {
  if (!history || !history.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No transformation history recorded yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      {history.map((step) => (
        <Paper key={step.id} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2">{step.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {step.description}
          </Typography>
          <Typography variant="caption">
            {new Date(step.createdAt).toLocaleString()}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
