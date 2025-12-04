import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Autocomplete,
} from "@mui/material";

export default function RuleImportDialog({
  open,
  onClose,
  ruleSources,
  selected,
  onSelect,
  onCopy,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import / Copy rules</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!ruleSources?.length ? (
            <Typography variant="body2" color="text.secondary">
              No existing rule sets found.
            </Typography>
          ) : (
            <Autocomplete
              size="small"
              options={ruleSources}
              value={selected}
              isOptionEqualToValue={(opt, val) => opt?.ptrsId === val?.ptrsId}
              getOptionLabel={(opt) => opt?.fileName || opt?.ptrsId || ""}
              onChange={(e, v) => onSelect(v)}
              renderInput={(params) => (
                <TextField {...params} label="Copy rules from…" />
              )}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={onCopy} disabled={!ruleSources?.length}>
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
}
