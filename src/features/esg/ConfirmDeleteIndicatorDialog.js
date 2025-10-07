import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const ConfirmDeleteIndicatorDialog = ({
  open,
  onClose,
  onConfirm,
  indicator,
  metrics = [],
}) => {
  const associatedMetrics = metrics.filter(
    (m) => m.indicatorId === indicator?.id
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Delete Indicator</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Are you sure you want to delete the indicator:
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {indicator?.name} ({indicator?.code})
        </Typography>
        {associatedMetrics.length > 0 && (
          <>
            <Typography gutterBottom>
              This will also delete the following {associatedMetrics.length}{" "}
              metric(s):
            </Typography>
            <List dense>
              {associatedMetrics.map((m) => (
                <ListItem key={m.id}>
                  <ListItemText primary={`${m.value} ${m.unit}`} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onConfirm(indicator.id, associatedMetrics)}
          variant="contained"
          sx={{ color: "error.main" }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteIndicatorDialog;
