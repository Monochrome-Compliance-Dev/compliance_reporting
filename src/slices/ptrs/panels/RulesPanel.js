import {
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { useState, useMemo, useEffect } from "react";

import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRef } from "react";
import { usePtrsContext } from "../context/PtrsContext";
import {
  useRuleExecutionHistory,
  useRuleHeaders,
  useRuleSources,
  useRulesState,
} from "../rules/hooks";
import {
  usePtrsDatasetsQuery,
  usePtrsJoinsQuery,
  usePtrsMapQuery,
  useUpdatePtrsMutation,
} from "../hooks/usePtrsQueries";
import {
  applyRules,
  getPtrsRules,
  previewRules,
  savePtrsRules,
} from "../services/rules.ptrsApi";
import RulesSandbox from "./RulesSandbox";
import {
  RuleExecutionTimeline,
  RuleImportDialog,
  RuleList,
  RuleToolbar,
} from "../rules/components";
import { LoadingSpinner } from "shared/ui";

// helpers
const toSnake = (s) =>
  !s
    ? ""
    : String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s/-]+/g, "_")
        .replace(/__+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

const safeLc = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

const addHeaderValue = (set, value) => {
  const raw = String(value || "").trim();
  if (raw) set.add(raw);
};

const makeCid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rule_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const formatPreviewMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value || "");
  return num.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatPreviewDelta = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value || "");
  const abs = Math.abs(num).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${num >= 0 ? "+" : "-"}${abs}`;
};

const getPreviewField = (row, ...keys) => {
  for (const key of keys) {
    if (row && row[key] != null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
};

const formatPreviewText = (value, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

// Helper: detect if a cross-row rule is dangerously broad (no match, no positive where)
const isBroadCrossRowRule = (rule) => {
  if ((rule?.type || "row") !== "crossRow") return false;

  const match = Array.isArray(rule?.target?.match) ? rule.target.match : [];
  const where = Array.isArray(rule?.target?.where) ? rule.target.where : [];

  if (match.length > 0) return false;

  const hasPositiveWhere = where.some((w) => ["eq", "in"].includes(w?.op));
  return !hasPositiveWhere;
};

const normalisePtrsRules = (rowRules = [], crossRowRules = []) => {
  const rows = Array.isArray(rowRules)
    ? rowRules.map((r, i) => {
        const addAct = Array.isArray(r.then)
          ? r.then.find((a) => ["add", "concat_fields"].includes(a.op))
          : null;

        const action = addAct
          ? {
              op: addAct.op || "add",
              field: addAct.field || "",
              valueFieldFromCurrent: addAct.valueField || "",
              fields: Array.isArray(addAct.fields) ? addAct.fields : [],
              segments: Array.isArray(addAct.segments)
                ? addAct.segments
                : Array.isArray(addAct.fields)
                  ? addAct.fields.map((name) => ({ kind: "field", name }))
                  : [],
              separator: addAct.separator || "|",
              round: typeof addAct.round === "number" ? addAct.round : 2,
            }
          : {
              op: "add",
              field: "",
              valueFieldFromCurrent: "",
              fields: [],
              segments: [],
              separator: "|",
              round: 2,
            };

        return {
          id: r.id || `r${i + 1}`,
          type: r.type || "row",
          label: r.label || "",
          description: r.description || "",
          groupName: r.groupName || "",
          enabled: r.enabled !== false,
          when: Array.isArray(r.when) ? r.when : [],
          target: {
            match: Array.isArray(r?.target?.match) ? r.target.match : [],
            where: Array.isArray(r?.target?.where) ? r.target.where : [],
            selection: r?.target?.selection || "first_match",
            requireMatch: r?.target?.requireMatch !== false,
            excludeUnmatchedCurrent:
              r?.target?.excludeUnmatchedCurrent === true,
            unmatchedComment: r?.target?.unmatchedComment || "",
          },
          action,
        };
      })
    : [];

  const crosses = Array.isArray(crossRowRules)
    ? crossRowRules.map((r, j) => ({
        id: r.id || `x${j + 1}`,
        type: "crossRow",
        label: r.label || "",
        description: r.description || "",
        groupName: r.groupName || "",
        enabled: r.enabled !== false,
        when: Array.isArray(r.when) ? r.when : [],
        target: {
          match: Array.isArray(r?.target?.match) ? r.target.match : [],
          where: Array.isArray(r?.target?.where) ? r.target.where : [],
          selection: r?.target?.selection || "first_match",
          requireMatch: r?.target?.requireMatch !== false,
          excludeUnmatchedCurrent: r?.target?.excludeUnmatchedCurrent === true,
          unmatchedComment: r?.target?.unmatchedComment || "",
        },
        action: r.action || {},
        alsoExcludeCurrent: !!r.alsoExcludeCurrent,
      }))
    : [];

  return [...rows, ...crosses];
};

export default function RulesPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsContext();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;
  const { data: queriedPtrsMap } = usePtrsMapQuery(ptrsId);
  const dsQ = usePtrsDatasetsQuery(ptrsId);
  const joinsQ = usePtrsJoinsQuery(ptrsId);

  console.log("[RulesPanel] query raw", {
    ptrsId,
    queriedPtrsMap,
    datasetsData: dsQ.data,
    datasetsIsLoading: dsQ.isLoading,
    datasetsIsFetching: dsQ.isFetching,
    datasetsError: dsQ.error,
    joinsData: joinsQ.data,
    joinsIsLoading: joinsQ.isLoading,
    joinsIsFetching: joinsQ.isFetching,
    joinsError: joinsQ.error,
  });

  const { goTo } = usePtrsNavigation();

  const effectiveMap = queriedPtrsMap || null;

  const hasCtxMap = !!(
    effectiveMap &&
    ((effectiveMap.mappings &&
      Object.keys(effectiveMap.mappings || {}).length > 0) ||
      (Array.isArray(effectiveMap.fieldMap) &&
        effectiveMap.fieldMap.length > 0))
  );

  const normaliseJoins = (raw) => {
    if (!raw || typeof raw !== "object") {
      return { conditions: [], customFields: [] };
    }

    const joinsSource = raw.joins ||
      raw.map?.joins || {
        conditions: [],
        customFields: [],
      };

    let conditions = [];
    let customFields = [];

    if (Array.isArray(joinsSource)) {
      conditions = joinsSource;
    } else if (joinsSource && typeof joinsSource === "object") {
      if (Array.isArray(joinsSource.conditions)) {
        conditions = joinsSource.conditions;
      }
      if (Array.isArray(joinsSource.customFields)) {
        customFields = joinsSource.customFields;
      }
    }

    const topLevelCustomFields =
      raw.customFields || raw.map?.customFields || null;
    if (Array.isArray(topLevelCustomFields)) {
      customFields = topLevelCustomFields;
    }

    return { conditions, customFields };
  };

  const datasetItems = useMemo(
    () => (Array.isArray(dsQ.data?.items) ? dsQ.data.items : []),
    [dsQ.data],
  );

  const transactionHeadersByDataset = useMemo(() => {
    const byDataset = {};

    datasetItems.forEach((dataset) => {
      const datasetId = String(dataset?.id || "");
      if (!datasetId || dataset?.purpose !== "transaction") return;

      const roleHeaders = (dataset?.meta?.headers || dataset?.headers || [])
        .filter(Boolean)
        .map(String);

      if (!roleHeaders.length) return;

      byDataset[datasetId] = Array.from(new Set(roleHeaders)).sort((a, b) =>
        a.localeCompare(b),
      );
    });

    return byDataset;
  }, [datasetItems]);

  const transactionHeaders = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(transactionHeadersByDataset).flatMap((arr) => arr || []),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [transactionHeadersByDataset]);

  const joinsData = joinsQ.data || null;
  const normalisedJoins = useMemo(
    () => normaliseJoins(joinsData || {}),
    [joinsData],
  );
  const joinsCustomFields = useMemo(
    () =>
      Array.isArray(normalisedJoins?.customFields)
        ? normalisedJoins.customFields
        : [],
    [normalisedJoins],
  );
  const { headers } = useRuleHeaders(ptrsId, effectiveMap);

  const fieldMapRows = useMemo(
    () => (Array.isArray(effectiveMap?.fieldMap) ? effectiveMap.fieldMap : []),
    [effectiveMap],
  );

  const resolveCanonicalField = useMemo(() => {
    const byAnyKey = new Map();

    const register = (candidate, canonical) => {
      const key = safeLc(candidate);
      const value = String(canonical || "").trim();
      if (!key || !value) return;
      if (!byAnyKey.has(key)) {
        byAnyKey.set(key, value);
      }
    };

    for (const row of fieldMapRows) {
      const canonical = String(row?.canonicalField || row?.field || "").trim();
      if (!canonical) continue;

      register(row?.canonicalField, canonical);
      register(row?.field, canonical);
      register(row?.sourceColumn, canonical);
      register(row?.header, canonical);
      register(toSnake(row?.canonicalField), canonical);
      register(toSnake(row?.field), canonical);
      register(toSnake(row?.sourceColumn), canonical);
      register(toSnake(row?.header), canonical);
    }

    for (const h of Array.isArray(headers) ? headers : []) {
      const raw = String(h || "").trim();
      if (!raw) continue;
      register(raw, raw);
      register(toSnake(raw), raw);
    }

    for (const cf of Array.isArray(joinsCustomFields)
      ? joinsCustomFields
      : []) {
      const key = String(cf?.key || "").trim();
      if (!key) continue;
      register(key, key);
      register(toSnake(key), key);
    }

    return (input) => {
      const raw = String(input || "").trim();
      if (!raw) return "";
      return (
        byAnyKey.get(safeLc(raw)) ||
        byAnyKey.get(safeLc(toSnake(raw))) ||
        toSnake(raw)
      );
    };
  }, [fieldMapRows, headers, joinsCustomFields]);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const isBusy = isPreviewing || isApplying;
  const [importOpen, setImportOpen] = useState(false);
  const [selectedRuleSource, setSelectedRuleSource] = useState(null);

  const { sources: ruleSources } = useRuleSources(ptrsId, profileId);
  const { history } = useRuleExecutionHistory(ptrsId);

  const { rules, resetRules, addRule, updateRule, removeRule } = useRulesState(
    [],
  );
  const handleAddRule = () => {
    setShowRuleGroups((prev) => ({ ...prev, __blank__: true }));
    addRule();
  };

  const [lastPreview, setLastPreview] = useState(null);
  const [lastPreviewRows, setLastPreviewRows] = useState([]);
  const [lastPreviewExamples, setLastPreviewExamples] = useState([]);
  const [lastPreviewExamplesPagination, setLastPreviewExamplesPagination] =
    useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [, setPreviewPage] = useState(0);
  const [lastApplyResult, setLastApplyResult] = useState(null);
  const [showRuleGroups, setShowRuleGroups] = useState({});
  const [selectedGroupKey, setSelectedGroupKey] = useState("__all__");

  const getRuleType = (rule) => {
    return rule?.type === "crossRow" ? "crossRow" : "row";
  };

  const getRuleGroupKey = (rule) => {
    const name = String(rule?.groupName || "").trim();
    return name || "__blank__";
  };

  const getRuleGroupLabel = (groupKey) => {
    return groupKey === "__blank__" ? "Group name required" : groupKey;
  };

  const selectedRules = useMemo(() => {
    if (selectedGroupKey === "__all__") {
      return rules;
    }
    return rules.filter((rule) => getRuleGroupKey(rule) === selectedGroupKey);
  }, [rules, selectedGroupKey]);

  const rowPreviewColumns = useMemo(() => {
    const columns = [
      {
        key: "row_no",
        label: "Row",
      },
    ];

    const seen = new Set(["row_no"]);

    for (const rule of selectedRules) {
      if (getRuleType(rule) !== "row") continue;

      const action = rule?.action || {};

      if (action.op === "concat_fields") {
        for (const segment of Array.isArray(action.segments)
          ? action.segments
          : []) {
          if (segment?.kind !== "field") continue;

          const fieldName = String(segment?.name || "").trim();
          if (!fieldName) continue;

          const normalisedFieldName = toSnake(fieldName);
          if (seen.has(normalisedFieldName)) continue;

          seen.add(normalisedFieldName);
          columns.push({
            key: normalisedFieldName,
            sourceKey: fieldName,
            label: fieldName,
          });
        }
      }

      const targetField = String(action?.field || "").trim();
      if (targetField && !seen.has(targetField)) {
        seen.add(targetField);
        columns.push({
          key: targetField,
          label: targetField,
        });
      }
    }

    return columns;
  }, [selectedRules]);

  const selectedGroupLabel = useMemo(() => {
    if (selectedGroupKey === "__all__") {
      return "All groups";
    }
    return getRuleGroupLabel(selectedGroupKey);
  }, [selectedGroupKey]);

  const [helperFields, setHelperFields] = useState([]);

  const rulesLoadedRef = useRef(false);

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  // Helper to create a row rule from a single condition
  const createRowRuleFromCondition = (condition) => ({
    cid: makeCid(),
    id: makeCid(),
    label: "",
    description: "",
    groupName: "",
    enabled: true,
    type: "row",
    when: condition ? [condition] : [],
    target: {
      match: [],
      where: [],
      selection: "first_match",
      requireMatch: false,
      excludeUnmatchedCurrent: false,
      unmatchedComment: "",
    },
    action: { op: "add", field: "", valueFieldFromCurrent: "", round: 2 },
  });

  // Helper to create a cross-row rule template from a condition
  const createCrossRowRuleTemplate = (condition) => ({
    cid: makeCid(),
    id: makeCid(),
    label: "",
    description: "",
    groupName: "",
    enabled: true,
    type: "crossRow",
    when: condition ? [condition] : [],
    target: {
      match: [{ currentField: "", targetField: "" }],
      where: [],
      selection: "first_match",
      requireMatch: false,
      excludeUnmatchedCurrent: false,
      unmatchedComment: "",
    },
    action: {
      op: "add",
      field: "",
      valueFieldFromCurrent: "",
      round: 2,
    },
    alsoExcludeCurrent: true,
  });

  const createConcatHelperRule = (fieldName, segments) => ({
    cid: makeCid(),
    id: makeCid(),
    label: `Helper field: ${fieldName}`,
    description: `Derived helper field from ${segments
      .map((seg) =>
        seg?.kind === "literal" ? `'${seg?.value || ""}'` : seg?.name || "",
      )
      .join(", ")}`,
    groupName: "",
    enabled: true,
    type: "row",
    when: [],
    target: {
      match: [],
      where: [],
      selection: "first_match",
      requireMatch: false,
    },
    action: {
      op: "concat_fields",
      field: fieldName,
      valueFieldFromCurrent: "",
      segments,
      round: 2,
    },
  });

  // Handler to seed a rule from a sandbox filter (supports row and cross-row)
  const seedRuleFromFilter = (payload) => {
    const { condition, kind = "row" } = payload || {};
    if (!condition || !condition.field || !condition.op) {
      return;
    }
    let newRule;
    if (kind === "crossRow") {
      newRule = createCrossRowRuleTemplate(condition);
    } else {
      newRule = createRowRuleFromCondition(condition);
    }
    resetRules([...rules, newRule]);
  };

  const addHelperField = () => {
    setHelperFields((prev) => [
      ...prev,
      {
        key: "",
        type: "concat",
        segments: [],
      },
    ]);
  };

  const updateHelperField = (idx, patch) => {
    setHelperFields((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );
  };

  const updateHelperSegment = (idx, segIdx, patch) => {
    setHelperFields((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const segments = Array.isArray(item?.segments) ? item.segments : [];
        return {
          ...item,
          segments: segments.map((seg, sIdx) =>
            sIdx === segIdx ? { ...seg, ...patch } : seg,
          ),
        };
      }),
    );
  };

  const addHelperSegment = (idx, kind) => {
    setHelperFields((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const segments = Array.isArray(item?.segments) ? item.segments : [];
        const nextSeg =
          kind === "field"
            ? {
                kind: "field",
                name: helperFieldOptions[0]?.value || "",
              }
            : { kind: "literal", value: "" };
        return {
          ...item,
          segments: [...segments, nextSeg],
        };
      }),
    );
  };

  const removeHelperSegment = (idx, segIdx) => {
    setHelperFields((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const segments = Array.isArray(item?.segments) ? item.segments : [];
        return {
          ...item,
          segments: segments.filter((_, sIdx) => sIdx !== segIdx),
        };
      }),
    );
  };

  const removeHelperField = (idx) => {
    setHelperFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddHelperFieldRules = () => {
    const nextRules = [];

    for (const helper of helperFields) {
      const fieldName = String(helper?.key || "").trim();
      const segments = Array.isArray(helper?.segments)
        ? helper.segments
            .map((seg) => {
              if (seg?.kind === "literal") {
                return {
                  kind: "literal",
                  value: String(seg?.value || ""),
                };
              }
              const name = String(seg?.name || "").trim();
              return name ? { kind: "field", name } : null;
            })
            .filter(Boolean)
        : [];

      if (!fieldName || !segments.length) continue;
      nextRules.push(createConcatHelperRule(fieldName, segments));
    }

    if (!nextRules.length) {
      showAlert("Add at least one valid helper field first.", "info");
      return;
    }

    resetRules([...rules, ...nextRules]);
    setHelperFields([]);
    showAlert(
      `Added ${nextRules.length} helper field rule${nextRules.length === 1 ? "" : "s"}.`,
      "success",
    );
  };

  const canApply = useMemo(() => {
    return Boolean(ptrsId && Array.isArray(headers) && headers.length > 0);
  }, [ptrsId, headers]);

  const helperFieldOptions = useMemo(() => {
    const optionsByValue = new Map();

    const addOption = (input, sourceLabel = "", explicitValue = "") => {
      const raw = String(input || "").trim();
      if (!raw) return;

      const value = String(explicitValue || raw).trim();
      if (!value) return;

      const label = sourceLabel ? `${raw} — ${sourceLabel}` : raw;

      if (!optionsByValue.has(value)) {
        optionsByValue.set(value, {
          value,
          label,
          sortLabel: `${label} ${value}`.toLowerCase(),
        });
      }
    };

    const datasetDrivenHeaders = datasetItems
      .filter((dataset) => dataset?.purpose === "transaction")
      .flatMap((dataset) =>
        Array.isArray(transactionHeadersByDataset[dataset.id])
          ? transactionHeadersByDataset[dataset.id].map((header) => ({
                header,
                sourceLabel:
                  dataset.sourceName || dataset.fileName || dataset.id,
              }))
          : [],
      );

    for (const item of datasetDrivenHeaders) {
      addOption(item?.header, item?.sourceLabel || "transaction dataset");
    }

    for (const cf of joinsCustomFields) {
      const sourceDataset = datasetItems.find(
        (dataset) => String(dataset?.id || "") === String(cf?.datasetId || ""),
      );
      if (sourceDataset?.purpose === "transaction") {
        addOption(cf?.key, "custom field (transaction dataset)");
      }
    }

    for (const row of fieldMapRows) {
      const canonical = String(row?.canonicalField || row?.field || "").trim();
      if (!canonical) continue;

      addOption(
        row?.sourceColumn || row?.header || canonical,
        row?.sourceColumn || row?.header
          ? `mapped to ${canonical}`
          : "mapped field",
        canonical,
      );
      addOption(canonical, "mapped field", canonical);
    }

    const legacyMappings =
      effectiveMap?.mappings && typeof effectiveMap.mappings === "object"
        ? effectiveMap.mappings
        : {};

    for (const [key, value] of Object.entries(legacyMappings)) {
      addOption(key, "legacy mapping");

      if (typeof value === "string") {
        addOption(value, "legacy mapping");
      } else if (value && typeof value === "object") {
        addOption(value?.canonicalField, "legacy mapping");
        addOption(value?.field, "legacy mapping");
        addOption(value?.sourceColumn, "legacy mapping");
        addOption(value?.header, "legacy mapping");
        addOption(value?.name, "legacy mapping");
      }
    }

    for (const helper of Array.isArray(helperFields) ? helperFields : []) {
      addOption(helper?.key, "helper field");
    }
    for (const rule of Array.isArray(rules) ? rules : []) {
      const action = rule?.action || {};
      if (String(action?.op || "") === "concat_fields") {
        addOption(action?.field, "helper field rule");
      }
    }

    for (const header of Array.isArray(headers) ? headers : []) {
      addOption(header, "header");
    }

    return Array.from(optionsByValue.values()).sort((a, b) =>
      a.sortLabel.localeCompare(b.sortLabel),
    );
  }, [
    headers,
    helperFields,
    rules,
    transactionHeadersByDataset,
    datasetItems,
    joinsCustomFields,
    fieldMapRows,
    effectiveMap,
  ]);

  const ruleBuilderHeaders = useMemo(() => {
    const merged = new Set();

    for (const h of Array.isArray(headers) ? headers : []) {
      addHeaderValue(merged, h);
      addHeaderValue(merged, toSnake(h));
    }

    for (const opt of Array.isArray(helperFieldOptions)
      ? helperFieldOptions
      : []) {
      addHeaderValue(merged, opt?.value);
      addHeaderValue(merged, toSnake(opt?.value));
    }

    for (const row of Array.isArray(fieldMapRows) ? fieldMapRows : []) {
      addHeaderValue(merged, row?.canonicalField);
      addHeaderValue(merged, toSnake(row?.canonicalField));
      addHeaderValue(merged, row?.field);
      addHeaderValue(merged, toSnake(row?.field));
      addHeaderValue(merged, row?.sourceColumn);
      addHeaderValue(merged, toSnake(row?.sourceColumn));
      addHeaderValue(merged, row?.header);
      addHeaderValue(merged, toSnake(row?.header));
    }

    for (const cf of Array.isArray(joinsCustomFields)
      ? joinsCustomFields
      : []) {
      addHeaderValue(merged, cf?.key);
      addHeaderValue(merged, toSnake(cf?.key));
    }

    for (const rule of Array.isArray(rules) ? rules : []) {
      for (const cond of Array.isArray(rule?.when) ? rule.when : []) {
        addHeaderValue(merged, cond?.field);
        addHeaderValue(merged, toSnake(cond?.field));
      }

      for (const match of Array.isArray(rule?.target?.match)
        ? rule.target.match
        : []) {
        addHeaderValue(merged, match?.currentField);
        addHeaderValue(merged, toSnake(match?.currentField));
        addHeaderValue(merged, match?.targetField);
        addHeaderValue(merged, toSnake(match?.targetField));
      }

      for (const cond of Array.isArray(rule?.target?.where)
        ? rule.target.where
        : []) {
        addHeaderValue(merged, cond?.field);
        addHeaderValue(merged, toSnake(cond?.field));
      }

      addHeaderValue(merged, rule?.action?.field);
      addHeaderValue(merged, toSnake(rule?.action?.field));
      addHeaderValue(merged, rule?.action?.valueFieldFromCurrent);
      addHeaderValue(merged, toSnake(rule?.action?.valueFieldFromCurrent));

      if (Array.isArray(rule?.action?.segments)) {
        for (const seg of rule.action.segments) {
          if (seg?.kind === "field") {
            addHeaderValue(merged, seg?.name);
            addHeaderValue(merged, toSnake(seg?.name));
          }
        }
      }
    }

    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [headers, helperFieldOptions, fieldMapRows, joinsCustomFields, rules]);

  const groupedRules = useMemo(() => {
    const groups = [];
    const byKey = new Map();

    rules.forEach((rule) => {
      const groupKey = getRuleGroupKey(rule);
      if (!byKey.has(groupKey)) {
        const nextGroup = {
          key: groupKey,
          label: getRuleGroupLabel(groupKey),
          rules: [],
        };
        byKey.set(groupKey, nextGroup);
        groups.push(nextGroup);
      }
      byKey.get(groupKey).rules.push(rule);
    });

    return groups;
  }, [rules]);

  const openSectionForRule = (rule) => {
    const groupKey = getRuleGroupKey(rule);
    setShowRuleGroups((prev) => ({ ...prev, [groupKey]: true }));
  };

  const handleUpdateRule = (ruleKey, patch) => {
    const currentRule = rules.find((r) => (r?.cid || r?.id) === ruleKey);
    const nextRule = currentRule ? { ...currentRule, ...patch } : patch || {};

    openSectionForRule(nextRule);
    updateRule(ruleKey, patch);
  };

  // Lightweight debug log: only fires when ptrsId/profileId/map keys change
  const debugKeyRef = useRef("");
  useEffect(() => {
    const mapKeys = effectiveMap?.mappings
      ? Object.keys(effectiveMap.mappings).length
      : Array.isArray(effectiveMap?.fieldMap)
        ? effectiveMap.fieldMap.length
        : 0;
    const key = `${ptrsId}|${profileId || ""}|${mapKeys}`;
    if (debugKeyRef.current === key) return;
    debugKeyRef.current = key;
    // eslint-disable-next-line no-console
    console.log("[RulesPanel] state", {
      ptrsId,
      profileId,
      effectiveMap,
      datasetItemsCount: Array.isArray(datasetItems) ? datasetItems.length : 0,
      transactionHeadersCount: Array.isArray(transactionHeaders)
        ? transactionHeaders.length
        : 0,
      joinsCustomFieldsCount: Array.isArray(joinsCustomFields)
        ? joinsCustomFields.length
        : 0,
      hasCtxMap,
      headersReady: Array.isArray(headers) && headers.length > 0,
      canApply,
      ctxMapKeys: mapKeys,
      fieldMapRowsCount: Array.isArray(fieldMapRows) ? fieldMapRows.length : 0,
      hasInvoiceStatusHeader: Array.isArray(ruleBuilderHeaders)
        ? ruleBuilderHeaders.includes("invoice_status")
        : false,
      headersCount: Array.isArray(headers) ? headers.length : 0,
      ruleBuilderHeadersCount: Array.isArray(ruleBuilderHeaders)
        ? ruleBuilderHeaders.length
        : 0,
      ruleSourcesCount: Array.isArray(ruleSources) ? ruleSources.length : 0,
      rulesCount: Array.isArray(rules) ? rules.length : 0,
    });
  }, [
    ptrsId,
    profileId,
    effectiveMap,
    hasCtxMap,
    canApply,
    headers,
    ruleBuilderHeaders,
    ruleSources,
    rules,
    datasetItems,
    transactionHeaders,
    joinsCustomFields,
    fieldMapRows,
  ]);

  const openImportDialog = (event) => {
    if (
      event &&
      event.currentTarget &&
      typeof event.currentTarget.blur === "function"
    ) {
      event.currentTarget.blur();
    }
    setImportOpen(true);
  };

  useEffect(() => {
    if (!ptrsId) return;
    if (!Array.isArray(effectiveMap?.rowRules) || !effectiveMap.rowRules.length)
      return;
    if (rules.length > 0) return;

    const seeded = normalisePtrsRules(effectiveMap.rowRules || [], []);
    if (seeded.length) {
      resetRules(seeded);
    }
  }, [ptrsId, effectiveMap, rules.length, resetRules]);

  useEffect(() => {
    if (!ptrsId) return;
    if (rulesLoadedRef.current) return;

    let cancelled = false;

    const loadRules = async () => {
      try {
        const { rowRules = [], crossRowRules = [] } =
          await getPtrsRules(ptrsId);

        if (cancelled) return;

        const normalised = normalisePtrsRules(rowRules, crossRowRules);
        resetRules(normalised);
        rulesLoadedRef.current = true;
      } catch (e) {
        // deliberately no retry — prevents request storms
      }
    };

    loadRules();

    return () => {
      cancelled = true;
    };
  }, [ptrsId, resetRules]);

  const copyRulesFromPtrsId = async (otherPtrsId) => {
    if (!otherPtrsId) {
      showAlert("Pick a PTRS run to copy rules from", "info");
      return;
    }

    try {
      const { rowRules = [], crossRowRules = [] } =
        await getPtrsRules(otherPtrsId);

      const normalised = normalisePtrsRules(rowRules, crossRowRules);

      if (!normalised.length) {
        showAlert("No rules found on that PTRS run.", "info");
        return;
      }

      resetRules(normalised);
      setImportOpen(false);
      showAlert(
        `Copied ${normalised.length} rule(s) from the selected PTRS run.`,
        "success",
      );
    } catch (e) {
      showAlert(
        e?.message || "Failed to copy rules from that PTRS run.",
        "error",
      );
    }
  };

  const handlePreview = async () => {
    setPreviewPage(0);
    setIsPreviewing(true);
    setLastPreview(null);
    setLastPreviewRows([]);
    setLastPreviewExamples([]);
    setLastPreviewExamplesPagination({
      page: 1,
      limit: 30,
      total: 0,
      totalPages: 1,
    });

    try {
      showAlert("Generating rules preview…", "info");
      const previewGroupName =
        selectedGroupKey === "__all__" ? null : selectedGroupLabel;
      const cross = selectedRules.find((r) => getRuleType(r) === "crossRow");
      if (cross) {
        // Backend preview performs SELECTs over the full dataset and returns counts + examples.
        const prev = await previewRules(ptrsId, {
          mode: "full",
          groupName: previewGroupName,
          limit: 30,
          page: 1,
        });
        const affected = prev?.summary?.rowsAffected ?? 0;
        const examples = Array.isArray(prev?.examples) ? prev.examples : [];

        setLastPreview({
          kind: "crossRow",
          count: affected,
          generatedAt: new Date().toISOString(),
        });
        setLastPreviewExamples(examples);
        setLastPreviewExamplesPagination(
          prev?.examplesPagination || {
            page: 1,
            limit: 30,
            total: affected,
            totalPages: Math.max(1, Math.ceil(affected / 30)),
          },
        );

        showAlert(
          `Preview ready — ${affected} target row(s) would be adjusted.`,
          "success",
        );
        return;
      }

      const prev = await previewRules(ptrsId, {
        limit: 30,
        groupName: previewGroupName,
      });

      const actions = prev?.summary?.actions ?? 0;
      const affected = prev?.summary?.rowsAffected ?? 0;
      const previewRows = Array.isArray(prev?.rows) ? prev.rows : [];

      setLastPreview({
        kind: "row",
        affected,
        actions,
        generatedAt: new Date().toISOString(),
      });

      setLastPreviewRows(previewRows);

      showAlert(
        `Preview ready — ${affected} row(s) affected, ${actions} action(s).`,
        "success",
      );
    } catch (err) {
      showAlert(err?.message || "Failed to generate preview.", "error");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePreviewPageChange = async (_event, nextPage) => {
    setPreviewPage(nextPage);

    const cross = selectedRules.find((r) => getRuleType(r) === "crossRow");
    if (!cross) return;

    setIsPreviewing(true);
    try {
      const previewGroupName =
        selectedGroupKey === "__all__" ? null : selectedGroupLabel;

      const prev = await previewRules(ptrsId, {
        mode: "full",
        groupName: previewGroupName,
        limit: 30,
        page: nextPage + 1,
      });

      const affected = prev?.summary?.rowsAffected ?? 0;
      const examples = Array.isArray(prev?.examples) ? prev.examples : [];

      setLastPreview({
        kind: "crossRow",
        count: affected,
        generatedAt: new Date().toISOString(),
      });
      setLastPreviewExamples(examples);
      setLastPreviewExamplesPagination(
        prev?.examplesPagination || {
          page: nextPage + 1,
          limit: 30,
          total: affected,
          totalPages: Math.max(1, Math.ceil(affected / 30)),
        },
      );
    } catch (err) {
      showAlert(err?.message || "Failed to load preview page.", "error");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    setLastApplyResult(null);
    try {
      showAlert("Applying rules and transformations…", "info");
      const applyGroupName =
        selectedGroupKey === "__all__" ? null : selectedGroupLabel;
      const res = await applyRules(ptrsId, {
        groupName: applyGroupName,
      });
      const persisted = res?.persisted ?? res?.rowsOut ?? 0;
      const actions = res?.stats?.rules?.actions ?? 0;
      const affected = res?.stats?.rules?.rowsAffected ?? 0;
      const generatedAt = new Date().toISOString();

      setLastApplyResult({
        ok: true,
        persisted,
        affected,
        actions,
        generatedAt,
      });

      showAlert(
        `Rules applied — persisted ${persisted} row(s), ${affected} affected, ${actions} action(s).`,
        "success",
      );
    } catch (err) {
      console.error("[RulesPanel] applyRules failed", err);

      const status =
        err?.response?.status ??
        err?.status ??
        err?.statusCode ??
        err?.data?.statusCode ??
        err?.error?.statusCode ??
        null;

      if (status === 413) {
        const backendMessage =
          err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          "Dataset is too large to apply rules in a single pass. Try narrowing your dataset or contact support.";
        setLastApplyResult({
          ok: false,
          message: backendMessage,
          generatedAt: new Date().toISOString(),
        });
        showAlert(backendMessage, "warning");
      } else {
        const message = err?.message || "Failed to apply rules.";
        setLastApplyResult({
          ok: false,
          message,
          generatedAt: new Date().toISOString(),
        });
        showAlert(message, "error");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleGoToSbi = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "sbi" });
    } catch (err) {
      console.error(err);
      showAlert(
        "Failed to update PTRS step. Continuing to SBI Check.",
        "warning",
      );
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`sbi?${qs.toString()}`, { includeId: false });
  };

  const handleSaveRules = async () => {
    try {
      const rowRulesSupported = [];
      const crossRowRules = [];

      for (const r of selectedRules) {
        const stableId = r.id || r.cid || makeCid();
        const base = {
          id: stableId,
          label: r.label || stableId,
          description: r.description || "",
          groupName: r.groupName || "",
          enabled: r.enabled !== false,
          when: r.when,
        };

        const action = r.action || {};
        const looksLikeHelperRule =
          (r.type || "row") === "row" &&
          action?.op === "concat_fields" &&
          Array.isArray(action?.segments) &&
          action.segments.length > 0;

        if (looksLikeHelperRule) {
          rowRulesSupported.push({
            ...base,
            when: [],
            then: [
              {
                op: "concat_fields",
                field: action.field || "",
                segments: Array.isArray(action.segments)
                  ? action.segments.map((seg) =>
                      seg?.kind === "literal"
                        ? {
                            kind: "literal",
                            value: String(seg?.value || ""),
                          }
                        : {
                            kind: "field",
                            name: String(seg?.name || "").trim(),
                          },
                    )
                  : [],
              },
            ],
          });
          continue;
        }

        if (getRuleType(r) === "crossRow") {
          crossRowRules.push({
            ...base,
            type: "crossRow",
            when: Array.isArray(r.when)
              ? r.when.map((cond) => ({
                  ...cond,
                  field: resolveCanonicalField(cond?.field || ""),
                }))
              : [],
            target: {
              match: Array.isArray(r?.target?.match)
                ? r.target.match.map((m) => ({
                    currentField: resolveCanonicalField(m?.currentField || ""),
                    targetField: resolveCanonicalField(m?.targetField || ""),
                  }))
                : [],
              where: Array.isArray(r?.target?.where)
                ? r.target.where.map((cond) => ({
                    ...cond,
                    field: resolveCanonicalField(cond?.field || ""),
                  }))
                : [],
              selection: r?.target?.selection || "first_match",
              requireMatch: r?.target?.requireMatch !== false,
              excludeUnmatchedCurrent:
                r?.target?.excludeUnmatchedCurrent === true,
              unmatchedComment: String(
                r?.target?.unmatchedComment || "",
              ).trim(),
            },
            action: {
              ...(r.action || {}),
              field: resolveCanonicalField(r?.action?.field || ""),
              valueFieldFromCurrent: resolveCanonicalField(
                r?.action?.valueFieldFromCurrent || "",
              ),
            },
            alsoExcludeCurrent: !!r.alsoExcludeCurrent,
          });
        } else {
          const then = [];

          if (action.op === "concat_fields") {
            if (
              action.field &&
              Array.isArray(action.segments) &&
              action.segments.length
            ) {
              then.push({
                op: "concat_fields",
                field: action.field || "",
                segments: Array.isArray(action.segments)
                  ? action.segments.map((seg) =>
                      seg?.kind === "literal"
                        ? {
                            kind: "literal",
                            value: String(seg?.value || ""),
                          }
                        : {
                            kind: "field",
                            name: String(seg?.name || "").trim(),
                          },
                    )
                  : [],
              });
            }
          } else if (action.field || action.valueFieldFromCurrent) {
            then.push({
              op: action.op || "add",
              field: resolveCanonicalField(action.field || ""),
              valueField: resolveCanonicalField(
                action.valueFieldFromCurrent || "",
              ),
              round: typeof action.round === "number" ? action.round : 2,
            });
          }

          rowRulesSupported.push({
            ...base,
            when: Array.isArray(r.when)
              ? r.when.map((cond) => ({
                  ...cond,
                  field: resolveCanonicalField(cond?.field || ""),
                }))
              : [],
            then,
          });
        }
      }

      await savePtrsRules(ptrsId, {
        rowRules: rowRulesSupported,
        crossRowRules,
      });

      const rowCount = rowRulesSupported.length;
      const crossCount = crossRowRules.length;

      if (!rowCount && !crossCount) {
        showAlert("No rules to save.", "info");
        return;
      }

      const msgParts = [];
      if (rowCount) {
        msgParts.push(`Saved ${rowCount} row rule(s).`);
      }
      if (crossCount) {
        msgParts.push(`${crossCount} cross-row rule(s) saved.`);
      }

      const scopePrefix =
        selectedGroupKey === "__all__"
          ? "All groups"
          : `Group: ${selectedGroupLabel}`;

      showAlert(`${scopePrefix}. ${msgParts.join(" ")}`, "success");
    } catch (err) {
      showAlert(err?.message || "Failed to save rules.", "error");
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Apply rules &amp; transformations
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          PTRS: {ptrsId || "—"}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Configure and tune your PTRS rules. Field-level transforms,
          exclusions, and dataset operations will be recorded for audit.
        </Typography>

        <Box
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Helper fields
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Create derived working fields for rules without going back to
                the Join step. Useful for composite keys such as Custom Field 3.
              </Typography>
            </Box>

            <Stack spacing={2}>
              {helperFields.map((cf, idx) => {
                const segments = Array.isArray(cf.segments) ? cf.segments : [];
                const allFieldOptions = helperFieldOptions;

                return (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <TextField
                          label="Field name"
                          size="small"
                          value={cf.key || ""}
                          onChange={(e) =>
                            updateHelperField(idx, {
                              key: e.target.value,
                              type: cf.type || "concat",
                            })
                          }
                          sx={{ flex: 1 }}
                        />
                        <Button
                          size="small"
                          onClick={() => removeHelperField(idx)}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          Remove field
                        </Button>
                      </Stack>

                      <Stack spacing={1}>
                        {segments.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No segments yet. Add a field or literal part below.
                          </Typography>
                        ) : (
                          segments.map((seg, segIdx) => (
                            <Stack
                              key={segIdx}
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ sm: "center" }}
                            >
                              <Select
                                size="small"
                                value={
                                  seg.kind === "literal" ? "literal" : "field"
                                }
                                onChange={(e) => {
                                  const kind = e.target.value;
                                  if (kind === "field") {
                                    updateHelperSegment(idx, segIdx, {
                                      kind: "field",
                                      name:
                                        seg.name || allFieldOptions[0] || "",
                                      value: undefined,
                                    });
                                  } else {
                                    updateHelperSegment(idx, segIdx, {
                                      kind: "literal",
                                      value: seg.value || "",
                                      name: undefined,
                                    });
                                  }
                                }}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="field">Field</MenuItem>
                                <MenuItem value="literal">Literal</MenuItem>
                              </Select>

                              {seg.kind === "literal" ? (
                                <TextField
                                  size="small"
                                  label="Literal"
                                  value={seg.value || ""}
                                  onChange={(e) =>
                                    updateHelperSegment(idx, segIdx, {
                                      value: e.target.value,
                                    })
                                  }
                                  sx={{ flex: 1 }}
                                />
                              ) : (
                                <Select
                                  size="small"
                                  value={
                                    typeof seg.name === "string" &&
                                    allFieldOptions.some(
                                      (opt) => opt.value === seg.name,
                                    )
                                      ? seg.name
                                      : ""
                                  }
                                  onChange={(e) =>
                                    updateHelperSegment(idx, segIdx, {
                                      name: e.target.value,
                                    })
                                  }
                                  sx={{ flex: 1 }}
                                >
                                  {allFieldOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              )}

                              <Button
                                size="small"
                                onClick={() => removeHelperSegment(idx, segIdx)}
                              >
                                Remove
                              </Button>
                            </Stack>
                          ))
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => addHelperSegment(idx, "field")}
                          disabled={!helperFieldOptions.length}
                        >
                          Add field segment
                        </Button>
                        <Button
                          size="small"
                          onClick={() => addHelperSegment(idx, "literal")}
                        >
                          Add literal
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}

              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={addHelperField}>
                  Add helper field
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddHelperFieldRules}
                >
                  Convert helper fields into rules
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Sandbox
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Filter a small slice of staged data safely. No rules are applied
              and no data is changed.
            </Typography>
          </Box>
        </Stack>
        <RulesSandbox
          ptrsId={ptrsId}
          headers={ruleBuilderHeaders}
          onSeedRule={seedRuleFromFilter}
        />

        <Box>
          {rules.some(isBroadCrossRowRule) && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.warning.main}`,
                backgroundColor: theme.palette.warning.light,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                ⚠ Target scope may be too broad
              </Typography>
              <Typography variant="body2">
                One or more cross-row rules rely only on exclusions and may
                affect more rows than intended. Consider adding a match key or a
                positive target condition.
              </Typography>
            </Box>
          )}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            sx={{ mb: 1 }}
          >
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Preview
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Simulates the effect of your rules. Nothing is written until you
                apply.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              justifyContent={{ sm: "flex-end" }}
              sx={{ flexWrap: "wrap" }}
            >
              <TextField
                select
                size="small"
                label="Selected group"
                value={selectedGroupKey}
                onChange={(e) => setSelectedGroupKey(e.target.value)}
                sx={{ minWidth: 240 }}
              >
                <MenuItem value="__all__">All groups</MenuItem>
                {groupedRules.map((group) => (
                  <MenuItem key={group.key} value={group.key}>
                    {group.label}
                  </MenuItem>
                ))}
              </TextField>
              <RuleToolbar
                onImport={openImportDialog}
                onAddRule={handleAddRule}
                onSave={handleSaveRules}
                onPreview={handlePreview}
                onApply={handleApply}
                isPreviewing={isPreviewing}
                isApplying={isApplying}
                canApply={canApply}
              />

              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                disabled={!ptrsId || isBusy}
                onClick={handleGoToSbi}
              >
                Next: SBI Check
              </Button>
            </Stack>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: "block",
              mb: 1,
            }}
          >
            {`Selected scope: ${selectedGroupLabel}. Save, Preview, and Apply use this selection against the currently saved rules for the PTRS run.`}
          </Typography>

          {isApplying && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <LoadingSpinner size={20} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Applying rules…
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    This can take a while on large datasets. Please don’t
                    refresh or navigate away.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {lastPreview && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ md: "center" }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Preview results
                  </Typography>

                  {lastPreview.kind === "crossRow" ? (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {lastPreview.count} target row(s) would be adjusted.
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {lastPreview.affected} row(s) affected,{" "}
                      {lastPreview.actions} action(s).
                    </Typography>
                  )}
                  {lastPreview?.kind === "row" &&
                    lastPreviewRows.length > 0 && (
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                          mt: 2,
                          maxHeight: 420,
                          borderColor: theme.palette.divider,
                        }}
                      >
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              {rowPreviewColumns.map((column) => (
                                <TableCell
                                  key={column.key}
                                  sx={{
                                    whiteSpace: "nowrap",
                                    fontWeight: 600,
                                  }}
                                >
                                  {column.label}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {lastPreviewRows.map((row, index) => (
                              <TableRow
                                key={
                                  getPreviewField(row, "row_no", "rowNo") ||
                                  `preview-row-${index}`
                                }
                                hover
                              >
                                {rowPreviewColumns.map((column) => {
                                  const value =
                                    column.key === "row_no"
                                      ? getPreviewField(row, "row_no", "rowNo")
                                      : getPreviewField(
                                          row,
                                          column.key,
                                          column.sourceKey,
                                          toSnake(column.sourceKey || ""),
                                        );

                                  return (
                                    <TableCell
                                      key={column.key}
                                      sx={{
                                        whiteSpace: "nowrap",
                                        fontFamily:
                                          column.key === "row_no"
                                            ? "inherit"
                                            : "monospace",
                                      }}
                                    >
                                      {formatPreviewText(value)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={isBusy}
                  onClick={() => {
                    setLastPreview(null);
                    setLastPreviewExamples([]);
                    setLastPreviewExamplesPagination({
                      page: 1,
                      limit: 30,
                      total: 0,
                      totalPages: 1,
                    });
                    setPreviewPage(0);
                  }}
                >
                  Clear
                </Button>
              </Stack>

              {Array.isArray(lastPreviewExamples) &&
              lastPreviewExamples.length ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary, mb: 1 }}
                  >
                    Preview rows ({lastPreviewExamplesPagination.total} total)
                  </Typography>

                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Reference</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell>Document type</TableCell>
                          <TableCell align="right">Base before</TableCell>
                          <TableCell align="right">Delta</TableCell>
                          <TableCell align="right">Would be</TableCell>
                          <TableCell>Exclude reason</TableCell>
                          <TableCell>Exclude comment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lastPreviewExamples.map((ex, idx) => {
                          const ref = getPreviewField(
                            ex,
                            "ref",
                            "invoice_reference_number",
                          );
                          const supplier = getPreviewField(
                            ex,
                            "supplier_name",
                            "payee_entity_name",
                            "Account  Name",
                            "account_name",
                          );
                          const documentType = getPreviewField(
                            ex,
                            "document_type",
                            "documentType",
                          );
                          const baseBefore = getPreviewField(
                            ex,
                            "base_before",
                            "baseBefore",
                          );
                          const expectedDelta = getPreviewField(
                            ex,
                            "expected_delta",
                            "expectedDelta",
                          );
                          const wouldBe = getPreviewField(
                            ex,
                            "would_be",
                            "wouldBe",
                          );
                          const excludeReason = getPreviewField(
                            ex,
                            "exclude_reason",
                            "excludeReason",
                          );
                          const excludeComment = getPreviewField(
                            ex,
                            "exclude_comment",
                            "excludeComment",
                          );

                          return (
                            <TableRow key={`${ref || "row"}-${idx}`}>
                              <TableCell>{formatPreviewText(ref)}</TableCell>
                              <TableCell>
                                {formatPreviewText(supplier)}
                              </TableCell>
                              <TableCell>
                                {formatPreviewText(documentType, "Invoice")}
                              </TableCell>
                              <TableCell align="right">
                                {formatPreviewMoney(baseBefore)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPreviewDelta(expectedDelta)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPreviewMoney(wouldBe)}
                              </TableCell>
                              <TableCell>
                                {formatPreviewText(excludeReason)}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 420 }}>
                                {formatPreviewText(excludeComment)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={Number(lastPreviewExamplesPagination.total || 0)}
                    page={Math.max(
                      0,
                      Number(lastPreviewExamplesPagination.page || 1) - 1,
                    )}
                    onPageChange={handlePreviewPageChange}
                    rowsPerPage={30}
                    rowsPerPageOptions={[30]}
                  />
                </>
              ) : null}
            </Box>
          )}

          {lastApplyResult && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ md: "center" }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Last apply result
                  </Typography>

                  {lastApplyResult.ok ? (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {`${lastApplyResult.persisted} row(s) persisted, ${lastApplyResult.affected} affected, ${lastApplyResult.actions} action(s).`}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.error.main }}
                    >
                      {lastApplyResult.message || "Apply failed."}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    {`Recorded ${new Date(lastApplyResult.generatedAt).toLocaleString("en-AU")}`}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={isBusy}
                  onClick={() => setLastApplyResult(null)}
                >
                  Clear
                </Button>
              </Stack>
            </Box>
          )}

          {ruleBuilderHeaders.length > 0 &&
            groupedRules.map((group) => {
              const isOpen = !!showRuleGroups[group.key];
              return (
                <Box key={group.key} sx={{ mt: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {`${group.label} (${group.rules.length})`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setShowRuleGroups((prev) => ({
                          ...prev,
                          [group.key]: !prev[group.key],
                        }))
                      }
                      aria-label={
                        isOpen
                          ? `Collapse ${group.label}`
                          : `Expand ${group.label}`
                      }
                    >
                      {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <RuleList
                      rules={group.rules}
                      headers={ruleBuilderHeaders}
                      onUpdate={handleUpdateRule}
                      onRemove={removeRule}
                    />
                  </Collapse>
                </Box>
              );
            })}
        </Box>

        {!canApply && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.warning.main }}
          >
            You’ll need staged data before applying rules.
          </Typography>
        )}

        <RuleExecutionTimeline history={history} />
      </Stack>

      <RuleImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        ruleSources={ruleSources}
        selected={selectedRuleSource}
        onSelect={setSelectedRuleSource}
        onCopy={() => {
          if (!selectedRuleSource) {
            showAlert("Pick a PTRS run to copy rules from", "info");
            return;
          }

          const otherPtrsId = selectedRuleSource.ptrsId;

          if (!otherPtrsId) {
            showAlert(
              "Selected rule source is missing a PTRS run id.",
              "error",
            );
            return;
          }

          copyRulesFromPtrsId(otherPtrsId);
        }}
      />
    </Box>
  );
}
