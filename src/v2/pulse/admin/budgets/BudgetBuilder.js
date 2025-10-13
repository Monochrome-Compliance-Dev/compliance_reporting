import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BudgetSection from "./BudgetSection";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAlert } from "context";
import { userService } from "services";
import {
  getBudgetById,
  createBudget,
  updateBudget,
  listItemsByBudget,
  createItem,
  updateItem,
  deleteItem,
  listSectionsByBudget,
  createSection,
  updateSection,
  deleteSection,
  listUnlinkedBudgets,
  linkBudgetToTrackable,
  getActiveBudgetByTrackable,
} from "../../services/pulseApi";

// --- helpers ---
const toCurrency = (n, currency = "AUD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
};

const ACTIVITY_OPTIONS = [
  "Planning",
  "Risk assessment",
  "Walkthroughs",
  "Control testing",
  "Substantive testing",
  "Capex review",
  "Fixed asset verification",
  "Inventory observation",
  "Revenue testing",
  "Payroll testing",
  "Compliance testing",
  "Analytics",
  "Fieldwork",
  "Client meetings",
  "Reporting (draft)",
  "Partner/Manager review",
  "Follow-up & remediation",
  "Travel/Admin (non-billable)",
  "Other — specify",
];

// Resource levels used in the items grid
const RESOURCE_OPTIONS = [
  "Auditor (1st year)",
  "Auditor (2nd year)",
  "Auditor (3rd year)",
  "Senior",
  "Manager",
  "Senior Manager",
  "Director",
  "Partner",
];

// Sections should be chosen from the same controlled list we previously called "activities"
const SECTION_PRESETS = ACTIVITY_OPTIONS;

const defaultItem = (sectionId = null) => ({
  resourceLabel: "",
  sectionId,
  hours: 0,
  rate: 0,
  amount: 0, // flat amount (for fixed-fee rows)
  notes: "",
  billable: true,
  billingType: "hourly", // will be derived on save based on values
  order: 0,
});

const normaliseItem = (it = {}) => ({
  ...defaultItem(it.sectionId ?? null),
  ...it,
  id: it.id,
  budgetId: it.budgetId,
  sectionId: it.sectionId ?? null,
  resourceLabel: it.resourceLabel ?? it.activity ?? "",
  hours: Number(it.hours ?? 0),
  rate: Number(it.rate ?? 0),
  amount: Number(it.amount ?? 0),
  notes: it.notes ?? "",
  billable: it.billable ?? true,
  billingType: it.billingType === "fixed" ? "fixed" : "hourly",
  order: Number(it.order ?? 0),
});

