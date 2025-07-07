import React from "react";
import { Snackbar, Alert as MuiAlert } from "@mui/material";

export default function Alert({
  open,
  onClose,
  severity,
  message,
  duration = 6000,
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MuiAlert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </MuiAlert>
    </Snackbar>
  );
}
