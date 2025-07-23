import { Dialog, DialogTitle, DialogContent } from "@mui/material";

/**
 * Wrapper for form dialogs (can be swapped with drawer later)
 */
export const FormDialogWrapper = ({ open, title, children, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