export default function BudgetBuilder({ onSaved }) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Query params
  const [searchParams] = useSearchParams();
  const budgetIdFromQuery = searchParams.get("budgetId") || "";
  const isBudgetIdFromQueryRef = useRef(!!budgetIdFromQuery);
  const trackableIdFromQuery =
    searchParams.get("trackableId") || searchParams.get("id") || "";

  // Budget meta
  const [budgetId, setBudgetId] = useState(budgetIdFromQuery);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("draft"); // draft | final | archived
  const [version, setVersion] = useState(1);
  const [currency, setCurrency] = useState("AUD");
  const [notes, setNotes] = useState("");
  const isFinal = String(status).toLowerCase() === "final";

  // Sections
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [sectionsExpanded, setSectionsExpanded] = useState(true);
  // Items
  const [items, setItems] = useState([]);
  const itemsSectionRef = useRef(null);
  const itemsEndRef = useRef(null);
  const didCreateOrLinkRef = useRef(false);

  // Linkable budgets state
  const [linkableBudgets, setLinkableBudgets] = useState([]);
  const [linkableLoading, setLinkableLoading] = useState(false);
  const [selectedLinkBudgetId, setSelectedLinkBudgetId] = useState("");
  // Before a budget exists, let the user choose Create vs Link
  const [preBudgetMode, setPreBudgetMode] = useState("create"); // 'create' | 'link'
  // Effect to fetch unlinked budgets
  useEffect(() => {
    let alive = true;
    const fetchLinkables = async () => {
      if (budgetId || !trackableIdFromQuery) return;
      try {
        setLinkableLoading(true);
        const rows = await listUnlinkedBudgets();
        if (alive) setLinkableBudgets(Array.isArray(rows) ? rows : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load unlinked budgets", e);
        if (alive) setLinkableBudgets([]);
      } finally {
        if (alive) setLinkableLoading(false);
      }
    };
    fetchLinkables();
    return () => {
      alive = false;
    };
  }, [budgetId, trackableIdFromQuery]);

  // If we were opened from a Trackable, check if a budget is already linked and hydrate the builder
  useEffect(() => {
    let alive = true;
    const hydrateFromTrackable = async () => {
      if (budgetId || !trackableIdFromQuery) return;
      try {
        const existing = await getActiveBudgetByTrackable(trackableIdFromQuery);
        if (alive && existing && existing.id) {
          setBudgetId(String(existing.id));
          setName(existing.name || "");
          setStatus(existing.status || "draft");
          setVersion(Number(existing.version || 1));
          setCurrency(existing.currency || "AUD");
          setNotes(existing.notes || "");
          // If we found a budget, switch out of the pre-link mode
          setPreBudgetMode("create");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to resolve budget for trackable", e);
      }
    };
    hydrateFromTrackable();
    return () => {
      alive = false;
    };
  }, [budgetId, trackableIdFromQuery]);
  // Save single item callback
  const saveItem = useCallback(
    async (index) => {
      if (isFinal) {
        showAlert(
          "This budget is final and cannot be edited. Create a revision to make changes.",
          "info"
        );
        return;
      }
      const it = items[index];
      if (!it) return;
      // basic inline validation
      const hasResource = String(it.resourceLabel || "").trim().length > 0;
      const hours = Number(it.hours || 0);
      const rate = Number(it.rate || 0);
      const amount = Number(it.amount || 0);
      const isHourlyValid = hours > 0 && rate > 0 && amount === 0;
      const isFixedValid = amount > 0 && (hours === 0 || rate === 0);
      if (!hasResource || (!isHourlyValid && !isFixedValid)) {
        showAlert(
          "Please select a resource and enter either hours & rate OR a flat amount.",
          "warning"
        );
        return;
      }
      const payload = (() => {
        const base = {
          budgetId,
          sectionId: it.sectionId,
          sectionName: sections.find((s) => s.id === it.sectionId)?.name || "",
          resourceLabel: String(it.resourceLabel || "").trim(),
          notes: String(it.notes || "").trim() || undefined,
          billable: !!it.billable,
          customerId: userService.userValue.customerId,
          order: Number(it.order ?? 0),
        };
        if (isFixedValid) {
          return { ...base, billingType: "fixed", hours: 0, rate: 0, amount };
        }
        return { ...base, billingType: "hourly", hours, rate, amount: 0 };
      })();
      try {
        let saved;
        if (!it.id) {
          saved = await svc.current.createItem({
            ...payload,
            createdBy: userService.userValue.id,
          });
        } else {
          saved = await svc.current.updateItem(String(it.id), {
            ...payload,
            updatedBy: userService.userValue.id,
          });
        }
        setItems((prev) =>
          prev.map((row, i) =>
            i === index ? normaliseItem({ ...row, ...saved }) : row
          )
        );
        showAlert("Item saved", "success");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to save item", e);
        showAlert("Failed to save item", "error");
      }
    },
    [items, showAlert, budgetId, sections, isFinal]
  );

  // Items
  // (moved above)

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const openConfirm = useCallback((title, message, onConfirm) => {
    setConfirmState({ open: true, title, message, onConfirm });
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmState((s) => ({ ...s, open: false }));
  }, []);

  // Section create/rename dialog state
  const [sectionDialog, setSectionDialog] = useState({
    open: false,
    mode: "create", // 'create' | 'rename'
    value: SECTION_PRESETS[0] || "",
    targetId: null,
  });
  const openSectionDialog = useCallback(
    (
      mode = "create",
      initialValue = SECTION_PRESETS[0] || "",
      targetId = null
    ) => {
      setSectionDialog({ open: true, mode, value: initialValue, targetId });
    },
    []
  );
  const closeSectionDialog = useCallback(() => {
    setSectionDialog((s) => ({ ...s, open: false }));
  }, []);

  // Section handlers for child component
  const handleAddSection = useCallback(() => {
    if (isFinal) {
      showAlert(
        "This budget is final and cannot be edited. Create a revision to make changes.",
        "info"
      );
      return;
    }
    openSectionDialog("create", SECTION_PRESETS[0] || "", null);
  }, [openSectionDialog, isFinal, showAlert]);

  const handleRenameSection = useCallback(() => {
    if (isFinal) {
      showAlert(
        "This budget is final and cannot be edited. Create a revision to make changes.",
        "info"
      );
      return;
    }
    const current = sections.find((x) => x.id === selectedSectionId);
    const initial =
      current?.name && SECTION_PRESETS.includes(current.name)
        ? current.name
        : SECTION_PRESETS[0] || "";
    openSectionDialog("rename", initial, selectedSectionId);
  }, [sections, selectedSectionId, openSectionDialog, isFinal, showAlert]);

  const handleDeleteSection = useCallback(() => {
    if (isFinal) {
      showAlert(
        "This budget is final and cannot be edited. Create a revision to make changes.",
        "info"
      );
      return;
    }
    openConfirm(
      "Delete section",
      "This will delete the section and all its items. Are you sure?",
      async () => {
        try {
          await svc.current.deleteSection(selectedSectionId);
          const fresh = await svc.current.listSectionsByBudget(budgetId);
          setSections(fresh || []);
          setSelectedSectionId((fresh || [])[0]?.id || "");
          setItems((prev) =>
            prev.filter((x) => x.sectionId && x.sectionId !== selectedSectionId)
          );
          closeConfirm();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
          showAlert("Failed to delete section", "error");
          closeConfirm();
        }
      }
    );
  }, [
    selectedSectionId,
    budgetId,
    showAlert,
    closeConfirm,
    openConfirm,
    isFinal,
  ]);

  // Totals (overall and per-section)
  const totals = useMemo(() => {
    const budgetHours = items.reduce((s, it) => s + Number(it.hours || 0), 0);
    const budgetAmount = items.reduce((s, it) => {
      return (
        s +
        Number(it.hours || 0) * Number(it.rate || 0) +
        Number(it.amount || 0)
      );
    }, 0);
    return { budgetHours, budgetAmount };
  }, [items]);

  const sectionTotals = useMemo(() => {
    const rows = items.filter((x) => x.sectionId === selectedSectionId);
    const hours = rows.reduce((s, r) => s + Number(r.hours || 0), 0);
    const amount = rows.reduce(
      (s, r) =>
        s + Number(r.hours || 0) * Number(r.rate || 0) + Number(r.amount || 0),
      0
    );
    return { hours, amount };
  }, [items, selectedSectionId]);

  // Summaries for display in the Budget meta card
  const budgetSummary = useMemo(() => {
    const rows = items;
    const numResources = rows.filter((r) =>
      String(r.resourceLabel || "").trim()
    ).length;
    const hours = rows.reduce((s, r) => s + Number(r.hours || 0), 0);
    const amount = rows.reduce(
      (s, r) =>
        s + Number(r.hours || 0) * Number(r.rate || 0) + Number(r.amount || 0),
      0
    );
    return { numResources, hours, amount };
  }, [items]);

  const sectionSummaries = useMemo(() => {
    return (sections || []).map((s) => {
      const rows = items.filter((r) => r.sectionId === s.id);
      const numResources = rows.filter((r) =>
        String(r.resourceLabel || "").trim()
      ).length;
      const hours = rows.reduce((sum, r) => sum + Number(r.hours || 0), 0);
      const amount = rows.reduce(
        (sum, r) =>
          sum +
          Number(r.hours || 0) * Number(r.rate || 0) +
          Number(r.amount || 0),
        0
      );
      return { id: s.id, name: s.name, numResources, hours, amount };
    });
  }, [sections, items]);

  // --- Service wrappers (budgets, sections, items) ---
  const svc = useRef({
    getBudget: (id) => getBudgetById(String(id)),
    createBudget: (payload) => createBudget(payload),
    updateBudget: (id, payload) => updateBudget(String(id), payload),
    listItemsByBudget: (id) => listItemsByBudget(String(id)),
    createItem: (row) => createItem(row),
    updateItem: (id, row) => updateItem(String(id), row),
    deleteItem: (id) => deleteItem(String(id)),
    listSectionsByBudget: (id) => listSectionsByBudget(String(id)),
    createSection: (bId, row) => createSection(String(bId), row),
    updateSection: (id, row) => updateSection(String(id), row),
    deleteSection: (id) => deleteSection(String(id)),
  });

  // Load budget + sections + items
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (budgetId) {
          // Load meta
          const b = await svc.current.getBudget(budgetId);
          if (mounted && b) {
            setName(b.name || "");
            setStatus(b.status || "draft");
            setVersion(Number(b.version || 1));
            setCurrency(b.currency || "AUD");
            setNotes(b.notes || "");
          }
          // Load sections
          const secs = await svc.current.listSectionsByBudget(budgetId);
          if (mounted) {
            setSections(secs || []);
            setSelectedSectionId((prev) => prev || (secs?.[0]?.id ?? ""));
          }
          // Load items
          const rows = await svc.current.listItemsByBudget(budgetId);
          if (mounted) setItems((rows || []).map(normaliseItem));
        } else {
          // Fresh builder
          setItems([]);
          setSections([]);
          setSelectedSectionId("");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load budget/sections/items", e);
        if (isBudgetIdFromQueryRef.current) {
          showAlert("Failed to load budget", "error");
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [budgetId, showAlert]); // keep deps accurate

  // Item editing utils
  const addItem = useCallback(() => {
    if (isFinal) {
      showAlert(
        "This budget is final and cannot be edited. Create a revision to make changes.",
        "info"
      );
      return;
    }
    if (!selectedSectionId) {
      showAlert("Create or select a section first", "warning");
      return;
    }
    setSectionsExpanded(false);
    setItems((prev) => {
      const maxOrder = prev
        .filter((x) => x.sectionId === selectedSectionId)
        .reduce((m, x) => Math.max(m, Number(x.order || 0)), -1);
      const nextOrder = maxOrder + 1;
      return [...prev, { ...defaultItem(selectedSectionId), order: nextOrder }];
    });
  }, [selectedSectionId, showAlert, isFinal]);

  const removeItem = useCallback(
    (index) => setItems((prev) => prev.filter((_, i) => i !== index)),
    []
  );
  const mutateItem = useCallback(
    (index, patch) =>
      setItems((prev) =>
        prev.map((x, i) => (i === index ? { ...x, ...patch } : x))
      ),
    []
  );

  // Auto-scroll to items section only after a fresh create/link, not on every load
  useEffect(() => {
    if (!budgetId) return;
    if (didCreateOrLinkRef.current && itemsSectionRef.current) {
      itemsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      didCreateOrLinkRef.current = false;
    }
  }, [budgetId]);

  // Save
  const handleSave = useCallback(async () => {
    if (isFinal) {
      showAlert(
        "This budget is final and cannot be edited. Create a revision to make changes.",
        "info"
      );
      return;
    }
    // Helper to strip id from payloads
    const stripId = (obj) => {
      // eslint-disable-next-line no-unused-vars
      const { id, ...rest } = obj || {};
      return rest;
    };
    // Basic client validation
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      showAlert("Budget name is required", "warning");
      return;
    }

    // Normalise local rows; new rows have no id (server will assign)
    const cleaned = items.map((it) => {
      const hours = Number(it.hours || 0);
      const rate = Number(it.rate || 0);
      const amount = Number(it.amount || 0);
      const isFixed = amount > 0 && (hours === 0 || rate === 0);
      return {
        id: it.id,
        budgetId: budgetId || undefined,
        sectionId: it.sectionId || null,
        sectionName: sections.find((s) => s.id === it.sectionId)?.name || "",
        resourceLabel: String(it.resourceLabel || "").trim(),
        activity: undefined, // deprecated
        billingType: isFixed ? "fixed" : "hourly",
        hours: isFixed ? 0 : hours,
        rate: isFixed ? 0 : rate,
        amount: isFixed ? amount : 0,
        notes: String(it.notes || "").trim() || undefined,
        billable: !!it.billable,
        order: Number(it.order || 0),
        customerId: userService.userValue.customerId,
      };
    });

    try {
      let bId = budgetId;

      // Create/Update budget meta
      if (!bId) {
        const created = await svc.current.createBudget({
          name: trimmedName,
          status,
          version,
          currency,
          notes,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
        if (!created?.id) throw new Error("Budget creation failed");
        bId = String(created.id);
        setBudgetId(bId);
        didCreateOrLinkRef.current = true;
      } else {
        await svc.current.updateBudget(bId, {
          name: trimmedName,
          status,
          version,
          currency,
          notes,
          customerId: userService.userValue.customerId,
          updatedBy: userService.userValue.id,
        });
      }

      // Fetch current server items to diff (by budget)
      const existing = (await svc.current.listItemsByBudget(bId)) || [];
      const byId = (arr) =>
        Object.fromEntries(
          (Array.isArray(arr) ? arr : [])
            .filter((x) => x?.id)
            .map((x) => [String(x.id), x])
        );
      const existingById = byId(existing);

      const toCreate = cleaned.filter((x) => !x.id);
      const toUpdate = cleaned.filter(
        (x) => x.id && existingById[String(x.id)]
      );
      const toDelete = (existing || []).filter(
        (x) => !cleaned.some((y) => String(y.id || "") === String(x.id))
      );

      // Create
      const createdResults = await Promise.allSettled(
        toCreate.map((row) =>
          svc.current.createItem({
            ...stripId(row),
            budgetId: bId,
            createdBy: userService.userValue.id,
          })
        )
      );
      const createdErrors = createdResults.filter(
        (r) => r.status === "rejected"
      );
      if (createdErrors.length)
        throw (
          createdErrors[0].reason ||
          new Error("Failed to create one or more items")
        );

      // Update
      const updatedResults = await Promise.allSettled(
        toUpdate.map((row) =>
          svc.current.updateItem(String(row.id), {
            ...stripId(row),
            budgetId: bId,
            updatedBy: userService.userValue.id,
          })
        )
      );
      const updateErrors = updatedResults.filter(
        (r) => r.status === "rejected"
      );
      if (updateErrors.length)
        throw (
          updateErrors[0].reason ||
          new Error("Failed to update one or more items")
        );

      // Delete
      const deletedResults = await Promise.allSettled(
        toDelete.map((row) => svc.current.deleteItem(String(row.id)))
      );
      const deleteErrors = deletedResults.filter(
        (r) => r.status === "rejected"
      );
      if (deleteErrors.length)
        throw (
          deleteErrors[0].reason ||
          new Error("Failed to delete one or more items")
        );

      // Reload items to reflect canonical server state
      const fresh = await svc.current.listItemsByBudget(bId);
      setItems(Array.isArray(fresh) ? fresh.map(normaliseItem) : []);

      showAlert("Budget saved", "success");
      onSaved?.();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save budget", e);
      showAlert("Failed to save budget", "error");
    }
  }, [
    name,
    items,
    showAlert,
    budgetId,
    sections,
    onSaved,
    status,
    version,
    currency,
    notes,
    isFinal,
  ]);

  const cloneBudget = useCallback(async () => {
    try {
      if (!budgetId) return;
      const nextVersion = Number(version || 1) + 1;

      // 1) create new budget (draft)
      const created = await svc.current.createBudget({
        name: String(name || "").trim(),
        status: "draft",
        version: nextVersion,
        currency,
        notes,
        customerId: userService.userValue.customerId,
        createdBy: userService.userValue.id,
      });
      if (!created?.id) throw new Error("Failed to create cloned budget");
      const newBudgetId = String(created.id);

      // 2) clone sections (map old id -> new id)
      const sectionIdMap = new Map();
      for (const s of sections) {
        const ns = await svc.current.createSection(newBudgetId, {
          name: s.name,
          order: Number(s.order || 0),
          notes: s.notes || "",
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
        if (ns?.id) sectionIdMap.set(String(s.id), String(ns.id));
      }

      // 3) clone items
      for (const it of items) {
        const mappedSectionId = it.sectionId
          ? sectionIdMap.get(String(it.sectionId)) || null
          : null;
        await svc.current.createItem({
          budgetId: newBudgetId,
          sectionId: mappedSectionId,
          sectionName:
            sections.find((x) => String(x.id) === String(it.sectionId))?.name ||
            "",
          resourceLabel: String(it.resourceLabel || "").trim(),
          billingType: it.billingType === "fixed" ? "fixed" : "hourly",
          hours: Number(it.hours || 0),
          rate: Number(it.rate || 0),
          amount: Number(it.amount || 0),
          notes: String(it.notes || "").trim() || undefined,
          billable: !!it.billable,
          order: Number(it.order || 0),
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
      }

      // 4) switch UI to the new draft
      setBudgetId(newBudgetId);
      setStatus("draft");
      setVersion(nextVersion);
      didCreateOrLinkRef.current = true;
      showAlert("Revision created", "success");
      navigate(
        `/v2/pulse/admin/budgets?budgetId=${newBudgetId}${
          trackableIdFromQuery ? `&trackableId=${trackableIdFromQuery}` : ""
        }`
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Failed to create revision", "error");
    }
  }, [
    budgetId,
    version,
    name,
    currency,
    notes,
    sections,
    items,
    showAlert,
    navigate,
    trackableIdFromQuery,
  ]);

  return (
    <Stack spacing={2}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="h5">Budget Builder</Typography>
      </Box>
      {isFinal && (
        <Box mb={1}>
          <Alert severity="info" variant="outlined">
            This budget is <strong>Final</strong> and cannot be edited. To make
            changes, you will need to <strong>create a revision</strong> from
            the{" "}
            <Link to="/v2/pulse/admin/budgets" style={{ fontWeight: 500 }}>
              Budget View
            </Link>{" "}
            by cloning the finalised budget.
          </Alert>
        </Box>
      )}
      {!trackableIdFromQuery && (
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to="/v2/pulse/admin/budgets"
            variant="outlined"
          >
            Back to Budgets
          </Button>
          {isFinal ? (
            <Button variant="contained" onClick={cloneBudget}>
              Create revision
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave}>
              Save budget
            </Button>
          )}
        </Stack>
      )}

      {/* Pre-budget choice: Create vs Link */}
      {!budgetId && (
        <Box mb={1}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={preBudgetMode === "create" ? "contained" : "text"}
              onClick={() => setPreBudgetMode("create")}
            >
              Create budget
            </Button>
            <Button
              variant={preBudgetMode === "link" ? "contained" : "text"}
              onClick={() => setPreBudgetMode("link")}
            >
              Link budget
            </Button>
          </Stack>
        </Box>
      )}

      {/* Budget meta */}
      {(budgetId || preBudgetMode === "create") && (
        <Paper variant="outlined">
          <Box p={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Budget name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="medium"
                disabled={isFinal}
              />
              <TextField
                label="Status"
                value={
                  status === "draft"
                    ? "Draft"
                    : status === "final"
                      ? "Final"
                      : "Archived"
                }
                size="medium"
                InputProps={{ readOnly: true }}
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="Version"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={version}
                onChange={(e) => setVersion(Number(e.target.value || 1))}
                sx={{ width: 120 }}
                size="medium"
                disabled={isFinal}
              />
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  size="medium"
                  disabled={isFinal}
                >
                  <MenuItem value="AUD">AUD</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box mt={2}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                disabled={isFinal}
              />
            </Box>
            <Box mt={3}>
              {budgetId && (
                <>
                  <Table size="small" sx={{ mb: 2, maxWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Budget</TableCell>
                        <TableCell align="right">Number of resources</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell />
                        <TableCell align="right">
                          {budgetSummary.numResources}
                        </TableCell>
                        <TableCell align="right">
                          {budgetSummary.hours}
                        </TableCell>
                        <TableCell align="right">
                          {toCurrency(budgetSummary.amount, currency)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <br />

                  <Table size="small" sx={{ maxWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Section</TableCell>
                        <TableCell align="right">Number of resources</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sectionSummaries.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell align="right">{s.numResources}</TableCell>
                          <TableCell align="right">{s.hours}</TableCell>
                          <TableCell align="right">
                            {toCurrency(s.amount, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Box mt={2} display="flex" justifyContent="flex-end">
                    {!isFinal && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          try {
                            if (!budgetId) {
                              showAlert(
                                "Save the budget first before marking as Final.",
                                "warning"
                              );
                              return;
                            }
                            await svc.current.updateBudget(budgetId, {
                              name: String(name || "").trim(),
                              status: "final",
                              version,
                              currency,
                              notes,
                              customerId: userService.userValue.customerId,
                              updatedBy: userService.userValue.id,
                            });
                            setStatus("final");
                            showAlert("Budget marked as Final", "success");
                            navigate("/v2/pulse/admin/budgets");
                          } catch (e) {
                            // eslint-disable-next-line no-console
                            console.error(e);
                            showAlert(
                              "Failed to mark budget as Final",
                              "error"
                            );
                          }
                        }}
                      >
                        Mark Final
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Two-pane: Sections (left) + Items scoped to selected section (right) */}
      {budgetId ? (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="stretch"
        >
          {/* Left: Sections panel in an Accordion */}
          <Box
            sx={{
              flex: "0 0 auto",
              width: { xs: "100%", md: sectionsExpanded ? 360 : 48 },
              height: "100%",
              transition: (theme) =>
                theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
            }}
          >
            <Accordion
              expanded={sectionsExpanded}
              onChange={(_, exp) => setSectionsExpanded(exp)}
              square
              disableGutters
              sx={{
                height: "100%",
                "& .MuiAccordion-region": { height: "100%" },
                "& .MuiAccordionDetails-root": { height: "100%", p: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={<ChevronRightIcon />}
              ></AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <BudgetSection
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  onSelect={setSelectedSectionId}
                  onAdd={!isFinal ? handleAddSection : undefined}
                  onRename={!isFinal ? handleRenameSection : undefined}
                  onDelete={!isFinal ? handleDeleteSection : undefined}
                />
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Right: Items for selected section */}
          <Paper
            variant="outlined"
            ref={itemsSectionRef}
            sx={{
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
            }}
          >
            <Box p={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle1">
                  {selectedSectionId
                    ? `Items — ${sections.find((s) => s.id === selectedSectionId)?.name || ""}`
                    : "Items"}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={`Section Hours: ${sectionTotals.hours}`}
                  />
                  <Chip
                    size="small"
                    label={`Section Amount: ${toCurrency(sectionTotals.amount, currency)}`}
                  />
                  {!isFinal && (
                    <Button
                      variant="outlined"
                      onClick={addItem}
                      disabled={!selectedSectionId}
                    >
                      Add item
                    </Button>
                  )}
                </Stack>
              </Stack>

              {selectedSectionId ? (
                <Table size="small" sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 320 }}>Resource</TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>
                        Charge-out rate/hour
                      </TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>
                        Number of hours
                      </TableCell>
                      <TableCell align="right" sx={{ width: 160 }}>
                        Flat amount
                      </TableCell>
                      <TableCell sx={{ width: 320 }}>Notes</TableCell>
                      <TableCell align="right" sx={{ width: 160 }}>
                        Row total
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        Row actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items
                      .map((it, originalIndex) => ({ it, originalIndex }))
                      .filter(({ it }) => it.sectionId === selectedSectionId)
                      .sort(
                        (a, b) =>
                          Number(a.it.order || 0) - Number(b.it.order || 0)
                      )
                      .map(({ it, originalIndex }) => {
                        return (
                          <TableRow
                            key={
                              it.id ||
                              `${it.sectionId || "sec"}-${it.order ?? originalIndex}`
                            }
                          >
                            <TableCell
                              sx={{ width: 320, verticalAlign: "middle" }}
                            >
                              <TextField
                                select
                                size="small"
                                fullWidth
                                disabled={isFinal}
                                value={it.resourceLabel || ""}
                                onChange={(e) =>
                                  mutateItem(originalIndex, {
                                    resourceLabel: e.target.value,
                                  })
                                }
                                SelectProps={{
                                  displayEmpty: true,
                                  renderValue: (val) =>
                                    val ? val : "Select resource",
                                }}
                              >
                                <MenuItem value="">
                                  <em>Select resource</em>
                                </MenuItem>
                                {RESOURCE_OPTIONS.map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ width: 140, verticalAlign: "middle" }}
                            >
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 1 }}
                                InputProps={{ sx: { textAlign: "right" } }}
                                value={it.rate}
                                onChange={(e) =>
                                  mutateItem(originalIndex, {
                                    rate: Number(e.target.value || 0),
                                  })
                                }
                                disabled={isFinal || Number(it.amount || 0) > 0}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ width: 140, verticalAlign: "middle" }}
                            >
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 0.25 }}
                                InputProps={{ sx: { textAlign: "right" } }}
                                value={it.hours}
                                onChange={(e) =>
                                  mutateItem(originalIndex, {
                                    hours: Number(e.target.value || 0),
                                  })
                                }
                                disabled={isFinal || Number(it.amount || 0) > 0}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ width: 160, verticalAlign: "middle" }}
                            >
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 1 }}
                                InputProps={{ sx: { textAlign: "right" } }}
                                value={it.amount}
                                onChange={(e) =>
                                  mutateItem(originalIndex, {
                                    amount: Number(e.target.value || 0),
                                  })
                                }
                                disabled={isFinal || Number(it.rate || 0) > 0}
                              />
                            </TableCell>
                            <TableCell
                              sx={{ width: 320, verticalAlign: "middle" }}
                            >
                              <TextField
                                size="small"
                                value={it.notes}
                                onChange={(e) =>
                                  mutateItem(originalIndex, {
                                    notes: e.target.value,
                                  })
                                }
                                fullWidth
                                disabled={isFinal}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ width: 160, verticalAlign: "middle" }}
                            >
                              {toCurrency(
                                Number(it.hours || 0) * Number(it.rate || 0) +
                                  Number(it.amount || 0),
                                currency
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ width: 120, verticalAlign: "middle" }}
                            >
                              {!isFinal && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                    onClick={() => saveItem(originalIndex)}
                                    disabled={!selectedSectionId}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => removeItem(originalIndex)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {items.filter((it) => it.sectionId === selectedSectionId)
                      .length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography color="text.secondary">
                            No items in this section yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={5} align="right">
                        <strong>Section total</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {toCurrency(sectionTotals.amount, currency)}
                        </strong>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7}>
                        <span ref={itemsEndRef} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">
                  Create a section from the dropdown on the left to begin adding
                  items.
                </Typography>
              )}

              <Box mt={2} display="flex" gap={1}>
                {!isFinal && (
                  <>
                    <Button variant="contained" onClick={handleSave}>
                      Save budget
                    </Button>
                    <Button variant="text" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        </Stack>
      ) : preBudgetMode === "link" ? (
        <Paper variant="outlined">
          <Box p={2}>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Create and save a new budget, or link an existing unlinked
                budget to this trackable.
              </Typography>

              {trackableIdFromQuery && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <FormControl size="small" sx={{ minWidth: 280 }}>
                    <InputLabel id="linkable-budget-select-label">
                      Link existing budget
                    </InputLabel>
                    <Select
                      labelId="linkable-budget-select-label"
                      label="Link existing budget"
                      value={selectedLinkBudgetId}
                      onChange={(e) =>
                        setSelectedLinkBudgetId(String(e.target.value))
                      }
                      disabled={
                        linkableLoading || (linkableBudgets || []).length === 0
                      }
                    >
                      {(linkableBudgets || []).map((b) => (
                        <MenuItem key={b.id} value={String(b.id)}>
                          {b.name || b.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    disabled={!selectedLinkBudgetId || linkableLoading}
                    onClick={async () => {
                      try {
                        if (!selectedLinkBudgetId) return;
                        await linkBudgetToTrackable({
                          trackableId: trackableIdFromQuery,
                          budgetId: selectedLinkBudgetId,
                        });
                        setBudgetId(String(selectedLinkBudgetId));
                        setPreBudgetMode("create");
                        didCreateOrLinkRef.current = true;
                        showAlert("Budget linked to trackable", "success");
                      } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error("Failed to link budget", e);
                        showAlert("Failed to link budget", "error");
                      }
                    }}
                  >
                    {linkableLoading ? <CircularProgress size={20} /> : "Link"}
                  </Button>
                </Stack>
              )}

              <Typography color="text.secondary">
                Or use the builder below to create a new budget from scratch.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      ) : null}
      {/* Section Create/Rename Dialog */}
      <Dialog
        open={sectionDialog.open}
        onClose={closeSectionDialog}
        aria-labelledby="section-dialog-title"
      >
        <DialogTitle id="section-dialog-title">
          {sectionDialog.mode === "create" ? "Add section" : "Rename section"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Choose a section name from the standard list.
          </DialogContentText>
          <FormControl fullWidth size="small">
            <InputLabel id="section-select-dialog-label">Section</InputLabel>
            <Select
              labelId="section-select-dialog-label"
              label="Section"
              value={sectionDialog.value}
              onChange={(e) =>
                setSectionDialog((s) => ({ ...s, value: e.target.value }))
              }
            >
              {SECTION_PRESETS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSectionDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const name = String(sectionDialog.value || "").trim();
              if (!name) {
                closeSectionDialog();
                return;
              }
              try {
                if (sectionDialog.mode === "create") {
                  await svc.current.createSection(budgetId, {
                    name,
                    order: sections.length,
                    notes: "",
                    customerId: userService.userValue.customerId,
                    createdBy: userService.userValue.id,
                  });
                } else if (
                  sectionDialog.mode === "rename" &&
                  sectionDialog.targetId
                ) {
                  await svc.current.updateSection(sectionDialog.targetId, {
                    name,
                    customerId: userService.userValue.customerId,
                    updatedBy: userService.userValue.id,
                  });
                }
                const fresh = await svc.current.listSectionsByBudget(budgetId);
                setSections(fresh || []);
                setSelectedSectionId((fresh || [])[0]?.id || "");
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                showAlert(
                  sectionDialog.mode === "create"
                    ? "Failed to create section"
                    : "Failed to rename section",
                  "error"
                );
              } finally {
                closeSectionDialog();
              }
            }}
            autoFocus
          >
            {sectionDialog.mode === "create" ? "Add" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Confirm Dialog */}
      <Dialog
        open={confirmState.open}
        onClose={closeConfirm}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmState.title || "Confirm"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirmState.message || "Are you sure?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              const fn = confirmState.onConfirm;
              if (typeof fn === "function") {
                fn();
              } else {
                closeConfirm();
              }
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
