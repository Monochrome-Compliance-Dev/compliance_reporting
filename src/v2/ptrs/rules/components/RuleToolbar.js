import { Stack, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";

export default function RuleToolbar({
  onImport,
  onAddRule,
  onSave,
  onPreview,
  onApply,
  isPreviewing,
  isApplying,
  canApply,
}) {
  const theme = useTheme();
  const { showAlert } = useAlert();

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      <Button size="small" onClick={onImport}>
        Import / Copy rules
      </Button>
      <Button size="small" onClick={onAddRule}>
        Add rule
      </Button>
      <Button variant="outlined" size="small" onClick={onSave}>
        Save
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={onPreview}
        disabled={isPreviewing || !canApply}
      >
        {isPreviewing ? "Previewing…" : "Preview"}
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={onApply}
        disabled={isApplying || !canApply}
      >
        {isApplying ? "Applying…" : "Apply"}
      </Button>
    </Stack>
  );
}
