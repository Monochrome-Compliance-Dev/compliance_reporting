import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { payloadSanitiser, diffObjects } from "lib/utils/payloadSanitiser";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Paper,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Collapse,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import AssignmentSection from "./AssignmentSection";

import { userService } from "services";
import { nanoid } from "nanoid";
import { useAlert } from "context";
import {
  updateAssignment,
  createAssignment,
  getActiveBudgetByTrackable,
  listBudgetItemLabels,
} from "../../services/pulseApi";
import ResourceQuickDialog from "../resources/ResourceQuickDialog";

export default function TrackableAssignmentsEditor({
  trackableId,
  trackableName,
  resources = [],
  initialAssignments = [],
  onSave,
  onSummaryChange, // optional: report assigned totals
  onRowsChange, // optional: stream live rows up
  onQuickAddResource, // optional: quick add resource handler
}) {
  if (!trackableName) {
    throw new Error("TrackableAssignmentsEditor requires trackableName prop");
  }

  const { showAlert } = useAlert();

  // Row select focus + "freshly-added" highlight nicety
  const selectRefs = useRef({});
  const [flashRowKey, setFlashRowKey] = useState(null);
  useEffect(() => {
    if (!flashRowKey) return;
    const t = setTimeout(() => setFlashRowKey(null), 1600);
    return () => clearTimeout(t);
  }, [flashRowKey]);

  // Maintain a local, mutable copy of resources so we can append newly created ones
  const [localResources, setLocalResources] = useState(resources || []);
  useEffect(() => {
    setLocalResources(resources || []);
  }, [resources]);

  const [budgetItems, setBudgetItems] = useState([]);
  const [, setLoadingBudgetItems] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState("");
  const formatCurrency = useMemo(() => {
    return (v) => {
      if (typeof v !== "number" || Number.isNaN(v)) return "";

      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: budgetCurrency || "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(v);
      } catch {
        return `$${v.toFixed(2)}`;
      }
    };
  }, [budgetCurrency]);

  // (Top-add menu state and handlers removed)

  // Section filtering derived from budget items
  const [selectedSection, setSelectedSection] = useState("");
  const sectionNames = useMemo(
    () =>
      Array.from(
        new Set((budgetItems || []).map((b) => String(b.sectionName || "")))
      )
        .filter(Boolean)
        .sort(),
    [budgetItems]
  );
  useEffect(() => {
    if (!selectedSection && sectionNames.length > 0) {
      setSelectedSection(sectionNames[0]);
    }
  }, [selectedSection, sectionNames]);
  const budgetItemsForSection = useMemo(
    () =>
      selectedSection
        ? (budgetItems || []).filter(
            (b) => String(b.sectionName || "") === String(selectedSection)
          )
        : budgetItems || [],
    [selectedSection, budgetItems]
  );

  const [rows, setRows] = useState(() =>
    (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      budgetItemId: a.budgetItemId || "",
      assignmentPct: a.assignmentPct ?? 0,
      assignedHoursPerWeek: a.assignedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }))
  );

  // Memoized selector for addable budget items for the selected section

  const budgetItemById = useMemo(
    () => Object.fromEntries((budgetItems || []).map((i) => [String(i.id), i])),
    [budgetItems]
  );

  const rowsForSelected = useMemo(() => {
    if (!selectedSection) return [];
    return (rows || []).filter((r) => {
      const bi = budgetItemById[String(r.budgetItemId)];
      return bi && String(bi.sectionName) === String(selectedSection);
    });
  }, [rows, budgetItemById, selectedSection]);

  const rowsByBudgetItemId = useMemo(() => {
    const map = {};
    (rows || []).forEach((r) => {
      const id = String(r.budgetItemId || "");
      (map[id] ||= []).push(r);
    });
    return map;
  }, [rows]);

  const [expandedMap, setExpandedMap] = useState({});
  const toggleExpanded = (id) =>
    setExpandedMap((m) => ({ ...m, [String(id)]: !m[String(id)] }));

  const selectedAssignedHours = useMemo(
    () =>
      rowsForSelected.reduce(
        (sum, r) => sum + (Number(r.assignedHoursPerWeek) || 0),
        0
      ),
    [rowsForSelected]
  );

  // Build section objects (id, name, count) for the left nav
  const sections = useMemo(() => {
    return (sectionNames || []).map((name) => {
      const count = (rows || []).filter((r) => {
        const bi = budgetItemById[String(r.budgetItemId)];
        return bi && String(bi.sectionName) === String(name);
      }).length;
      return { id: String(name), name: String(name), count };
    });
  }, [sectionNames, rows, budgetItemById]);

  const filterResourcesByRow = useCallback(
    (row) => {
      const bi = budgetItemById[String(row.budgetItemId)];
      if (!bi) return localResources || [];
      const label = (bi.budgetItemLabel || "").trim();
      const pool = localResources || [];
      if (!label) return pool;

      // Try a few common fields that might carry the role/position name
      const matches = pool.filter((r) => {
        const fields = [r.position, r.role, r.roleTitle, r.title]
          .map((v) => (v == null ? "" : String(v)))
          .filter(Boolean);
        return fields.some(
          (f) =>
            f.localeCompare(label, undefined, { sensitivity: "accent" }) === 0
        );
      });

      // Only return matches (do not fall back to pool)
      return matches;
    },
    [budgetItemById, localResources]
  );
  const rateByResourceId = useCallback(
    (id) => {
      const r = (localResources || []).find((x) => String(x.id) === String(id));
      const raw = r?.hourlyRate ?? r?.rate ?? r?.chargeOutRate;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    },
    [localResources]
  );

  const [errorsByKey, setErrorsByKey] = useState({});

  const [overlapKeys, setOverlapKeys] = useState([]);

  // Quick-add Resource modal state
  const [addResOpen, setAddResOpen] = useState(false);
  const collapseSections = useCallback(() => setSectionsCollapsed(true), []);
  const [addResDefaults, setAddResDefaults] = useState({
    role: "",
    rowKey: null,
    budgetItemId: "",
  });

  // Validators for Add Resource dialog

  const openAddResourceForRow = (row) => {
    const bi = budgetItemById[String(row.budgetItemId)];
    const label = (bi?.budgetItemLabel || "").trim();
    setAddResDefaults({
      role: label,
      rowKey: row.key,
      budgetItemId: String(row.budgetItemId || ""),
    });
    setAddResOpen(true);
  };
  const closeAddResource = () => setAddResOpen(false);

  // Derived totals for parent chips
  const assignedHoursTotal = useMemo(
    () =>
      (rows || []).reduce(
        (sum, r) => sum + (Number(r.assignedHoursPerWeek) || 0),
        0
      ),
    [rows]
  );
  const assignedCount = useMemo(() => (rows || []).length, [rows]);

  const datesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return true; // open ranges considered overlapping
    return !(aEnd < bStart || bEnd < aStart);
  };

  const computeOverlapKeys = useCallback((list) => {
    const byRes = list.reduce((acc, r) => {
      (acc[r.resourceId] ||= []).push(r);
      return acc;
    }, {});
    const offending = new Set();
    for (const rid of Object.keys(byRes)) {
      const entries = byRes[rid];
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          // only evaluate when both ranges are fully specified
          if (
            a.startDate &&
            a.endDate &&
            b.startDate &&
            b.endDate &&
            datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)
          ) {
            offending.add(a.key);
            offending.add(b.key);
          }
        }
      }
    }
    return Array.from(offending);
  }, []);
  // Clear a specific field error for a row
  const clearErr = (key, field) =>
    setErrorsByKey((prev) => {
      if (!prev[key]?.[field]) return prev;
      const next = { ...prev, [key]: { ...(prev[key] || {}), [field]: false } };
      return next;
    });

  const addBudgetItem = (budgetItemId) => {
    setRows((prev) => {
      const newRow = {
        key: nanoid(8),
        resourceId: "",
        budgetItemId: String(budgetItemId || ""),
        assignmentPct: 0,
        assignedHoursPerWeek: 0,
        startDate: "",
        endDate: "",
        dueDate: "",
        role: "",
        rateOverride: 0,
        notes: "",
        assignmentId: undefined,
      };
      return [...prev, newRow];
    });
  };

  const removeRow = (key) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      setOverlapKeys(computeOverlapKeys(next));
      return next;
    });
  };

  // --- Normalisation helpers and baseline map for diffing ---
  const toNullIfEmpty = (v) => (v === "" || v == null ? null : v);
  const toNumberOrNull = (v) => (v === "" || v == null ? null : Number(v));
  // Remove null/undefined/empty-string values from an object

  // Assignment field config for payloadSanitiser
  const assignmentFieldConfig = [
    { key: "resourceId", inputType: "text" },
    { key: "budgetItemId", inputType: "text" },
    { key: "assignmentPct", inputType: "text" },
    { key: "assignedHoursPerWeek", inputType: "text" },
    { key: "startDate", inputType: "date" },
    { key: "endDate", inputType: "date" },
    { key: "dueDate", inputType: "date" },
    { key: "role", inputType: "text" },
    { key: "rateOverride", inputType: "text" },
    { key: "notes", inputType: "text" },
  ];

  const normaliseRow = useCallback(
    (r) => ({
      resourceId: String(r.resourceId),
      budgetItemId: r.budgetItemId ? String(r.budgetItemId) : "",
      assignmentPct: Number(r.assignmentPct || 0),
      assignedHoursPerWeek: toNumberOrNull(r.assignedHoursPerWeek),
      startDate: toNullIfEmpty(r.startDate),
      endDate: toNullIfEmpty(r.endDate),
      dueDate: toNullIfEmpty(r.dueDate),
      role: toNullIfEmpty(r.role),
      rateOverride: toNumberOrNull(r.rateOverride),
      notes: toNullIfEmpty(r.notes),
    }),
    []
  );

  const baselineById = useMemo(() => {
    const list = initialAssignments || [];
    return Object.fromEntries(list.map((a) => [String(a.id), normaliseRow(a)]));
  }, [initialAssignments, normaliseRow]);

  // Local baseline override for per-row save
  const [baselineOverride, setBaselineOverride] = useState({});

  // Re-hydrate rows when initialAssignments changes (e.g., after async fetch)
  useEffect(() => {
    const next = (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      budgetItemId: a.budgetItemId || "",
      assignmentPct: a.assignmentPct ?? 0,
      assignedHoursPerWeek: a.assignedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }));
    setRows(next);
    setBaselineOverride({});
    setOverlapKeys(computeOverlapKeys(next));
  }, [computeOverlapKeys, initialAssignments]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!trackableId) {
        setBudgetItems([]);
        return;
      }
      try {
        setLoadingBudgetItems(true);
        const b = await getActiveBudgetByTrackable(String(trackableId));
        if (!b?.id) {
          if (!ignore) setBudgetItems([]);
          return;
        }
        if (!ignore) setBudgetCurrency(String(b.currency || ""));
        const items = await listBudgetItemLabels(String(b.id));
        if (!ignore) setBudgetItems(Array.isArray(items) ? items : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load budget items", e);
        if (!ignore) setBudgetItems([]);
      } finally {
        if (!ignore) setLoadingBudgetItems(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [trackableId]);

  // Notify parent when totals change (keeps chips in sync in real time)
  useEffect(() => {
    if (typeof onSummaryChange === "function") {
      onSummaryChange({ assignedHours: assignedHoursTotal, assignedCount });
    }
  }, [assignedHoursTotal, assignedCount, onSummaryChange]);

  // Stream full rows up (so parent can recompute planned/remaining against budget)
  useEffect(() => {
    if (typeof onRowsChange === "function") {
      onRowsChange(rows);
    }
  }, [rows, onRowsChange]);

  // Helper to get effective baseline for a given row id (assignmentId)
  const getBaselineForId = useCallback(
    (id) => baselineOverride[String(id)] ?? baselineById[String(id)] ?? {},
    [baselineOverride, baselineById]
  );

  // Per-row save handler (PATCHes only changed fields, updates local baseline)
  const saveRow = async (rowKey) => {
    const row = rows.find((r) => r.key === rowKey);
    if (!row) return;
    // Removed early guard that prevented creating new rows
    if (!row.assignmentId) {
      // create new assignment for this row
      const norm = normaliseRow(row);
      const miss = {
        resourceId: !norm.resourceId,
        assignmentPct:
          row.assignmentPct === "" ||
          row.assignmentPct === null ||
          Number.isNaN(Number(row.assignmentPct)) ||
          Number(row.assignmentPct) <= 0 ||
          Number(row.assignmentPct) > 100,
        startDate: !row.startDate,
        endDate: !row.endDate,
        dueDate: !row.dueDate,
      };
      if (
        miss.resourceId ||
        miss.assignmentPct ||
        miss.startDate ||
        miss.endDate ||
        miss.dueDate
      ) {
        setErrorsByKey((prev) => ({ ...prev, [row.key]: miss }));
        showAlert(
          "Select a Resource, set Assignment % between 1 and 100, and complete Start, End and Due date before saving this row.",
          "warning"
        );
        return;
      }
      try {
        const raw = {
          resourceId: norm.resourceId,
          budgetItemId: norm.budgetItemId,
          // trackableId removed from payload
          assignmentPct: norm.assignmentPct,
          assignedHoursPerWeek: norm.assignedHoursPerWeek,
          startDate: norm.startDate,
          endDate: norm.endDate,
          dueDate: norm.dueDate,
          role: norm.role,
          rateOverride: norm.rateOverride,
          notes: norm.notes,
        };
        const sanitised = payloadSanitiser(raw, assignmentFieldConfig);
        const filtered = Object.fromEntries(
          Object.entries(sanitised).filter(([, v]) => v !== null && v !== "")
        );
        const created = await createAssignment({
          ...filtered,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
        const newId =
          created?.id || created?.assignment?.id || created?.data?.id;
        setRows((prev) =>
          prev.map((r) =>
            r.key === row.key ? { ...r, assignmentId: newId } : r
          )
        );
        setBaselineOverride((prev) => ({ ...prev, [String(newId)]: norm }));
        showAlert("Row created.", "success");
        return;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to create row", e);
        showAlert("Failed to create row.", "error");
        return;
      }
    }

    // required field guard (single row)
    const miss = {
      resourceId: !row.resourceId,
      assignmentPct:
        row.assignmentPct === "" ||
        row.assignmentPct === null ||
        Number.isNaN(Number(row.assignmentPct)) ||
        Number(row.assignmentPct) <= 0 ||
        Number(row.assignmentPct) > 100,
      startDate: !row.startDate,
      endDate: !row.endDate,
      dueDate: !row.dueDate,
    };
    if (
      miss.resourceId ||
      miss.assignmentPct ||
      miss.startDate ||
      miss.endDate ||
      miss.dueDate
    ) {
      setErrorsByKey((prev) => ({ ...prev, [row.key]: miss }));
      showAlert(
        "Select a Resource, set Assignment % between 1 and 100, and complete Start, End and Due date before saving this row.",
        "warning"
      );
      return;
    }

    const norm = normaliseRow(row);
    const base = getBaselineForId(row.assignmentId);
    const diff = diffObjects(norm, base);
    const core = {
      resourceId: norm.resourceId,
      budgetItemId: norm.budgetItemId,
      assignmentPct: norm.assignmentPct, // ensure present on updates
    };
    const sanitised = payloadSanitiser(
      { ...core, ...diff },
      assignmentFieldConfig
    );
    const filtered = Object.fromEntries(
      Object.entries(sanitised).filter(([, v]) => v !== null && v !== "")
    );
    if (Object.keys(filtered).length === 0) {
      showAlert("No changes to save.", "info");
      return;
    }

    try {
      await updateAssignment(String(row.assignmentId), {
        ...filtered,
        customerId: userService.userValue.customerId,
        updatedBy: userService.userValue.id,
      });
      // Update local baseline so subsequent diffs are accurate
      setBaselineOverride((prev) => ({
        ...prev,
        [String(row.assignmentId)]: norm,
      }));
      showAlert("Row saved.", "success");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save row", e);
      showAlert("Failed to save row.", "error");
    }
  };

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Assignments
        </Typography>
        {!trackableId ? (
          <Typography color="text.secondary">
            Save the trackable first to assign resources.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {/* Two-pane layout: Sections (left) + Items for selected section (right) */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="stretch"
            >
              {/* Left: Sections panel in an Accordion (mirrors BudgetBuilder) */}
              <Box
                sx={{
                  flex: "0 0 auto",
                  width: { xs: "100%", md: sectionsCollapsed ? 48 : 220 },
                  height: "100%",
                  position: "relative",
                  transition: (theme) =>
                    theme.transitions.create("width", {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
              >
                <Accordion
                  expanded={!sectionsCollapsed}
                  onChange={(_, exp) => setSectionsCollapsed(!exp)}
                  square
                  disableGutters
                  sx={{
                    height: "100%",
                    "& .MuiAccordion-region": { height: "100%" },
                    "& .MuiAccordionDetails-root": { height: "100%", p: 0 },
                  }}
                >
                  <AccordionSummary expandIcon={<ChevronRightIcon />} />
                  <AccordionDetails sx={{ p: 0 }}>
                    <AssignmentSection
                      sections={sections}
                      selectedSectionId={String(selectedSection)}
                      onSelect={(id) => setSelectedSection(String(id))}
                      addDisabled
                      collapsed={sectionsCollapsed}
                      onToggleCollapse={() => setSectionsCollapsed((v) => !v)}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* Right: Items for the selected section (budget-style toolbar + table) */}
              <Paper
                variant="outlined"
                sx={{ flex: 1, minWidth: 0, overflowX: "auto" }}
              >
                <Box p={2}>
                  {!selectedSection ? (
                    <Typography color="text.secondary">No sections.</Typography>
                  ) : (
                    <>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >{`Items — ${String(selectedSection)}`}</Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          justifyContent="flex-end"
                        >
                          <Chip
                            size="small"
                            label={`Assignments: ${rowsForSelected.length}`}
                          />
                          <Chip
                            size="small"
                            label={`Hours/week: ${selectedAssignedHours}`}
                          />
                          {(() => {
                            const sectionAssignedDollars = (
                              rowsForSelected || []
                            ).reduce((sum, r) => {
                              const hrs = Number(r.assignedHoursPerWeek) || 0;
                              const rate = rateByResourceId(r.resourceId);
                              return sum + hrs * rate;
                            }, 0);
                            const sectionBudgetDollars = (
                              budgetItemsForSection || []
                            ).reduce((sum, bi) => {
                              const h = Number(bi.hours);
                              const rt = Number(bi.rate);
                              return Number.isFinite(h) && Number.isFinite(rt)
                                ? sum + h * rt
                                : sum;
                            }, 0);
                            const hasBudget$ = sectionBudgetDollars > 0;
                            const label = hasBudget$
                              ? `Assigned $ / Budget $: ${formatCurrency(sectionAssignedDollars)} / ${formatCurrency(sectionBudgetDollars)}`
                              : `Assigned $/week: ${formatCurrency(sectionAssignedDollars)}`;
                            return <Chip size="small" label={label} />;
                          })()}
                        </Stack>
                      </Stack>
                      <Divider sx={{ my: 1 }} />

                      {(budgetItemsForSection || []).length === 0 ? (
                        <Typography color="text.secondary">
                          No budget items in this section.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {budgetItemsForSection.map((bi) => {
                            const list =
                              rowsByBudgetItemId[String(bi.id)] || [];
                            const hrs = list.reduce(
                              (s, r) =>
                                s + (Number(r.assignedHoursPerWeek) || 0),
                              0
                            );
                            const isOpen = !!expandedMap[String(bi.id)];
                            return (
                              <Paper
                                key={bi.id}
                                variant="outlined"
                                sx={{ overflowX: "auto" }}
                              >
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: (t) =>
                                      t.palette.action.hover,
                                  }}
                                >
                                  <Stack spacing={0.25}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {bi.budgetItemLabel}
                                    </Typography>
                                    {bi.purpose ? (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Purpose: {bi.purpose}
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Chip
                                      size="small"
                                      label={`Assignments: ${list.length}`}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Hours/week: ${hrs}`}
                                    />
                                    {(() => {
                                      // Assigned $/week across rows for this item
                                      const assignedDollars = (
                                        list || []
                                      ).reduce((s, r) => {
                                        const hrs =
                                          Number(r.assignedHoursPerWeek) || 0;
                                        const rate = rateByResourceId(
                                          r.resourceId
                                        );
                                        return s + hrs * rate;
                                      }, 0);
                                      // Budget $ target if `hours` and `rate` are available on the budget item
                                      const hasBudget =
                                        Number.isFinite(Number(bi.hours)) &&
                                        Number.isFinite(Number(bi.rate));
                                      const budgetDollars = hasBudget
                                        ? Number(bi.hours) * Number(bi.rate)
                                        : null;
                                      const label = hasBudget
                                        ? `${formatCurrency(assignedDollars)} / ${formatCurrency(budgetDollars)}`
                                        : `${formatCurrency(assignedDollars)}`;
                                      return (
                                        <Chip
                                          size="small"
                                          label={
                                            hasBudget
                                              ? `Assigned $ / Budget $: ${label}`
                                              : `Assigned $/week: ${label}`
                                          }
                                        />
                                      );
                                    })()}
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleExpanded(bi.id)}
                                      aria-label={
                                        isOpen ? "Collapse" : "Expand"
                                      }
                                    >
                                      <ExpandMore
                                        sx={{
                                          transform: isOpen
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                          transition: "transform 150ms",
                                        }}
                                      />
                                    </IconButton>
                                  </Stack>
                                </Box>
                                <Collapse
                                  in={isOpen}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box
                                    sx={{
                                      px: 2,
                                      py: 1,
                                      overflowX: "auto",
                                      overflowY: "auto",
                                      maxHeight: 420,
                                    }}
                                  >
                                    <Table
                                      stickyHeader
                                      size="small"
                                      sx={{
                                        tableLayout: "auto",
                                        minWidth: 960,
                                      }}
                                    >
                                      <TableHead>
                                        <TableRow>
                                          {[
                                            "Resource",
                                            "Assignment\u00A0%",
                                            "Hours/week",
                                            "Start",
                                            "End",
                                            "Due date",
                                            "Notes",
                                            "Actions",
                                          ].map((label) => (
                                            <TableCell
                                              key={label}
                                              align={"left"}
                                            >
                                              {label}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {list.length === 0 ? (
                                          <TableRow>
                                            <TableCell colSpan={8}>
                                              <Typography color="text.secondary">
                                                No assignments for this budget
                                                item.
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ) : (
                                          list.map((row) => {
                                            const resOptions =
                                              filterResourcesByRow(row);
                                            const safeResourceId = (
                                              resOptions || []
                                            ).some(
                                              (opt) =>
                                                String(opt.id) ===
                                                String(row.resourceId)
                                            )
                                              ? String(row.resourceId)
                                              : "";
                                            return (
                                              <TableRow
                                                key={row.key}
                                                sx={{
                                                  backgroundColor:
                                                    flashRowKey === row.key
                                                      ? (theme) =>
                                                          theme.palette.success
                                                            .light + "33"
                                                      : overlapKeys.includes(
                                                            row.key
                                                          )
                                                        ? (theme) =>
                                                            theme.palette.error
                                                              .light + "33"
                                                        : undefined,
                                                  transition:
                                                    "background-color 300ms",
                                                }}
                                              >
                                                <TableCell
                                                  sx={{ minWidth: 220 }}
                                                >
                                                  {resOptions.length > 0 ? (
                                                    <FormControl
                                                      fullWidth
                                                      size="small"
                                                      required
                                                    >
                                                      <Select
                                                        value={safeResourceId}
                                                        displayEmpty
                                                        inputRef={(el) => {
                                                          if (el)
                                                            selectRefs.current[
                                                              row.key
                                                            ] = el;
                                                        }}
                                                        onChange={(e) => {
                                                          const val = String(
                                                            e.target.value || ""
                                                          );
                                                          if (
                                                            val === "__add__"
                                                          ) {
                                                            // open dialog without changing selection
                                                            openAddResourceForRow(
                                                              row
                                                            );
                                                            return;
                                                          }
                                                          clearErr(
                                                            row.key,
                                                            "resourceId"
                                                          );
                                                          setRows((prev) =>
                                                            prev.map((r) =>
                                                              r.key === row.key
                                                                ? {
                                                                    ...r,
                                                                    resourceId:
                                                                      val,
                                                                  }
                                                                : r
                                                            )
                                                          );
                                                        }}
                                                        error={
                                                          !!errorsByKey[row.key]
                                                            ?.resourceId
                                                        }
                                                      >
                                                        <MenuItem value="">
                                                          <em>Select…</em>
                                                        </MenuItem>
                                                        {resOptions.map((r) => (
                                                          <MenuItem
                                                            key={r.id}
                                                            value={String(r.id)}
                                                          >
                                                            {r.name}
                                                          </MenuItem>
                                                        ))}
                                                        <MenuItem value="__add__">
                                                          <em>Add resource…</em>
                                                        </MenuItem>
                                                      </Select>
                                                    </FormControl>
                                                  ) : (
                                                    <Box>
                                                      <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                      >
                                                        No resources match the
                                                        role for this budget
                                                        item.
                                                      </Typography>
                                                      <Button
                                                        size="small"
                                                        sx={{
                                                          ml: 0,
                                                          mt: 0.5,
                                                          p: 0,
                                                        }}
                                                        onClick={() =>
                                                          openAddResourceForRow(
                                                            row
                                                          )
                                                        }
                                                      >
                                                        Add resource…
                                                      </Button>
                                                    </Box>
                                                  )}
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{ width: 120 }}
                                                >
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    inputProps={{
                                                      min: 1,
                                                      max: 100,
                                                      step: 1,
                                                    }}
                                                    value={row.assignmentPct}
                                                    onChange={(e) => {
                                                      const v = e.target.value;
                                                      clearErr(
                                                        row.key,
                                                        "assignmentPct"
                                                      );
                                                      setRows((prev) =>
                                                        prev.map((r) =>
                                                          r.key === row.key
                                                            ? {
                                                                ...r,
                                                                assignmentPct:
                                                                  v,
                                                              }
                                                            : r
                                                        )
                                                      );
                                                    }}
                                                    error={
                                                      !!errorsByKey[row.key]
                                                        ?.assignmentPct
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{ width: 120 }}
                                                >
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    inputProps={{
                                                      min: 0,
                                                      step: 0.5,
                                                    }}
                                                    value={
                                                      row.assignedHoursPerWeek
                                                    }
                                                    onChange={(e) =>
                                                      setRows((prev) =>
                                                        prev.map((r) =>
                                                          r.key === row.key
                                                            ? {
                                                                ...r,
                                                                assignedHoursPerWeek:
                                                                  e.target
                                                                    .value,
                                                              }
                                                            : r
                                                        )
                                                      )
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{ width: 150 }}
                                                >
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="date"
                                                    value={row.startDate}
                                                    InputLabelProps={{
                                                      shrink: true,
                                                    }}
                                                    onChange={(e) => {
                                                      clearErr(
                                                        row.key,
                                                        "startDate"
                                                      );
                                                      setRows((prev) => {
                                                        const next = prev.map(
                                                          (r) =>
                                                            r.key === row.key
                                                              ? {
                                                                  ...r,
                                                                  startDate:
                                                                    e.target
                                                                      .value,
                                                                }
                                                              : r
                                                        );
                                                        setOverlapKeys(
                                                          computeOverlapKeys(
                                                            next
                                                          )
                                                        );
                                                        return next;
                                                      });
                                                    }}
                                                    error={
                                                      !!errorsByKey[row.key]
                                                        ?.startDate ||
                                                      overlapKeys.includes(
                                                        row.key
                                                      )
                                                    }
                                                    helperText={
                                                      errorsByKey[row.key]
                                                        ?.startDate
                                                        ? "Required"
                                                        : overlapKeys.includes(
                                                              row.key
                                                            )
                                                          ? "Overlaps another assignment"
                                                          : undefined
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{ width: 150 }}
                                                >
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="date"
                                                    value={row.endDate}
                                                    InputLabelProps={{
                                                      shrink: true,
                                                    }}
                                                    onChange={(e) => {
                                                      clearErr(
                                                        row.key,
                                                        "endDate"
                                                      );
                                                      setRows((prev) => {
                                                        const next = prev.map(
                                                          (r) =>
                                                            r.key === row.key
                                                              ? {
                                                                  ...r,
                                                                  endDate:
                                                                    e.target
                                                                      .value,
                                                                }
                                                              : r
                                                        );
                                                        setOverlapKeys(
                                                          computeOverlapKeys(
                                                            next
                                                          )
                                                        );
                                                        return next;
                                                      });
                                                    }}
                                                    error={
                                                      !!errorsByKey[row.key]
                                                        ?.endDate ||
                                                      overlapKeys.includes(
                                                        row.key
                                                      )
                                                    }
                                                    helperText={
                                                      errorsByKey[row.key]
                                                        ?.endDate
                                                        ? "Required"
                                                        : overlapKeys.includes[
                                                              row.key
                                                            ]
                                                          ? "Overlaps another assignment"
                                                          : undefined
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell sx={{ width: 150 }}>
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="date"
                                                    value={row.dueDate}
                                                    InputLabelProps={{
                                                      shrink: true,
                                                    }}
                                                    onChange={(e) => {
                                                      clearErr(
                                                        row.key,
                                                        "dueDate"
                                                      );
                                                      setRows((prev) =>
                                                        prev.map((r) =>
                                                          r.key === row.key
                                                            ? {
                                                                ...r,
                                                                dueDate:
                                                                  e.target
                                                                    .value,
                                                              }
                                                            : r
                                                        )
                                                      );
                                                    }}
                                                    error={
                                                      !!errorsByKey[row.key]
                                                        ?.dueDate
                                                    }
                                                    helperText={
                                                      errorsByKey[row.key]
                                                        ?.dueDate
                                                        ? "Required"
                                                        : undefined
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell
                                                  sx={{ minWidth: 240 }}
                                                >
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={row.notes}
                                                    onChange={(e) =>
                                                      setRows((prev) =>
                                                        prev.map((r) =>
                                                          r.key === row.key
                                                            ? {
                                                                ...r,
                                                                notes:
                                                                  e.target
                                                                    .value,
                                                              }
                                                            : r
                                                        )
                                                      )
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell
                                                  sx={{ whiteSpace: "nowrap" }}
                                                >
                                                  <Stack
                                                    direction="row"
                                                    spacing={1}
                                                  >
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      onClick={() =>
                                                        saveRow(row.key)
                                                      }
                                                    >
                                                      Save
                                                    </Button>
                                                    <Button
                                                      size="small"
                                                      color="error"
                                                      onClick={() =>
                                                        removeRow(row.key)
                                                      }
                                                    >
                                                      Remove
                                                    </Button>
                                                  </Stack>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })
                                        )}
                                        <TableRow>
                                          <TableCell colSpan={8}>
                                            <Button
                                              size="small"
                                              startIcon={<AddIcon />}
                                              onClick={() =>
                                                addBudgetItem(bi.id)
                                              }
                                            >
                                              Add assignment
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </Paper>
                            );
                          })}
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Stack>
        )}
      </Box>
      {/* Quick Add Resource Dialog */}
      <ResourceQuickDialog
        open={addResOpen}
        defaults={addResDefaults}
        onClose={closeAddResource}
        onCreated={(created) => {
          setLocalResources((prev) => {
            const exists = (prev || []).some(
              (r) => String(r.id) === String(created.id)
            );
            return exists ? prev : [...(prev || []), created];
          });
          if (addResDefaults.rowKey) {
            setRows((prev) =>
              prev.map((r) =>
                r.key === addResDefaults.rowKey
                  ? { ...r, resourceId: String(created.id) }
                  : r
              )
            );
            setFlashRowKey(addResDefaults.rowKey);
            setTimeout(() => {
              const el = selectRefs.current?.[addResDefaults.rowKey];
              try {
                el && el.focus();
              } catch {}
            }, 0);
          }
        }}
      />
    </Paper>
  );
}
