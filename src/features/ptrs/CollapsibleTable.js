import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  useTheme,
  Tooltip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { formatCurrency, formatDateForSQL } from "../../lib/utils/";
import { getRowHighlightColor } from "../../lib/utils/highlightRow";
import { fieldMapping } from "./fieldMapping";

const maskCreditCard = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `**** **** **** ${digits.slice(-4)}`;
};

const DEFAULT_SORT_CONFIG = {
  key: null,
  direction: "asc",
  filtersExact: {},
  filtersFuzzy: {},
};

export default function CollapsibleTable({
  editableFields = [],
  hiddenColumns = [],
  records = [],
  onRecordChange,
  onSaveUpdates,
}) {
  // Normalise records in case a caller passes an object shape
  const rows = useMemo(() => {
    return Array.isArray(records)
      ? records
      : records && Array.isArray(records.data)
        ? records.data
        : [];
  }, [records]);
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT_CONFIG);
  const [upliftOpen, setUpliftOpen] = useState(false);
  // A record is "incomplete" if it has an issue or a recommended exclusion
  const hasIncomplete = rows.some((r) => {
    return Boolean(r.hasIssue) || Boolean(r.hasExclusion);
  });

  const toggleGroup = useCallback(
    (group) =>
      setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] })),
    []
  );

  const groupedVisibleFields = useMemo(() => {
    const filtered = fieldMapping.filter(
      (field) => !hiddenColumns?.includes(field.name)
    );

    const groups = {};
    for (const field of filtered) {
      const group = field.group || "other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    }

    return groups;
  }, [hiddenColumns]);

  const handleSearch = (event) => {
    const lower = event.target.value.toLowerCase();
    setSearchTerm(lower);
  };

  const filteredRecords = useMemo(() => {
    return rows.filter((record) => {
      const passesSearch = Object.values(record)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);

      const passesExact = Object.entries(sortConfig?.filtersExact || {}).every(
        ([key, value]) => {
          if (!value) return true;
          return (
            String(record[key] ?? "").toLowerCase() ===
            String(value).toLowerCase()
          );
        }
      );

      const passesFuzzy = Object.entries(sortConfig?.filtersFuzzy || {}).every(
        ([key, value]) => {
          if (!value) return true;
          return String(record[key] ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase());
        }
      );

      return passesSearch && passesExact && passesFuzzy;
    });
  }, [rows, searchTerm, sortConfig?.filtersExact, sortConfig?.filtersFuzzy]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig?.key) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRecords, sortConfig]);

  const displayedRecords = useMemo(
    () =>
      sortedRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRecords, page, rowsPerPage]
  );

  return (
    <>
      {hasIncomplete && (
        <Button
          variant="contained"
          color="primary"
          sx={{
            mb: 2,
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.secondary.main,
            fontWeight: "bold",
            boxShadow: 2,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
              boxShadow: 4,
            },
          }}
          onClick={() => setUpliftOpen(true)}
        >
          Fix Incomplete Records
        </Button>
      )}

      <Dialog
        open={upliftOpen}
        onClose={() => setUpliftOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          Data Uplift Coming Soon
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Typography gutterBottom>
            This feature will allow you to automatically enhance incomplete
            records (e.g. missing ABN or supplier names) using verified external
            data sources.
          </Typography>
          <Typography>
            A small fee per record will apply for uplift. Stay tuned!
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Button
            onClick={() => setUpliftOpen(false)}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
                color: theme.palette.primary.contrastText,
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearch}
        sx={{ mb: 2 }}
      />
      <Box sx={{ textAlign: "center", mb: 2 }}>
        {Object.values(collapsedGroups).filter(Boolean).length ===
          Object.keys(groupedVisibleFields).length && (
          <Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCollapsedGroups({})}
              sx={{
                fontWeight: "bold",
                color: theme.palette.getContrastText(
                  theme.palette.primary.main
                ),
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Show All Columns
            </Button>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All column groups are hidden. Use "Show All Columns" to reset.
            </Typography>
          </Box>
        )}
      </Box>
      {rows.length === 0 && (
        <Paper
          sx={{ p: 2, mb: 2, backgroundColor: theme.palette.background.paper }}
        >
          <Typography variant="body2" color="text.secondary">
            No records to display. Try a different search, or go back and upload
            data.
          </Typography>
        </Paper>
      )}
      {rows.length > 0 && (
        <>
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "90vh", // Increased height for more visible rows
              p: 0,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 11,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <TableCell
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      fontWeight: "bold",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  {Object.entries(groupedVisibleFields).map(
                    ([group, fields]) => (
                      <TableCell
                        key={group}
                        align="center"
                        colSpan={collapsedGroups[group] ? 1 : fields.length}
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          fontWeight: "bold",
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          cursor: "pointer",
                        }}
                        onClick={() => toggleGroup(group)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {group.toUpperCase()}
                          <IconButton
                            size="small"
                            sx={{ ml: 1, color: theme.palette.text.primary }}
                          >
                            {collapsedGroups[group] ? (
                              <KeyboardArrowRightIcon fontSize="inherit" />
                            ) : (
                              <KeyboardArrowDownIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                    )
                  )}
                </TableRow>
                <TableRow
                  sx={{
                    position: "sticky",
                    top: 46,
                    zIndex: 10,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      verticalAlign: "bottom",
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    }}
                  >
                    ⚠️ 🧠
                    <TextField
                      size="small"
                      variant="standard"
                      placeholder="Contains..."
                      value={sortConfig?.filtersFuzzy?.["flagStatus"] ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const { value } = e.target;
                        setSortConfig((prev) => ({
                          ...prev,
                          filtersFuzzy: {
                            ...(prev.filtersFuzzy || {}),
                            flagStatus: value,
                          },
                        }));
                      }}
                      sx={{ mb: 0.5 }}
                    />
                    <Select
                      size="small"
                      variant="standard"
                      fullWidth
                      displayEmpty
                      value={sortConfig?.filtersExact?.["flagStatus"] ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const { value } = e.target;
                        setSortConfig((prev) => ({
                          ...prev,
                          filtersExact: {
                            ...(prev.filtersExact || {}),
                            flagStatus: value,
                          },
                        }));
                      }}
                      sx={{ backgroundColor: theme.palette.background.paper }}
                    >
                      <MenuItem value="">(All)</MenuItem>
                      <MenuItem value="issue">Issue</MenuItem>
                      <MenuItem value="exclusion">Exclusion</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </TableCell>
                  {Object.entries(groupedVisibleFields).flatMap(
                    ([group, fields]) =>
                      collapsedGroups[group]
                        ? [
                            <TableCell
                              key={`${group}-collapsed`}
                              sx={{
                                backgroundColor: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                              }}
                            />,
                          ]
                        : fields.map((field) => {
                            if (hiddenColumns?.includes(field.name))
                              return null;
                            return (
                              <TableCell
                                key={field.name}
                                onClick={() => {
                                  setSortConfig((prev) => ({
                                    ...prev,
                                    key: field.name,
                                    direction:
                                      prev &&
                                      prev.key === field.name &&
                                      prev.direction === "asc"
                                        ? "desc"
                                        : "asc",
                                  }));
                                }}
                                sx={{
                                  userSelect: "none",
                                  "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                  },
                                  verticalAlign: "bottom",
                                  backgroundColor:
                                    theme.palette.background.paper,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                <Tooltip
                                  title="Click to sort"
                                  placement="top-end"
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    {field.label}
                                    {sortConfig?.key === field.name && (
                                      <Typography variant="body2">
                                        {sortConfig.direction === "asc"
                                          ? "🔼"
                                          : "🔽"}
                                      </Typography>
                                    )}
                                  </Box>
                                </Tooltip>
                                <TextField
                                  size="small"
                                  variant="standard"
                                  placeholder="Contains..."
                                  value={
                                    sortConfig?.filtersFuzzy?.[field.name] ?? ""
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const { value } = e.target;
                                    setSortConfig((prev) => ({
                                      ...prev,
                                      filtersFuzzy: {
                                        ...(prev.filtersFuzzy || {}),
                                        [field.name]: value,
                                      },
                                    }));
                                  }}
                                  sx={{ mb: 0.5 }}
                                />
                                <Select
                                  size="small"
                                  variant="standard"
                                  fullWidth
                                  displayEmpty
                                  value={
                                    sortConfig?.filtersExact?.[field.name] ?? ""
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const { value } = e.target;
                                    setSortConfig((prev) => ({
                                      ...prev,
                                      filtersExact: {
                                        ...(prev.filtersExact || {}),
                                        [field.name]: value,
                                      },
                                    }));
                                  }}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.paper,
                                  }}
                                >
                                  <MenuItem value="">(All)</MenuItem>
                                  {[
                                    ...new Set(
                                      rows.map((r) => r[field.name] || "")
                                    ),
                                  ]
                                    .filter((v) => v)
                                    .sort((a, b) =>
                                      String(a).localeCompare(
                                        String(b),
                                        undefined,
                                        { numeric: true }
                                      )
                                    )
                                    .map((option) => (
                                      <MenuItem key={option} value={option}>
                                        {String(option)}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </TableCell>
                            );
                          })
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRecords.map((record) => {
                  // Calculate payment term and time for this record
                  return (
                    <TableRow
                      key={record.id}
                      sx={{
                        backgroundColor: getRowHighlightColor({
                          id: record.id,
                          isError: false,
                          wasChanged: record.wasChanged || false,
                          wasSaved:
                            new Date(record.updatedAt) >
                            new Date(record.createdAt),
                          partialPayment: record.partialPayment,
                        }),
                      }}
                    >
                      <TableCell>
                        {record.hasExclusion ? (
                          <Tooltip title="Recommended Exclusion">
                            <Typography fontWeight="bold">🧠</Typography>
                          </Tooltip>
                        ) : record.hasIssue ? (
                          <Tooltip title="Issue">
                            <Typography color="error" fontWeight="bold">
                              ⚠️
                            </Typography>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                      {Object.entries(groupedVisibleFields).flatMap(
                        ([group, fields]) =>
                          collapsedGroups[group]
                            ? [
                                <TableCell
                                  key={`${record.id}-${group}-collapsed`}
                                />,
                              ]
                            : fields.map((field) => {
                                if (hiddenColumns?.includes(field.name))
                                  return null;
                                const isEditable = editableFields?.includes(
                                  field.name
                                );

                                // Special case: mask credit card number if not editable
                                if (
                                  field.name === "creditCardNumber" &&
                                  !isEditable
                                ) {
                                  return (
                                    <TableCell
                                      key={`${record.id}-${field.name}`}
                                    >
                                      {maskCreditCard(record[field.name])}
                                    </TableCell>
                                  );
                                }

                                // General-purpose fallback TableCell logic
                                return (
                                  <TableCell key={`${record.id}-${field.name}`}>
                                    {field.type === "amount" ? (
                                      formatCurrency(record[field.name])
                                    ) : field.type === "date" ? (
                                      record[field.name] ? (
                                        formatDateForSQL(
                                          record[field.name]
                                        ).split(" ")[0]
                                      ) : (
                                        "-"
                                      )
                                    ) : field.type === "checkbox" ? (
                                      isEditable ? (
                                        <Checkbox
                                          checked={Boolean(record[field.name])}
                                          sx={{
                                            color: theme.palette.text.primary,
                                            "&.Mui-checked": {
                                              color: theme.palette.text.primary,
                                            },
                                          }}
                                          onChange={(e) =>
                                            onRecordChange &&
                                            onRecordChange(
                                              record.id,
                                              field.name,
                                              e.target.checked
                                            )
                                          }
                                        />
                                      ) : (
                                        <Checkbox
                                          checked={Boolean(record[field.name])}
                                          disabled
                                        />
                                      )
                                    ) : isEditable ? (
                                      <TextField
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        multiline={field.multiline || false}
                                        value={record[field.name] || ""}
                                        onChange={(e) =>
                                          onRecordChange &&
                                          onRecordChange(
                                            record.id,
                                            field.name,
                                            e.target.value
                                          )
                                        }
                                        sx={{
                                          minWidth: [
                                            "tcpExclusionComment",
                                            "creditCardNumber",
                                          ].includes(field.name)
                                            ? 240
                                            : undefined,
                                        }}
                                      />
                                    ) : (
                                      record[field.name] || "-"
                                    )}
                                  </TableCell>
                                );
                              })
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRecords.length}
            page={page}
            onPageChange={(_, newPage) => {
              const changedRecords = displayedRecords.filter(
                (rec) => rec.wasChanged
              );
              if (changedRecords.length > 0) {
                // Save updates before changing page
                onSaveUpdates && onSaveUpdates();
              }
              setPage(newPage);
            }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </>
      )}
    </>
  );
}
