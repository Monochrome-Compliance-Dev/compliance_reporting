import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";

export default function BudgetSection({
  sections = [],
  selectedSectionId = "",
  onSelect,
  onAdd,
  onRename,
  onDelete,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: "0 0 360px",
        width: { xs: "100%", md: 330 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle1">Sections</Typography>
          {typeof onAdd === "function" && (
            <Button size="small" variant="outlined" onClick={onAdd}>
              Add
            </Button>
          )}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List dense disablePadding>
          {(sections || []).map((s) => (
            <ListItemButton
              key={s.id}
              selected={selectedSectionId === s.id}
              onClick={() => onSelect?.(s.id)}
            >
              <ListItemText
                primary={s.name}
                secondary={s.notes ? s.notes : null}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      {selectedSectionId && (onRename || onDelete) && (
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1}>
            {typeof onRename === "function" && (
              <Button size="small" variant="text" onClick={onRename}>
                Rename
              </Button>
            )}
            {typeof onDelete === "function" && (
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
