import {
  Box,
  Typography,
  Paper,
  Stack,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  TableBody,
  Checkbox,
  Button,
  Drawer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadMockStagedRows } from "../mock/mockStagedRows";
import { enrichRowsWithReviewSignals } from "../mock/mockReviewIntelligence";
import { recordMockReviewFeedback } from "../mock/mockReviewLearningStore";

export default function LearningPanel() {
  const [sortBy, setSortBy] = useState("payment_time_days");
  const [sortDirection, setSortDirection] = useState("desc");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [paymentTermsFilter, setPaymentTermsFilter] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [detailRow, setDetailRow] = useState(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState("exclude");
  const [reasonCode, setReasonCode] = useState("not_reportable");
  const [decisionNote, setDecisionNote] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionFinalCategory, setRejectionFinalCategory] =
    useState("normal");
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [pendingRejectionReasons, setPendingRejectionReasons] = useState([]);
  const [rejectionNote, setRejectionNote] = useState("");

  const [extraVisibleColumns, setExtraVisibleColumns] = useState([]);
  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(false);
  const [showMissingAbnOnly, setShowMissingAbnOnly] = useState(false);
  const [showMissingTermsOnly, setShowMissingTermsOnly] = useState(false);
  const [showNegativeAmountsOnly, setShowNegativeAmountsOnly] = useState(false);
  const [showTinyAmountsOnly, setShowTinyAmountsOnly] = useState(false);
  const [showHighDaysOnly, setShowHighDaysOnly] = useState(false);
  const [showHighConfidenceOnly, setShowHighConfidenceOnly] = useState(false);
  const [showSuggestedIntraGroupOnly, setShowSuggestedIntraGroupOnly] =
    useState(false);
  const [showSuggestedTransferOnly, setShowSuggestedTransferOnly] =
    useState(false);
  const [similarRowIds, setSimilarRowIds] = useState([]);
  const [isApplyingDecision, setIsApplyingDecision] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const rows = await loadMockStagedRows();
        if (!isMounted) return;

        const enrichedRows = enrichRowsWithReviewSignals(
          rows.slice(0, 300),
        ).map((row, idx) => ({
          ...row,
          __mockId: `${row["Document Number"] || row.invoice_reference_number || "row"}-${idx}`,
          __reviewStatus: "unreviewed",
          __decisionType: "",
          __reasonCode: "",
          __decisionNote: "",
          __confidenceOutcome: "",
          __recommendationAccepted: null,
          __finalCategory: "",
        }));

        setData(enrichedRows);
      } catch (err) {
        if (!isMounted) return;
        setData([]);
        setLoadError(err?.message || "Failed to load staged rows");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRows = data.filter((row) => {
    const matchesSupplier = supplierFilter
      ? String(row["Name 1"] || "")
          .toLowerCase()
          .includes(supplierFilter.toLowerCase())
      : true;

    const matchesDocumentType = documentTypeFilter
      ? String(row["Document Type"] || "") === documentTypeFilter
      : true;

    const matchesPaymentTerms = paymentTermsFilter
      ? String(row["Payment terms"] || "") === paymentTermsFilter
      : true;

    const payeeAbn = String(
      row.payee_entity_abn || row["ABN /Tax number"] || "",
    ).trim();
    const paymentTerms = String(
      row["Payment terms"] || row.invoice_payment_terms || "",
    ).trim();
    const amount =
      Number(
        String(row.payment_amount || "0")
          .replace(/[(),]/g, "")
          .replace(/,/g, ""),
      ) || 0;
    const days = Number(row.payment_time_days || 0);
    const reviewScore = Number(row.__reviewScore || 0);
    const suggestedCategory = String(row.__suggestedCategory || "");

    const matchesUnreviewed = showUnreviewedOnly
      ? row.__reviewStatus !== "reviewed"
      : true;

    const matchesMissingAbn = showMissingAbnOnly ? !payeeAbn : true;

    const matchesMissingTerms = showMissingTermsOnly ? !paymentTerms : true;

    const matchesNegativeAmounts = showNegativeAmountsOnly ? amount < 0 : true;

    const matchesTinyAmountsOnly = showTinyAmountsOnly
      ? Math.abs(amount) > 0 && Math.abs(amount) <= 1
      : true;

    const matchesHighDaysOnly = showHighDaysOnly ? days >= 45 : true;
    const matchesHighConfidenceOnly = showHighConfidenceOnly
      ? reviewScore >= 100
      : true;

    const matchesSuggestedIntraGroupOnly = showSuggestedIntraGroupOnly
      ? suggestedCategory === "intra_group"
      : true;

    const matchesSuggestedTransferOnly = showSuggestedTransferOnly
      ? suggestedCategory === "transfer"
      : true;

    return (
      matchesSupplier &&
      matchesDocumentType &&
      matchesPaymentTerms &&
      matchesUnreviewed &&
      matchesMissingAbn &&
      matchesMissingTerms &&
      matchesNegativeAmounts &&
      matchesTinyAmountsOnly &&
      matchesHighDaysOnly &&
      matchesHighConfidenceOnly &&
      matchesSuggestedIntraGroupOnly &&
      matchesSuggestedTransferOnly
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "payment_amount") {
      const aVal = Number(String(a.payment_amount || "0").replace(/,/g, ""));
      const bVal = Number(String(b.payment_amount || "0").replace(/,/g, ""));
      return (aVal - bVal) * direction;
    }

    if (sortBy === "payment_time_days") {
      return (
        ((a.payment_time_days || 0) - (b.payment_time_days || 0)) * direction
      );
    }

    const aVal = String(a[sortBy] ?? "");
    const bVal = String(b[sortBy] ?? "");

    return aVal.localeCompare(bVal) * direction;
  });

  const excludedColumns = new Set([
    "_ptrsMeta",
    "s4_invoice_key",
    "vendormaster__Region",
    "entitystructure__Notes",
    "vendormaster__Bank Key",
    "entitystructure__Revenue",
    "entitystructure__Trading",
    "entitystructure__column_13",
    "vendormaster__Bank Account",
    "entitystructure__subsidiary",
    "vendormaster__Account Group",
    "vendormaster__Payment Block",
    "vendormaster__Payment Function",
    "vendormaster__E-Mail Address",
    "vendormaster__Liable for VAT",
    "vendormaster__eftSure Status",
    "vendormaster__Payment Methods",
    "vendormaster__Vendor Active ?",
    "vendormaster__Partner Function",
    "vendormaster__Minority Indicator",
    "entitystructure__Reporting Entity",
    "vendormaster__Bank Country/Region",
    "vendormaster__CoCd deletion block",
    "vendormaster__Eval. Receipt Sett.",
    "vendormaster__Clrk's internet add.",
    "vendormaster__GR-Based Inv. Verif.",
    "vendormaster__Central posting block",
    "vendormaster__Central purchasing block",
    "vendormaster__Collection authorization",
    "entitystructure__Entered on Portal -RAM",
    "entitystructure__Ultimate Controlling Entity",
    "vendormaster__Posting block for company code",
    "vendormaster__Purch. block for purchasing organization",
  ]);

  const allColumns = Object.keys(sortedRows[0] || {}).filter(
    (col) => !excludedColumns.has(col),
  );

  const displayColumns = [
    {
      id: "__reviewStatus",
      label: "Review Status",
      sourceKey: "__reviewStatus",
    },
    { id: "reviewScore", label: "Score", sourceKey: "__reviewScore" },
    {
      id: "suggestedCategory",
      label: "Suggested Category",
      sourceKey: "__suggestedCategory",
    },
    {
      id: "confidenceOutcome",
      label: "Confidence Outcome",
      sourceKey: "__confidenceOutcome",
    },
    { id: "reviewFlags", label: "Flags", sourceKey: "__reviewFlagsLabel" },
    { id: "supplier", label: "Supplier", sourceKey: "Name 1" },
    {
      id: "supplierAbn",
      label: "Supplier ABN",
      sourceKey: "payee_entity_abn",
    },
    {
      id: "documentType",
      label: "Doc Type",
      sourceKey: "Document Type",
    },
    {
      id: "reference",
      label: "Reference / Description",
      sourceKey: "Reference",
    },
    { id: "documentNumber", label: "Doc No", sourceKey: "Document Number" },
    {
      id: "paymentAmount",
      label: "Payment Amount",
      sourceKey: "payment_amount",
    },
    {
      id: "paymentDate",
      label: "Payment Date",
      sourceKey: "payment_date",
    },
    {
      id: "invoiceIssueDate",
      label: "Invoice Issue Date",
      sourceKey: "invoice_issue_date",
    },
    { id: "dueDate", label: "Due Date", sourceKey: "invoice_due_date" },
    { id: "paymentTerms", label: "Terms", sourceKey: "Payment terms" },
    { id: "paymentDays", label: "Days", sourceKey: "payment_time_days" },
    { id: "payer", label: "Payer", sourceKey: "payer_entity_name" },
    { id: "payerAbn", label: "Payer ABN", sourceKey: "payer_entity_abn" },
  ];

  const defaultVisibleColumns = displayColumns.map((col) => col.id);

  const displayColumnMap = Object.fromEntries(
    displayColumns.map((col) => [col.id, col]),
  );

  const getDisplayValue = (row, columnId) => {
    const column = displayColumnMap[columnId];
    if (!column) return "";
    return row[column.sourceKey];
  };

  const columnWidths = {
    __reviewStatus: 180,
    reviewScore: 80,
    suggestedCategory: 160,
    confidenceOutcome: 170,
    reviewFlags: 260,
    supplier: 220,
    supplierAbn: 150,
    documentType: 90,
    reference: 180,
    documentNumber: 120,
    paymentAmount: 130,
    paymentDate: 120,
    invoiceIssueDate: 140,
    dueDate: 120,
    paymentTerms: 100,
    paymentDays: 80,
    payer: 220,
    payerAbn: 150,
  };

  const getCellSx = (col) => ({
    minWidth: columnWidths[col] || 140,
    maxWidth: columnWidths[col] || 140,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "top",
  });

  const formatConfidenceOutcome = (value) => {
    if (!value) return "Pending";

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatFlags = (value) => {
    const flags = Array.isArray(value)
      ? value
      : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    if (!flags.length) return "-";

    const preview = flags.slice(0, 2).map((flag) => flag.replaceAll("_", " "));
    return flags.length > 2
      ? `${preview.join(", ")} +${flags.length - 2}`
      : preview.join(", ");
  };

  const documentTypeOptions = [
    ...new Set(
      data.map((row) => String(row["Document Type"] || "")).filter(Boolean),
    ),
  ].sort();

  const paymentTermsOptions = [
    ...new Set(
      data.map((row) => String(row["Payment terms"] || "")).filter(Boolean),
    ),
  ].sort();

  const rejectionReasonOptions = [
    {
      value: "account_not_internal",
      label: "Account does not indicate internal activity",
    },
    {
      value: "supplier_external",
      label: "Supplier is external despite internal-looking details",
    },
    {
      value: "abn_match_misleading",
      label: "ABN / entity match is misleading",
    },
    {
      value: "reference_misleading",
      label: "Reference text is misleading",
    },
    {
      value: "document_type_misleading",
      label: "Document type is misleading",
    },
    {
      value: "payment_terms_misleading",
      label: "Payment terms are misleading",
    },
    {
      value: "should_be_transfer",
      label: "Should be transfer instead",
    },
    {
      value: "should_be_normal",
      label: "Should be normal supplier payment",
    },
    {
      value: "credit_adjustment",
      label: "This is a credit / adjustment case",
    },
    {
      value: "grouping_wrong",
      label: "Similar rows should not be grouped together",
    },
    {
      value: "other",
      label: "Other",
    },
  ];

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  };

  const visibleColumns = [
    ...defaultVisibleColumns.filter((col) => {
      const displayCol = displayColumnMap[col];
      if (!displayCol) return allColumns.includes(col) || col.startsWith("__");
      return (
        displayCol.sourceKey === "__reviewStatus" ||
        allColumns.includes(displayCol.sourceKey)
      );
    }),
    ...extraVisibleColumns.filter(
      (col) =>
        !defaultVisibleColumns.includes(col) &&
        allColumns.includes(col) &&
        !col.startsWith("__"),
    ),
  ];

  const availableExtraColumns = allColumns.filter(
    (col) => !displayColumns.some((displayCol) => displayCol.sourceKey === col),
  );

  const isAllSelected =
    sortedRows.length > 0 && selectedRowIds.length === sortedRows.length;

  const isSomeSelected =
    selectedRowIds.length > 0 && selectedRowIds.length < sortedRows.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(sortedRows.map((row) => row.__mockId));
  };

  const handleToggleRow = (rowId) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId],
    );
  };

  const handleOpenDecisionDialog = () => {
    if (!selectedRowIds.length) return;
    setDecisionDialogOpen(true);
  };

  const handleCloseDecisionDialog = () => {
    setDecisionDialogOpen(false);
  };

  const openRejectionDialog = (finalCategory) => {
    setRejectionFinalCategory(finalCategory);
    setRejectionReasons([]);
    setPendingRejectionReasons([]);
    setRejectionNote("");
    setRejectionDialogOpen(true);
  };

  const handleCloseRejectionDialog = () => {
    setRejectionDialogOpen(false);
    setRejectionFinalCategory("normal");
    setRejectionReasons([]);
    setPendingRejectionReasons([]);
    setRejectionNote("");
  };
  const handleTogglePendingRejectionReason = (value) => {
    setPendingRejectionReasons((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleApplyPendingRejectionReasons = () => {
    setRejectionReasons(pendingRejectionReasons);
  };

  const handleCancelPendingRejectionReasons = () => {
    setPendingRejectionReasons(rejectionReasons);
  };

  const handleSubmitRejectionDialog = () => {
    if (!rejectionReasons.length) return;

    const combinedNote = [
      `Reasons: ${rejectionReasons.join(", ")}`,
      rejectionNote.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    applyRecommendationFeedbackToDetailRow({
      accepted: false,
      finalCategory: rejectionFinalCategory,
      note: combinedNote,
      reasonCodes: rejectionReasons,
    });

    closeDrawerWithFeedback(
      rejectionFinalCategory === "normal"
        ? "Suggestion rejected"
        : `Reclassified to ${rejectionFinalCategory}`,
    );

    handleCloseRejectionDialog();
  };

  const handleApplyMockDecision = () => {
    setData((prev) => {
      const targetedRows = prev.filter((row) =>
        selectedRowIds.includes(row.__mockId),
      );

      if (targetedRows.length) {
        recordMockReviewFeedback({
          rows: targetedRows,
          accepted: decisionType === "include",
          suggestedCategory: targetedRows[0]?.__suggestedCategory || "unknown",
          finalCategory:
            decisionType === "include"
              ? "normal"
              : reasonCode === "intra_group"
                ? "intra_group"
                : reasonCode === "transfer"
                  ? "transfer"
                  : "normal",
          reasonCode,
          note: decisionNote,
          source: "manual_dialog",
        });
      }

      const nextRows = prev.map((row) => {
        if (!selectedRowIds.includes(row.__mockId)) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: decisionType,
          __reasonCode: reasonCode,
          __decisionNote: decisionNote,
          __confidenceOutcome: "manual_decision",
          __recommendationAccepted: null,
          __finalCategory: decisionType === "include" ? "normal" : "",
        };
      });

      return refreshRowsWithLearning(nextRows);
    });

    setSelectedRowIds([]);
    setDecisionDialogOpen(false);
    setDecisionType("exclude");
    setReasonCode("not_reportable");
    setDecisionNote("");
  };

  const applyPresetDecisionToIds = ({ rowIds, type, reason, note = "" }) => {
    if (!rowIds.length) return;

    setData((prev) => {
      const targetedRows = prev.filter((row) => rowIds.includes(row.__mockId));

      if (targetedRows.length) {
        recordMockReviewFeedback({
          rows: targetedRows,
          accepted: type === "include",
          suggestedCategory: targetedRows[0]?.__suggestedCategory || "unknown",
          finalCategory:
            type === "include"
              ? "normal"
              : reason === "intra_group"
                ? "intra_group"
                : reason === "transfer"
                  ? "transfer"
                  : "normal",
          reasonCode: reason,
          note,
          source: "preset_bulk",
        });
      }

      const nextRows = prev.map((row) => {
        if (!rowIds.includes(row.__mockId)) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: type,
          __reasonCode: reason,
          __decisionNote: note,
          __confidenceOutcome: "preset_applied",
          __recommendationAccepted: null,
          __finalCategory: type === "include" ? "normal" : "",
        };
      });

      return refreshRowsWithLearning(nextRows);
    });

    setSelectedRowIds([]);
  };

  const applyPresetDecisionToDetailRow = ({ type, reason, note = "" }) => {
    if (!detailRow?.__mockId) return;

    setData((prev) => {
      const targetedRows = prev.filter(
        (row) => row.__mockId === detailRow.__mockId,
      );

      if (targetedRows.length) {
        recordMockReviewFeedback({
          rows: targetedRows,
          accepted: type === "include",
          suggestedCategory: targetedRows[0]?.__suggestedCategory || "unknown",
          finalCategory:
            type === "include"
              ? "normal"
              : reason === "intra_group"
                ? "intra_group"
                : reason === "transfer"
                  ? "transfer"
                  : "normal",
          reasonCode: reason,
          note,
          source: "preset_detail",
        });
      }

      const nextRows = prev.map((row) => {
        if (row.__mockId !== detailRow.__mockId) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: type,
          __reasonCode: reason,
          __decisionNote: note,
          __confidenceOutcome: "preset_applied",
          __recommendationAccepted: null,
          __finalCategory: type === "include" ? "normal" : "",
        };
      });

      return refreshRowsWithLearning(nextRows);
    });

    setDetailRow((prev) =>
      prev
        ? {
            ...prev,
            __reviewStatus: "reviewed",
            __decisionType: type,
            __reasonCode: reason,
            __decisionNote: note,
            __confidenceOutcome: "preset_applied",
            __recommendationAccepted: null,
            __finalCategory: type === "include" ? "normal" : "",
          }
        : prev,
    );

    closeDrawerWithFeedback("Decision applied");
  };

  const applyRecommendationFeedbackToDetailRow = ({
    accepted,
    finalCategory,
    note,
    reasonCodes = [],
  }) => {
    if (!detailRow?.__mockId) return;

    const suggestedCategory = String(
      detailRow.__suggestedCategory || "unknown",
    );
    const confidenceOutcome = accepted
      ? "accepted"
      : `rejected_to_${finalCategory}`;

    setData((prev) => {
      const targetedRows = prev.filter(
        (row) => row.__mockId === detailRow.__mockId,
      );

      if (targetedRows.length) {
        recordMockReviewFeedback({
          rows: targetedRows,
          accepted,
          suggestedCategory,
          finalCategory,
          reasonCode: accepted
            ? suggestedCategory
            : reasonCodes.length
              ? JSON.stringify(reasonCodes)
              : finalCategory,
          note,
          source: "recommendation_detail",
        });
      }

      const nextRows = prev.map((row) => {
        if (row.__mockId !== detailRow.__mockId) return row;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: accepted ? "accept_recommendation" : "reclassify",
          __reasonCode: accepted ? suggestedCategory : finalCategory,
          __decisionNote: note,
          __confidenceOutcome: confidenceOutcome,
          __recommendationAccepted: accepted,
          __finalCategory: finalCategory,
        };
      });

      return refreshRowsWithLearning(nextRows);
    });

    setDetailRow((prev) =>
      prev
        ? {
            ...prev,
            __reviewStatus: "reviewed",
            __decisionType: accepted ? "accept_recommendation" : "reclassify",
            __reasonCode: accepted ? suggestedCategory : finalCategory,
            __decisionNote: note,
            __confidenceOutcome: confidenceOutcome,
            __recommendationAccepted: accepted,
            __finalCategory: finalCategory,
          }
        : prev,
    );
  };

  const applyRecommendationFeedbackToRowIds = ({
    rowIds,
    accepted,
    finalCategory,
    note,
  }) => {
    if (!rowIds?.length) return;

    const uniqueRowIds = [...new Set(rowIds.filter(Boolean))];

    setData((prev) => {
      const targetedRows = prev.filter((row) =>
        uniqueRowIds.includes(row.__mockId),
      );

      if (targetedRows.length) {
        recordMockReviewFeedback({
          rows: targetedRows,
          accepted,
          suggestedCategory: targetedRows[0]?.__suggestedCategory || "unknown",
          finalCategory,
          reasonCode: accepted
            ? targetedRows[0]?.__suggestedCategory || "unknown"
            : finalCategory,
          note,
          source: "recommendation_bulk",
        });
      }

      const nextRows = prev.map((row) => {
        if (!uniqueRowIds.includes(row.__mockId)) return row;

        const suggestedCategory = String(row.__suggestedCategory || "unknown");
        const confidenceOutcome = accepted
          ? "accepted"
          : `rejected_to_${finalCategory}`;

        return {
          ...row,
          __reviewStatus: "reviewed",
          __decisionType: accepted ? "accept_recommendation" : "reclassify",
          __reasonCode: accepted ? suggestedCategory : finalCategory,
          __decisionNote: note,
          __confidenceOutcome: confidenceOutcome,
          __recommendationAccepted: accepted,
          __finalCategory: finalCategory,
        };
      });

      return refreshRowsWithLearning(nextRows);
    });

    setDetailRow((prev) => {
      if (!prev || !uniqueRowIds.includes(prev.__mockId)) return prev;

      const suggestedCategory = String(prev.__suggestedCategory || "unknown");
      const confidenceOutcome = accepted
        ? "accepted"
        : `rejected_to_${finalCategory}`;

      return {
        ...prev,
        __reviewStatus: "reviewed",
        __decisionType: accepted ? "accept_recommendation" : "reclassify",
        __reasonCode: accepted ? suggestedCategory : finalCategory,
        __decisionNote: note,
        __confidenceOutcome: confidenceOutcome,
        __recommendationAccepted: accepted,
        __finalCategory: finalCategory,
      };
    });

    setSimilarRowIds([]);
  };

  const handleAcceptRecommendation = () => {
    if (!detailRow) return;

    const suggestedCategory = String(
      detailRow.__suggestedCategory || "unknown",
    );
    const finalCategory =
      suggestedCategory === "unknown" ? "normal" : suggestedCategory;

    applyRecommendationFeedbackToDetailRow({
      accepted: true,
      finalCategory,
      note: `Accepted suggested category: ${finalCategory}`,
    });

    closeDrawerWithFeedback("Suggestion accepted for 1 row");
  };

  const handleAcceptAllSimilarRecommendations = () => {
    if (!detailRow) return;

    const suggestedCategory = String(
      detailRow.__suggestedCategory || "unknown",
    );
    const finalCategory =
      suggestedCategory === "unknown" ? "normal" : suggestedCategory;

    const uniqueRowIds = [detailRow.__mockId, ...similarRowIds]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);

    applyRecommendationFeedbackToRowIds({
      rowIds: uniqueRowIds,
      accepted: true,
      finalCategory,
      note: `Accepted suggested category: ${finalCategory}`,
    });

    closeDrawerWithFeedback(
      `Suggestion accepted for ${uniqueRowIds.length} row${uniqueRowIds.length === 1 ? "" : "s"}`,
    );
  };

  const handleRejectRecommendation = () => {
    openRejectionDialog("normal");
  };

  const handleReclassifyRecommendation = (finalCategory) => {
    openRejectionDialog(finalCategory);
  };

  const renderReviewedCell = (row) => {
    if (row.__reviewStatus !== "reviewed") {
      return <Chip size="small" label="Unreviewed" variant="outlined" />;
    }

    const label = row.__decisionType
      ? `${row.__decisionType}${row.__reasonCode ? `: ${row.__reasonCode}` : ""}`
      : "Reviewed";

    return <Chip size="small" label={label} color="success" />;
  };

  const getSimilarityScore = (baseRow, compareRow) => {
    let score = 0;

    const baseAccount = String(
      baseRow.Account || baseRow["Account"] || "",
    ).trim();
    const compareAccount = String(
      compareRow.Account || compareRow["Account"] || "",
    ).trim();

    const baseName = String(baseRow["Name 1"] || "").trim();
    const compareName = String(compareRow["Name 1"] || "").trim();

    const baseDocType = String(baseRow["Document Type"] || "").trim();
    const compareDocType = String(compareRow["Document Type"] || "").trim();

    const baseTerms = String(baseRow["Payment terms"] || "").trim();
    const compareTerms = String(compareRow["Payment terms"] || "").trim();

    const baseReference = String(baseRow.Reference || "").trim();
    const compareReference = String(compareRow.Reference || "").trim();

    const basePayeeAbn = String(
      baseRow.payee_entity_abn || baseRow["ABN /Tax number"] || "",
    ).trim();
    const comparePayeeAbn = String(
      compareRow.payee_entity_abn || compareRow["ABN /Tax number"] || "",
    ).trim();

    if (baseAccount && baseAccount === compareAccount) {
      score += 4;
    }

    if (baseName && baseName === compareName) {
      score += 3;
    }

    if (baseDocType && baseDocType === compareDocType) {
      score += 2;
    }

    if (baseTerms && baseTerms === compareTerms) {
      score += 2;
    }

    if (
      baseReference &&
      compareReference &&
      baseReference === compareReference
    ) {
      score += 2;
    }

    if (basePayeeAbn && basePayeeAbn === comparePayeeAbn) {
      score += 2;
    }

    return score;
  };

  const handleSuggestSimilarRows = () => {
    if (!detailRow) return;

    const matches = data
      .filter((row) => row.__mockId !== detailRow.__mockId)
      .map((row) => ({
        id: row.__mockId,
        score: getSimilarityScore(detailRow, row),
      }))
      .filter((row) => row.score >= 4)
      .sort((a, b) => b.score - a.score)
      // .slice(0, 20)
      .map((row) => row.id);

    setSimilarRowIds(matches);
  };

  const handleClearSimilarRows = () => {
    setSimilarRowIds([]);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  const closeDetailDrawer = () => {
    setDetailRow(null);
    setSimilarRowIds([]);
    setIsApplyingDecision(false);
  };

  const closeDrawerWithFeedback = (message) => {
    setIsApplyingDecision(true);
    showToast(message);

    setTimeout(() => {
      closeDetailDrawer();
    }, 500);
  };

  const refreshRowsWithLearning = (rows) => enrichRowsWithReviewSignals(rows);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Typography variant="h5">Learning & Review</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 3 }} color="text.secondary">
        Review grouped records, identify patterns, and decide how they should be
        treated going forward.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Raw Records (Exploration)</Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Supplier contains:</Typography>
              <Box
                component="input"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                sx={{
                  px: 1,
                  py: 0.75,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  color: "text.primary",
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Document Type:</Typography>
              <Select
                size="small"
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All</MenuItem>
                {documentTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Payment Terms:</Typography>
              <Select
                size="small"
                value={paymentTermsFilter}
                onChange={(e) => setPaymentTermsFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All</MenuItem>
                {paymentTermsOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 320 }}>
              <InputLabel id="extra-columns-label">Extra Columns</InputLabel>
              <Select
                labelId="extra-columns-label"
                multiple
                value={extraVisibleColumns}
                onChange={(e) => setExtraVisibleColumns(e.target.value)}
                input={<OutlinedInput label="Extra Columns" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {availableExtraColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Checkbox checked={extraVisibleColumns.includes(col)} />
                    <Typography variant="body2">{col}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showUnreviewedOnly}
                    onChange={(e) => setShowUnreviewedOnly(e.target.checked)}
                  />
                }
                label="Unreviewed only"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showMissingAbnOnly}
                    onChange={(e) => setShowMissingAbnOnly(e.target.checked)}
                  />
                }
                label="Missing ABN"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showMissingTermsOnly}
                    onChange={(e) => setShowMissingTermsOnly(e.target.checked)}
                  />
                }
                label="Missing terms"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showNegativeAmountsOnly}
                    onChange={(e) =>
                      setShowNegativeAmountsOnly(e.target.checked)
                    }
                  />
                }
                label="Negative amounts"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showTinyAmountsOnly}
                    onChange={(e) => setShowTinyAmountsOnly(e.target.checked)}
                  />
                }
                label="Zero / tiny amounts"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showHighDaysOnly}
                    onChange={(e) => setShowHighDaysOnly(e.target.checked)}
                  />
                }
                label="45+ days"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showHighConfidenceOnly}
                    onChange={(e) =>
                      setShowHighConfidenceOnly(e.target.checked)
                    }
                  />
                }
                label="High confidence internal"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showSuggestedIntraGroupOnly}
                    onChange={(e) =>
                      setShowSuggestedIntraGroupOnly(e.target.checked)
                    }
                  />
                }
                label="Suggested intra-group"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showSuggestedTransferOnly}
                    onChange={(e) =>
                      setShowSuggestedTransferOnly(e.target.checked)
                    }
                  />
                }
                label="Suggested transfer"
              />
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {sortedRows.length} rows
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                {selectedRowIds.length} selected
              </Typography>
              <Button
                variant="contained"
                size="small"
                disabled={!selectedRowIds.length}
                onClick={handleOpenDecisionDialog}
              >
                Apply Decision
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "include",
                    reason: "confirmed_include",
                    note: "Included as-is via preset",
                  })
                }
              >
                Include as-is
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "exclude",
                    reason: "duplicate",
                    note: "Excluded via duplicate preset",
                  })
                }
              >
                Exclude duplicate
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "exclude",
                    reason: "transfer",
                    note: "Excluded via transfer preset",
                  })
                }
              >
                Exclude transfer
              </Button>
              <Button
                size="small"
                disabled={!selectedRowIds.length}
                onClick={() =>
                  applyPresetDecisionToIds({
                    rowIds: selectedRowIds,
                    type: "classify",
                    reason: "follow_up",
                    note: "Marked for follow-up via preset",
                  })
                }
              >
                Mark follow-up
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                Click a row to inspect it. Use checkboxes to build a review
                group.
              </Typography>
              {similarRowIds.length ? (
                <Chip
                  size="small"
                  color="info"
                  label={`${similarRowIds.length} similar row(s) highlighted`}
                  onDelete={handleClearSimilarRows}
                />
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        {isLoading ? (
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Loading staged rows...
          </Typography>
        ) : null}

        {loadError ? (
          <Typography variant="body2" sx={{ mt: 2 }} color="error">
            {loadError}
          </Typography>
        ) : null}

        {!isLoading && !loadError ? (
          <TableContainer
            sx={{
              mt: 2,
              maxWidth: "100%",
              overflowX: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                tableLayout: "fixed",
                minWidth: 2200,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    padding="checkbox"
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={handleToggleSelectAll}
                    />
                  </TableCell>
                  {visibleColumns.map((col) => {
                    const displayCol = displayColumnMap[col];
                    const isConfiguredColumn = Boolean(displayCol);
                    const sortKey = isConfiguredColumn
                      ? displayCol.sourceKey
                      : col;
                    const label = isConfiguredColumn ? displayCol.label : col;
                    const isReviewStatus = sortKey === "__reviewStatus";

                    return (
                      <TableCell
                        key={col}
                        onClick={() =>
                          isReviewStatus ? null : handleSortChange(sortKey)
                        }
                        sx={{
                          ...getCellSx(col),
                          cursor: isReviewStatus ? "default" : "pointer",
                          userSelect: "none",
                        }}
                      >
                        {label}
                        {sortBy === sortKey
                          ? sortDirection === "asc"
                            ? " ↑"
                            : " ↓"
                          : ""}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.map((row) => {
                  const isSelected = selectedRowIds.includes(row.__mockId);
                  const isSimilar = similarRowIds.includes(row.__mockId);

                  return (
                    <TableRow
                      key={row.__mockId}
                      hover
                      selected={isSelected}
                      onClick={() => setDetailRow(row)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: isSimilar ? "action.hover" : undefined,
                      }}
                    >
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRow(row.__mockId);
                        }}
                        sx={{
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          bgcolor: isSimilar
                            ? "action.hover"
                            : isSelected
                              ? "action.selected"
                              : "background.paper",
                        }}
                      >
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      {visibleColumns.map((col) => {
                        const displayCol = displayColumnMap[col];
                        const isConfiguredColumn = Boolean(displayCol);
                        const sourceKey = isConfiguredColumn
                          ? displayCol.sourceKey
                          : col;
                        const rawValue = isConfiguredColumn
                          ? getDisplayValue(row, col)
                          : row[col];

                        return (
                          <TableCell key={col} sx={getCellSx(col)}>
                            {sourceKey === "__reviewStatus"
                              ? renderReviewedCell(row)
                              : sourceKey === "__confidenceOutcome"
                                ? formatConfidenceOutcome(rawValue)
                                : sourceKey === "__reviewFlagsLabel"
                                  ? formatFlags(row.__reviewFlags)
                                  : String(rawValue ?? "")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
      >
        <Box sx={{ width: 520, p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="h6">Row Detail</Typography>
                <Typography variant="body2" color="text.secondary">
                  Inspect the record and its current mock review state.
                </Typography>
              </Box>
              <Button size="small" onClick={closeDetailDrawer}>
                Close
              </Button>
            </Stack>

            {detailRow ? (
              <>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Review Status</Typography>
                    {renderReviewedCell(detailRow)}
                    <Typography variant="body2">
                      <strong>Suggested Category:</strong>{" "}
                      {String(detailRow.__suggestedCategory || "")}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Confidence Outcome:</strong>{" "}
                      {formatConfidenceOutcome(detailRow.__confidenceOutcome)}
                    </Typography>
                    {detailRow.__decisionNote ? (
                      <Typography variant="body2" color="text.secondary">
                        {detailRow.__decisionNote}
                      </Typography>
                    ) : null}
                    {similarRowIds.length ? (
                      <Chip
                        size="small"
                        color="info"
                        label={`${similarRowIds.length} similar row(s) found`}
                        onDelete={handleClearSimilarRows}
                      />
                    ) : null}
                    {/* Learning Debug UI */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2">
                          Learning Debug
                        </Typography>
                        <Typography variant="body2">
                          <strong>Learned Adjustment:</strong>{" "}
                          {detailRow.__learnedAdjustment ?? 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Matched Sources:</strong>{" "}
                          {Array.isArray(detailRow.__matchedLearningSources) &&
                          detailRow.__matchedLearningSources.length
                            ? detailRow.__matchedLearningSources.join(", ")
                            : "-"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Category Bias:</strong>{" "}
                          {detailRow.__learnedCategoryBias
                            ? JSON.stringify(detailRow.__learnedCategoryBias)
                            : "{}"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Bias Gap:</strong>{" "}
                          {detailRow.__learnedBiasGap ?? 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Override Allowed:</strong>{" "}
                          {detailRow.__learnedOverrideAllowed ? "Yes" : "No"}
                        </Typography>
                      </Stack>
                    </Paper>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ pt: 1 }}
                      flexWrap="wrap"
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isApplyingDecision}
                        onClick={handleSuggestSimilarRows}
                      >
                        Suggest Similar Rows
                      </Button>
                      {similarRowIds.length ? (
                        <Button
                          size="small"
                          disabled={isApplyingDecision}
                          onClick={handleClearSimilarRows}
                        >
                          Clear Suggestions
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isApplyingDecision}
                        onClick={handleAcceptRecommendation}
                      >
                        Accept This Row
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isApplyingDecision || !similarRowIds.length}
                        onClick={handleAcceptAllSimilarRecommendations}
                      >
                        Accept All Similar
                      </Button>
                      <Button
                        size="small"
                        color="warning"
                        disabled={isApplyingDecision}
                        onClick={handleRejectRecommendation}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          handleReclassifyRecommendation("intra_group")
                        }
                      >
                        Reclassify Intra-group
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          handleReclassifyRecommendation("transfer")
                        }
                      >
                        Reclassify Transfer
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "include",
                            reason: "confirmed_include",
                            note: "Included as-is via preset",
                          })
                        }
                      >
                        Include as-is
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "exclude",
                            reason: "duplicate",
                            note: "Excluded via duplicate preset",
                          })
                        }
                      >
                        Exclude duplicate
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "exclude",
                            reason: "transfer",
                            note: "Excluded via transfer preset",
                          })
                        }
                      >
                        Exclude transfer
                      </Button>
                      <Button
                        size="small"
                        disabled={isApplyingDecision}
                        onClick={() =>
                          applyPresetDecisionToDetailRow({
                            type: "classify",
                            reason: "follow_up",
                            note: "Marked for follow-up via preset",
                          })
                        }
                      >
                        Mark follow-up
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Key Fields</Typography>
                    {defaultVisibleColumns
                      .filter((col) => col !== "__reviewStatus")
                      .map((col) => {
                        const displayCol = displayColumnMap[col];
                        const rawValue = displayCol
                          ? getDisplayValue(detailRow, col)
                          : detailRow[col];

                        let displayValue = rawValue;

                        if (displayCol?.sourceKey === "__confidenceOutcome") {
                          displayValue = formatConfidenceOutcome(rawValue);
                        } else if (
                          displayCol?.sourceKey === "__reviewFlagsLabel"
                        ) {
                          displayValue = formatFlags(detailRow.__reviewFlags);
                        }

                        return (
                          <Typography key={col} variant="body2">
                            <strong>{displayCol?.label || col}:</strong>{" "}
                            {String(displayValue ?? "")}
                          </Typography>
                        );
                      })}
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Raw Record</Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        overflow: "auto",
                        bgcolor: "background.default",
                        borderRadius: 1,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {JSON.stringify(detailRow, null, 2)}
                    </Box>
                  </Stack>
                </Paper>
              </>
            ) : null}
          </Stack>
        </Box>
      </Drawer>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity="success"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={rejectionDialogOpen}
        onClose={handleCloseRejectionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {rejectionFinalCategory === "normal"
            ? "Why is this suggestion wrong?"
            : `Why should this be ${rejectionFinalCategory}?`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select one or more reasons so the system can learn which signals
              were misleading. Use Apply selection to confirm the chosen reasons
              before submitting the dialog.
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 1.5, maxHeight: 320, overflow: "auto" }}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle2">Reasons</Typography>
                {rejectionReasonOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={pendingRejectionReasons.includes(option.value)}
                        onChange={() =>
                          handleTogglePendingRejectionReason(option.value)
                        }
                      />
                    }
                    label={option.label}
                  />
                ))}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    onClick={handleCancelPendingRejectionReasons}
                  >
                    Cancel selection
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleApplyPendingRejectionReasons}
                  >
                    Apply selection
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Typography variant="body2">
              <strong>Applied reasons:</strong>{" "}
              {rejectionReasons.length
                ? rejectionReasonOptions
                    .filter((option) => rejectionReasons.includes(option.value))
                    .map((option) => option.label)
                    .join(", ")
                : "None selected yet"}
            </Typography>

            <TextField
              label="Optional note"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectionDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!rejectionReasons.length}
            onClick={handleSubmitRejectionDialog}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={decisionDialogOpen}
        onClose={handleCloseDecisionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Apply Mock Review Decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This is frontend-only for now. We are pretending the backend
              exists and saves the review group and decision.
            </Typography>

            <Typography variant="body2">
              {selectedRowIds.length} row(s) selected
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="decision-type-label">Decision Type</InputLabel>
              <Select
                labelId="decision-type-label"
                value={decisionType}
                label="Decision Type"
                onChange={(e) => setDecisionType(e.target.value)}
              >
                <MenuItem value="include">Include</MenuItem>
                <MenuItem value="exclude">Exclude</MenuItem>
                <MenuItem value="classify">Classify</MenuItem>
                <MenuItem value="terms_override">Terms Override</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="reason-code-label">Reason Code</InputLabel>
              <Select
                labelId="reason-code-label"
                value={reasonCode}
                label="Reason Code"
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <MenuItem value="not_reportable">Not reportable</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
                <MenuItem value="intra_group">Intra-group</MenuItem>
                <MenuItem value="employee_related">Employee related</MenuItem>
                <MenuItem value="government_related">
                  Government related
                </MenuItem>
                <MenuItem value="duplicate">Duplicate</MenuItem>
                <MenuItem value="confirmed_include">Confirmed include</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
                <MenuItem value="partial_payment">Partial payment</MenuItem>
                <MenuItem value="prepayment">Prepayment</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Note"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDecisionDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyMockDecision}>
            Save Mock Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
