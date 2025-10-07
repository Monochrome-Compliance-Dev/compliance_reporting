import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

export default function QuickAddClientDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleCreate = async () => {
    await onCreate?.({ name: name.trim(), email: email.trim() || undefined });
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>New client</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="dense"
          fullWidth
        />
        <TextField
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="dense"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!name.trim()}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
