import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export function ConfirmDialog({
  open,
  title,
  content,
  onClose = () => {},
  onConfirm = () => {},
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title || "Are you sure?"}</DialogTitle>
      <DialogContent>
        <Typography>{content || "This action cannot be undone."}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
