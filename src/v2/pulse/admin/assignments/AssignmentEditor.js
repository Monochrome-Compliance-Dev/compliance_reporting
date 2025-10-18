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
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  useMediaQuery,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import AssignmentSection from "./AssignmentSection";

import { useTheme } from "@mui/material/styles";
import { userService } from "services";
import { nanoid } from "nanoid";
import { useAlert } from "context";
import {
  updateAssignment,
  createAssignment,
  getActiveBudgetByTrackable,
  listBudgetItemLabels,
  createResource,
} from "../../services/pulseApi";

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

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudgetItems, setLoadingBudgetItems] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);

  const [addAnchor, setAddAnchor] = useState(null);
  const addMenuOpen = Boolean(addAnchor);
  const openAddMenu = (e) => setAddAnchor(e.currentTarget);
  const closeAddMenu = () => setAddAnchor(null);
  const handleAddBudgetItem = (bid) => {
    if (!bid) return;
    addBudgetItem(String(bid));
    closeAddMenu();
  };

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
  const addableForSelected = useMemo(
    () =>
      (budgetItemsForSection || []).filter(
        (bi) =>
          !(rows || []).some((r) => String(r.budgetItemId) === String(bi.id))
      ),
    [budgetItemsForSection, rows]
  );

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
  const [errorsByKey, setErrorsByKey] = useState({});

  const [overlapKeys, setOverlapKeys] = useState([]);

  // Quick-add Resource modal state
  const [addResOpen, setAddResOpen] = useState(false);
  const [addResDefaults, setAddResDefaults] = useState({
    role: "",
    rowKey: null,
    budgetItemId: "",
  });
  const [addResForm, setAddResForm] = useState({
    name: "",
    email: "",
    roleTitle: "",
    hourlyRate: "",
  });

  const openAddResourceForRow = (row) => {
    const bi = budgetItemById[String(row.budgetItemId)];
    const label = (bi?.budgetItemLabel || "").trim();
    setAddResDefaults({
      role: label,
      rowKey: row.key,
      budgetItemId: String(row.budgetItemId || ""),
    });
    setAddResForm({ name: "", email: "", roleTitle: label, hourlyRate: "" });
    setAddResOpen(true);
  };
  const closeAddResource = () => setAddResOpen(false);

  const handleCreateResource = async () => {
    // Use parent hook if provided, otherwise call API directly
    const creator =
      typeof onQuickAddResource === "function"
        ? onQuickAddResource
        : async (p) =>
            createResource({
              ...p,
              customerId: userService.userValue.customerId,
              createdBy: userService.userValue.id,
            });

    try {
      const payload = {
        name: addResForm.name?.trim(),
        email: addResForm.email?.trim() || undefined,
        roleTitle: addResForm.roleTitle?.trim() || addResDefaults.role,
        position: addResForm.roleTitle?.trim() || addResDefaults.role,
        hourlyRate:
          addResForm.hourlyRate === ""
            ? undefined
            : Number(addResForm.hourlyRate),
      };

      const created = await creator(payload);
      if (!created || !created.id) {
        showAlert("Failed to create resource.", "error");
        return;
      }

      // Add to in-memory list and auto-select for the originating row
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
        // Tiny UX nicety: flash and focus the resource select on the newly updated row
        setFlashRowKey(addResDefaults.rowKey);
        setTimeout(() => {
          const el = selectRefs.current?.[addResDefaults.rowKey];
          if (el) {
            try {
              el.focus();
            } catch {}
          }
        }, 0);
      }
      setAddResOpen(false);
      showAlert("Resource added.", "success");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Quick resource add failed", e);
      showAlert("Failed to add resource.", "error");
    }
  };

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

  const handleSave = async () => {
    // validate: required fields per row
    const byRes = rows.reduce((acc, r) => {
      (acc[r.resourceId] ||= []).push(r);
      return acc;
    }, {});

    // required fields: resourceId, assignmentPct, startDate, endDate, dueDate
    const missingMap = {};
    let hasMissing = false;
    for (const r of rows) {
      const miss = {
        resourceId: !r.resourceId,
        assignmentPct:
          r.assignmentPct === "" ||
          r.assignmentPct === null ||
          Number.isNaN(Number(r.assignmentPct)) ||
          Number(r.assignmentPct) <= 0 ||
          Number(r.assignmentPct) > 100,
        startDate: !r.startDate,
        endDate: !r.endDate,
        dueDate: !r.dueDate,
      };
      if (
        miss.resourceId ||
        miss.assignmentPct ||
        miss.startDate ||
        miss.endDate ||
        miss.dueDate
      ) {
        missingMap[r.key] = miss;
        hasMissing = true;
      }
    }
    if (hasMissing) {
      setErrorsByKey(missingMap);
      showAlert(
        "Please select a Resource, set Assignment % between 1 and 100, and complete Start, End and Due dates for all assignments.",
        "warning"
      );
      return; // abort save
    }
    setErrorsByKey({});

    // validate: no overlapping date ranges per resource
    const offending = new Set();
    for (const rid of Object.keys(byRes)) {
      const entries = byRes[rid];
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
            offending.add(a.key);
            offending.add(b.key);
          }
        }
      }
    }

    if (offending.size > 0) {
      setOverlapKeys(Array.from(offending));
      showAlert(
        "Overlapping assignments for the same resource. Set non-overlapping dates.",
        "warning"
      );
      return; // abort save
    } else {
      setOverlapKeys([]);
    }

    // Build assignments: create = full, edit = diff only, using payloadSanitiser and filtering out null/empty
    const assignments = rows.map((r) => {
      const norm = normaliseRow(r);

      if (!r.assignmentId) {
        // CREATE: send full payload, sanitised, filter out null/empty
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
        // Remove null or empty string keys
        const filtered = Object.fromEntries(
          Object.entries(sanitised).filter(([, v]) => v !== null && v !== "")
        );
        return {
          ...filtered,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        };
      }

      // EDIT: only send changed fields (PATCH semantics)
      const base = baselineById[String(r.assignmentId)] || {};
      const diff = diffObjects(norm, base);
      // Always include required foreign keys for PUT validators
      const core = {
        resourceId: norm.resourceId,
        budgetItemId: norm.budgetItemId,
        assignmentPct: norm.assignmentPct, // always include for PUT validation
      };
      const sanitised = payloadSanitiser(
        { ...core, ...diff },
        assignmentFieldConfig
      );
      const filtered = Object.fromEntries(
        Object.entries(sanitised).filter(([, v]) => v !== null && v !== "")
      );
      if (Object.keys(filtered).length === 0) {
        return null; // skip no-op
      }
      return {
        id: String(r.assignmentId),
        ...filtered,
        customerId: userService.userValue.customerId,
        updatedBy: userService.userValue.id,
      };
    });

    // Filter out any nulls (no-op edits) before sending to onSave
    const filtered = assignments.filter(Boolean);
    await onSave?.(filtered);
  };

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
                  width: { xs: "100%", md: sectionsCollapsed ? 48 : 360 },
                  height: "100%",
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
                        >
                          {`Items — ${String(selectedSection)}`}
                        </Typography>
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
                          <IconButton
                            size="small"
                            onClick={openAddMenu}
                            aria-controls={
                              addMenuOpen ? "assignments-add-menu" : undefined
                            }
                            aria-haspopup="true"
                            aria-expanded={addMenuOpen ? "true" : undefined}
                          >
                            <AddIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Divider sx={{ my: 1 }} />

                      <Menu
                        id="assignments-add-menu"
                        anchorEl={addAnchor}
                        open={addMenuOpen}
                        onClose={closeAddMenu}
                        keepMounted
                      >
                        {addableForSelected.length === 0 ? (
                          <MenuItem disabled>
                            No budget items available
                          </MenuItem>
                        ) : (
                          addableForSelected.map((bi) => (
                            <MenuItem
                              key={bi.id}
                              onClick={() => handleAddBudgetItem(bi.id)}
                            >
                              {`${trackableName} — ${bi.sectionName} — ${bi.budgetItemLabel}`}
                            </MenuItem>
                          ))
                        )}
                      </Menu>

                      <Table
                        size="small"
                        sx={{ tableLayout: "auto", minWidth: 1000 }}
                        stickyHeader
                      >
                        <TableHead>
                          <TableRow>
                            {[
                              "Budget item",
                              "Resource",
                              "Assignment %",
                              "Hours/week",
                              "Start",
                              "End",
                              "Due date",
                              "Role",
                              "Rate override",
                              "Notes",
                              "Actions",
                            ].map((label, idx) => (
                              <TableCell
                                key={label}
                                align={idx >= 2 && idx <= 5 ? "right" : "left"}
                              >
                                {label}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rowsForSelected.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography color="text.secondary">
                                    No assignments for this section.
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={openAddMenu}
                                  >
                                    Add budget item
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            rowsForSelected.map((row) => {
                              const bi =
                                budgetItemById[String(row.budgetItemId)];
                              const resOptions = filterResourcesByRow(row);
                              const safeResourceId = (resOptions || []).some(
                                (opt) =>
                                  String(opt.id) === String(row.resourceId)
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
                                            theme.palette.success.light + "33"
                                        : overlapKeys.includes(row.key)
                                          ? (theme) =>
                                              theme.palette.error.light + "33"
                                          : undefined,
                                    transition: "background-color 300ms",
                                  }}
                                >
                                  <TableCell sx={{ minWidth: 280 }}>
                                    {bi
                                      ? `${trackableName} — ${bi.sectionName} — ${bi.budgetItemLabel}`
                                      : row.budgetItemId}
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 220 }}>
                                    <FormControl
                                      fullWidth
                                      size="small"
                                      required
                                    >
                                      <InputLabel id={`res-${row.key}`} shrink>
                                        Resource
                                      </InputLabel>
                                      <Select
                                        labelId={`res-${row.key}`}
                                        label="Resource"
                                        value={safeResourceId}
                                        displayEmpty
                                        disabled={
                                          loadingBudgetItems ||
                                          resOptions.length === 0
                                        }
                                        inputRef={(el) => {
                                          if (el)
                                            selectRefs.current[row.key] = el;
                                        }}
                                        onChange={(e) => {
                                          const val = String(
                                            e.target.value || ""
                                          );
                                          clearErr(row.key, "resourceId");
                                          setRows((prev) =>
                                            prev.map((r) =>
                                              r.key === row.key
                                                ? { ...r, resourceId: val }
                                                : r
                                            )
                                          );
                                        }}
                                        error={
                                          !!errorsByKey[row.key]?.resourceId
                                        }
                                        renderValue={(val) => {
                                          if (!val)
                                            return (
                                              <em>
                                                {resOptions.length === 0
                                                  ? "No matching resources"
                                                  : "Select…"}
                                              </em>
                                            );
                                          const opt = (resOptions || []).find(
                                            (o) => String(o.id) === String(val)
                                          );
                                          return opt ? opt.name : "";
                                        }}
                                      >
                                        <MenuItem
                                          value=""
                                          disabled={resOptions.length === 0}
                                        >
                                          <em>
                                            {resOptions.length === 0
                                              ? "No matching resources"
                                              : "Select…"}
                                          </em>
                                        </MenuItem>
                                        {resOptions.map((r) => (
                                          <MenuItem
                                            key={r.id}
                                            value={String(r.id)}
                                          >
                                            {r.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {resOptions.length === 0 && (
                                        <FormHelperText>
                                          No resources match the role for this
                                          budget item.
                                          <Button
                                            size="small"
                                            sx={{ ml: 1, mt: 0.5, p: 0 }}
                                            onClick={() =>
                                              openAddResourceForRow(row)
                                            }
                                          >
                                            Add resource…
                                          </Button>
                                        </FormHelperText>
                                      )}
                                    </FormControl>
                                  </TableCell>
                                  <TableCell align="right" sx={{ width: 140 }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 1, max: 100, step: 1 }}
                                      value={row.assignmentPct}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        clearErr(row.key, "assignmentPct");
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? { ...r, assignmentPct: v }
                                              : r
                                          )
                                        );
                                      }}
                                      error={
                                        !!errorsByKey[row.key]?.assignmentPct
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ width: 140 }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 0, step: 0.5 }}
                                      value={row.assignedHoursPerWeek}
                                      onChange={(e) =>
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? {
                                                  ...r,
                                                  assignedHoursPerWeek:
                                                    e.target.value,
                                                }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: 150 }} align="right">
                                    <TextField
                                      fullWidth
                                      label="Start"
                                      size="small"
                                      type="date"
                                      value={row.startDate}
                                      InputLabelProps={{ shrink: true }}
                                      onChange={(e) => {
                                        clearErr(row.key, "startDate");
                                        setRows((prev) => {
                                          const next = prev.map((r) =>
                                            r.key === row.key
                                              ? {
                                                  ...r,
                                                  startDate: e.target.value,
                                                }
                                              : r
                                          );
                                          setOverlapKeys(
                                            computeOverlapKeys(next)
                                          );
                                          return next;
                                        });
                                      }}
                                      error={
                                        !!errorsByKey[row.key]?.startDate ||
                                        overlapKeys.includes(row.key)
                                      }
                                      helperText={
                                        errorsByKey[row.key]?.startDate
                                          ? "Required"
                                          : overlapKeys.includes(row.key)
                                            ? "Overlaps another assignment"
                                            : undefined
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: 150 }} align="right">
                                    <TextField
                                      fullWidth
                                      label="End"
                                      size="small"
                                      type="date"
                                      value={row.endDate}
                                      InputLabelProps={{ shrink: true }}
                                      onChange={(e) => {
                                        clearErr(row.key, "endDate");
                                        setRows((prev) => {
                                          const next = prev.map((r) =>
                                            r.key === row.key
                                              ? {
                                                  ...r,
                                                  endDate: e.target.value,
                                                }
                                              : r
                                          );
                                          setOverlapKeys(
                                            computeOverlapKeys(next)
                                          );
                                          return next;
                                        });
                                      }}
                                      error={
                                        !!errorsByKey[row.key]?.endDate ||
                                        overlapKeys.includes(row.key)
                                      }
                                      helperText={
                                        errorsByKey[row.key]?.endDate
                                          ? "Required"
                                          : overlapKeys.includes(row.key)
                                            ? "Overlaps another assignment"
                                            : undefined
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: 150 }}>
                                    <TextField
                                      fullWidth
                                      label="Due date"
                                      size="small"
                                      type="date"
                                      value={row.dueDate}
                                      InputLabelProps={{ shrink: true }}
                                      onChange={(e) => {
                                        clearErr(row.key, "dueDate");
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? {
                                                  ...r,
                                                  dueDate: e.target.value,
                                                }
                                              : r
                                          )
                                        );
                                      }}
                                      error={!!errorsByKey[row.key]?.dueDate}
                                      helperText={
                                        errorsByKey[row.key]?.dueDate
                                          ? "Required"
                                          : undefined
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: 180 }}>
                                    <TextField
                                      fullWidth
                                      label="Role"
                                      size="small"
                                      value={row.role}
                                      onChange={(e) =>
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? { ...r, role: e.target.value }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: 160 }} align="right">
                                    <TextField
                                      fullWidth
                                      label="Rate override"
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 0, step: 1 }}
                                      value={row.rateOverride}
                                      onChange={(e) =>
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? {
                                                  ...r,
                                                  rateOverride: e.target.value,
                                                }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 240 }}>
                                    <TextField
                                      fullWidth
                                      label="Notes"
                                      size="small"
                                      value={row.notes}
                                      onChange={(e) =>
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.key === row.key
                                              ? { ...r, notes: e.target.value }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => saveRow(row.key)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        onClick={() => removeRow(row.key)}
                                      >
                                        Remove
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Stack>
        )}
      </Box>
      {/* Quick Add Resource Dialog */}
      <Dialog
        open={addResOpen}
        onClose={closeAddResource}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add resource</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={addResForm.name}
              onChange={(e) =>
                setAddResForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              fullWidth
            />
            <TextField
              label="Role / Title"
              value={addResForm.roleTitle}
              onChange={(e) =>
                setAddResForm((f) => ({ ...f, roleTitle: e.target.value }))
              }
              helperText={
                addResDefaults.role
                  ? `Suggested: ${addResDefaults.role}`
                  : undefined
              }
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={addResForm.email}
              onChange={(e) =>
                setAddResForm((f) => ({ ...f, email: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Hourly rate (optional)"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={addResForm.hourlyRate}
              onChange={(e) =>
                setAddResForm((f) => ({ ...f, hourlyRate: e.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddResource}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateResource}
            disabled={!addResForm.name?.trim()}
          >
            Add resource
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
