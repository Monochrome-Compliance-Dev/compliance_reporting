import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Chip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * AssignmentSection side navigation component (mirrors BudgetSection API)
 */
export default function AssignmentSection({
  sections = [],
  selectedSectionId = "",
  onSelect,
  onAdd,
  onRename,
  onDelete,
  addDisabled = false,
  collapsed = false,
  onToggleCollapse,
}) {
  if (collapsed) {
    return (
      <Paper
        variant="outlined"
        sx={{
          flex: "0 0 52px",
          width: 52,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1,
        }}
      >
        <IconButton size="small" onClick={onToggleCollapse} sx={{ mb: 1 }}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <Stack spacing={1} sx={{ alignItems: "center" }}>
          {sections.map((s) => (
            <Button
              key={s.id}
              size="small"
              variant={selectedSectionId === s.id ? "contained" : "text"}
              onClick={() => onSelect?.(s.id)}
            >
              {s.name?.[0] || "?"}
            </Button>
          ))}
        </Stack>
      </Paper>
    );
  }

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
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={onToggleCollapse}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1">Sections</Typography>
          </Stack>
          {typeof onAdd === "function" && (
            <Button
              size="small"
              variant="outlined"
              onClick={onAdd}
              disabled={addDisabled}
            >
              Add
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List dense disablePadding>
          {(sections || []).map((section) => (
            <ListItemButton
              key={section.id}
              selected={selectedSectionId === section.id}
              onClick={() => onSelect?.(section.id)}
            >
              <ListItemText
                primary={section.name}
                secondary={section.notes ? section.notes : null}
              />
              {typeof section.count === "number" && (
                <Chip
                  size="small"
                  label={section.count}
                  variant="outlined"
                  sx={{ ml: 1, height: 20 }}
                />
              )}
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
