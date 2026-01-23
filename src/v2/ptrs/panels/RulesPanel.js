import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { Box, Stack, Typography, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import {
  previewRules,
  applyRules,
  savePtrsRules,
  getPtrsRules,
} from "../services/rules.ptrsApi";
import { useState, useMemo, useEffect } from "react";
import {
  RuleToolbar,
  RuleList,
  RuleImportDialog,
  RuleExecutionTimeline,
} from "../rules/components";
import RulesSandbox from "./RulesSandbox";
import {
  useRulesState,
  useRuleHeaders,
  useRuleSources,
  useRuleExecutionHistory,
} from "../rules/hooks";
import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";

import { useNavigate } from "react-router";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRef } from "react";
import { LoadingSpinner } from "components/ui/LoadingSpinner";

// helpers
const toSnake = (s) =>
  !s
    ? s
    : String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s\-]+/g, "_")
        .toLowerCase();

const makeCid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rule_${Date.now()}_${Math.random().toString(16).slice(2)}`;

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
          ? r.then.find((a) => a.op === "add")
          : null;
        const action = addAct
          ? {
              op: addAct.op || "add",
              field: addAct.field || "",
              valueFieldFromCurrent: addAct.valueField || "",
              round: typeof addAct.round === "number" ? addAct.round : 2,
            }
          : { op: "add", field: "", valueFieldFromCurrent: "", round: 2 };

        return {
          id: r.id || `r${i + 1}`,
          type: r.type || "row",
          label: r.label || "",
          description: r.description || "",
          enabled: r.enabled !== false,
          when: Array.isArray(r.when) ? r.when : [],
          target: r.target || {},
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
        enabled: r.enabled !== false,
        when: Array.isArray(r.when) ? r.when : [],
        target: r.target || {},
        action: r.action || {},
        alsoExcludeCurrent: !!r.alsoExcludeCurrent,
      }))
    : [];

  return [...rows, ...crosses];
};

export default function RulesPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const {
    ptrsId: ctxPtrsId,
    profileId: ctxProfileId,
    ptrsMap: ctxPtrsMap,
  } = usePtrsV2Context();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  const navigate = useNavigate();

  const hasCtxMap = !!(
    ctxPtrsMap &&
    ctxPtrsMap.mappings &&
    Object.keys(ctxPtrsMap.mappings || {}).length
  );

  const effectiveMap = ctxPtrsMap || null;

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const isBusy = isPreviewing || isApplying;
  const [importOpen, setImportOpen] = useState(false);
  const [selectedRuleSource, setSelectedRuleSource] = useState(null);

  const { headers } = useRuleHeaders(ptrsId, effectiveMap);
  const { sources: ruleSources } = useRuleSources(ptrsId, profileId);
  const { history } = useRuleExecutionHistory(ptrsId);

  const { rules, resetRules, addRule, updateRule, removeRule } = useRulesState(
    [],
  );

  const [lastPreview, setLastPreview] = useState(null);
  const [lastPreviewExamples, setLastPreviewExamples] = useState([]);

  const rulesLoadedRef = useRef(false);

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  // Helper to create a row rule from a single condition
  const createRowRuleFromCondition = (condition) => ({
    cid: makeCid(),
    id: makeCid(),
    label: "",
    description: "",
    enabled: true,
    type: "row",
    when: [condition],
    target: { match: [], where: [] },
    action: { op: "add", field: "", valueFieldFromCurrent: "", round: 2 },
  });

  // Helper to create a cross-row rule template from a condition
  const createCrossRowRuleTemplate = (condition) => ({
    cid: makeCid(),
    id: makeCid(),
    label: "",
    description: "",
    enabled: true,
    type: "crossRow",
    when: [condition],
    target: { match: [{ currentField: "", targetField: "" }], where: [] },
    action: {
      op: "add",
      field: "invoice_amount",
      valueFieldFromCurrent: "invoice_amount",
      round: 2,
    },
    alsoExcludeCurrent: true,
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

  const canApply = useMemo(() => {
    return Boolean(
      effectiveMap?.mappings && Object.keys(effectiveMap.mappings).length > 0,
    );
  }, [effectiveMap]);

  // Lightweight debug log: only fires when ptrsId/profileId/map keys change
  const debugKeyRef = useRef("");
  useEffect(() => {
    const mapKeys = ctxPtrsMap?.mappings
      ? Object.keys(ctxPtrsMap.mappings).length
      : 0;
    const key = `${ptrsId}|${profileId || ""}|${mapKeys}`;
    if (debugKeyRef.current === key) return;
    debugKeyRef.current = key;
    // eslint-disable-next-line no-console
    console.log("[RulesPanel] state", {
      ptrsId,
      profileId,
      hasCtxMap,
      canApply,
      ctxMapKeys: mapKeys,
      headersCount: Array.isArray(headers) ? headers.length : 0,
      ruleSourcesCount: Array.isArray(ruleSources) ? ruleSources.length : 0,
      rulesCount: Array.isArray(rules) ? rules.length : 0,
    });
  }, [
    ptrsId,
    profileId,
    ctxPtrsMap,
    hasCtxMap,
    canApply,
    headers,
    ruleSources,
    rules,
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
    if (!Array.isArray(ctxPtrsMap?.rowRules) || !ctxPtrsMap.rowRules.length)
      return;
    if (rules.length > 0) return;

    const seeded = normalisePtrsRules(ctxPtrsMap.rowRules || [], []);
    if (seeded.length) {
      resetRules(seeded);
    }
  }, [ptrsId, ctxPtrsMap, rules.length, resetRules]);

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
    setIsPreviewing(true);
    setLastPreview(null);
    setLastPreviewExamples([]);

    try {
      showAlert("Generating rules preview…", "info");
      const cross = rules.find((r) => (r.type || "row") === "crossRow");
      if (cross) {
        // Backend preview performs SELECTs over the full dataset and returns counts + examples.
        const prev = await previewRules(ptrsId, { mode: "full" });
        const affected = prev?.summary?.rowsAffected ?? 0;
        const examples = Array.isArray(prev?.examples) ? prev.examples : [];

        setLastPreview({
          kind: "crossRow",
          count: affected,
          generatedAt: new Date().toISOString(),
        });
        setLastPreviewExamples(examples);

        showAlert(
          `Preview ready — ${affected} target row(s) would be adjusted.`,
          "success",
        );
        return;
      }

      const prev = await previewRules(ptrsId, { limit: 20 });
      const actions = prev?.summary?.actions ?? 0;
      const affected = prev?.summary?.rowsAffected ?? 0;

      setLastPreview({
        kind: "row",
        affected,
        actions,
        generatedAt: new Date().toISOString(),
      });

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

  const handleApply = async () => {
    setIsApplying(true);
    try {
      showAlert("Applying rules and transformations…", "info");
      const res = await applyRules(ptrsId, {});
      const persisted = res?.persisted ?? res?.rowsOut ?? 0;
      const actions = res?.stats?.rules?.actions ?? 0;
      const affected = res?.stats?.rules?.rowsAffected ?? 0;
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
        showAlert(backendMessage, "warning");
      } else {
        showAlert(err?.message || "Failed to apply rules.", "error");
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
    navigate(`/v2/ptrs/sbi?${qs.toString()}`);
  };

  const handleSaveRules = async () => {
    try {
      const rowRulesSupported = [];
      const crossRowRules = [];

      for (const r of rules) {
        const stableId = r.id || r.cid || makeCid();
        const base = {
          id: stableId,
          label: r.label || stableId,
          description: r.description || "",
          enabled: r.enabled !== false,
          when: r.when,
        };

        if ((r.type || "row") === "crossRow") {
          crossRowRules.push({
            ...base,
            type: "crossRow",
            target: r.target || null,
            action: r.action || null,
            alsoExcludeCurrent: !!r.alsoExcludeCurrent,
          });
        } else {
          const action = r.action || {};
          const then = [];

          if (action.field || action.valueFieldFromCurrent) {
            then.push({
              op: action.op || "add",
              field: action.field || "",
              valueField: action.valueFieldFromCurrent || "",
              round: typeof action.round === "number" ? action.round : 2,
            });
          }

          rowRulesSupported.push({
            ...base,
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

      showAlert(msgParts.join(" "), "success");
    } catch (err) {
      showAlert(err?.message || "Failed to save rules.", "error");
    }
  };

  const sqlEscape = (v) => String(v ?? "").replace(/'/g, "''");

  const buildSqlCondition = (field, op, value) => {
    const col = toSnake(field || "");
    const val = sqlEscape(value);

    switch (op) {
      case "eq":
        return `${col} = '${val}'`;
      case "neq":
        return `${col} <> '${val}'`;
      case "gt":
        return `${col} > '${val}'`;
      case "gte":
        return `${col} >= '${val}'`;
      case "lt":
        return `${col} < '${val}'`;
      case "lte":
        return `${col} <= '${val}'`;
      case "in":
        return `${col} IN (${String(value)
          .split(",")
          .map((v) => `'${sqlEscape(v.trim())}'`)
          .join(", ")})`;
      case "nin":
        return `${col} NOT IN (${String(value)
          .split(",")
          .map((v) => `'${sqlEscape(v.trim())}'`)
          .join(", ")})`;
      case "is_null":
        return `${col} IS NULL`;
      case "not_null":
        return `${col} IS NOT NULL`;
      default:
        return "-- unsupported op in preview";
    }
  };

  const buildCrossRowSql = (rule) => {
    const table = "ptrs_stage_row";

    const cur = rule.when?.[0] || {};
    const match = rule.target?.match?.[0] || {};
    const where = rule.target?.where?.[0] || null;
    const action = rule.action || {};

    const curField = toSnake(cur.field || "");
    const curCond =
      curField && cur.op
        ? buildSqlCondition(cur.field, cur.op, cur.value)
        : "-- no current-row condition";

    const targetField = toSnake(match.targetField || "");
    const currentField = toSnake(match.currentField || "");

    const whereCond =
      where && where.field && where.op
        ? buildSqlCondition(where.field, where.op, where.value)
        : null;

    const actionTarget = toSnake(action.field || "");
    const actionSource = toSnake(action.valueFieldFromCurrent || "");
    const actionOp = action.op || "sub";

    let sql = "";

    sql += '-- Current rows ("current" side of the cross-row rule)\n';
    sql += `SELECT *\nFROM ${table} c\n`;
    if (!curCond.startsWith("--")) {
      sql += `WHERE ${curCond};\n\n`;
    } else {
      sql += `-- WHERE ${curCond}\n\n`;
    }

    sql += "-- Target rows matched to each current row\n";
    sql += `SELECT t.*\n`;
    sql += `FROM ${table} t\n`;
    sql += `JOIN ${table} c\n`;
    if (targetField && currentField) {
      sql += `  ON t.${targetField} = c.${currentField}\n`;
    } else {
      sql +=
        "  -- ON t.<targetField> = c.<currentField>  -- missing match fields\n";
    }

    const whereParts = [];
    if (!curCond.startsWith("--")) {
      whereParts.push(curCond.replace(/(^|\n)/g, ""));
    }
    if (whereCond) {
      whereParts.push(whereCond);
    }

    if (whereParts.length) {
      sql += `WHERE ${whereParts.join(" AND ")};\n\n`;
    } else {
      sql += `-- WHERE <optional filters>\n\n`;
    }

    if (actionTarget && actionSource) {
      sql += "-- Action preview (conceptual, not executable SQL)\n";
      sql += "-- For each (t, c) pair, apply:\n";
      sql += `--   t.${actionTarget} = `;
      switch (actionOp) {
        case "add":
          sql += `t.${actionTarget} + c.${actionSource};\n`;
          break;
        case "sub":
          sql += `t.${actionTarget} - c.${actionSource};\n`;
          break;
        case "mul":
          sql += `t.${actionTarget} * c.${actionSource};\n`;
          break;
        case "div":
          sql += `t.${actionTarget} / NULLIF(c.${actionSource}, 0);\n`;
          break;
        case "assign":
          sql += `c.${actionSource};\n`;
          break;
        default:
          sql += `/* unsupported op: ${actionOp} */;\n`;
          break;
      }
    }

    return sql;
  };

  const mockPreviewCrossRow = async (rule, ptrsIdArg) => {
    try {
      const sql = buildCrossRowSql(rule);
      console.log("[PTRS v2] Cross-row pseudo SQL:\n" + sql);
    } catch (e) {
      console.warn("[PTRS v2] Failed to build cross-row pseudo SQL", e);
    }
    const prev = await previewRules(ptrsIdArg, { limit: 5000 });
    const rows = prev?.rows || [];
    const curWhen = rule.when?.[0] || {};
    const isCur = (r) => {
      const a = r[curWhen.field];
      switch (curWhen.op) {
        case "eq":
          return String(a) === String(curWhen.value);
        case "neq":
          return String(a) !== String(curWhen.value);
        default:
          return false;
      }
    };
    const currents = rows.filter(isCur);

    const match = rule.target?.match?.[0] || {};
    const targetKey = (r) => String(r[match.targetField] ?? "").trim();
    const curKey = (r) => String(r[match.currentField] ?? "").trim();

    const where = rule.target?.where?.[0] || null;
    const targetOk = (r) => {
      if (!where) return true;
      const val = r[where.field];
      switch (where.op) {
        case "eq":
          return String(val) === String(where.value);
        case "neq":
          return String(val) !== String(where.value);
        case "is_null":
          return val == null || val === "";
        case "not_null":
          return !(val == null || val === "");
        default:
          return true;
      }
    };

    const byKey = new Map();
    for (const r of rows) {
      const k = targetKey(r);
      if (!k) continue;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(r);
    }

    const a = rule.action || {};
    const toNum = (v) => {
      const n = Number(String(v).replace(/[, ]+/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const round = (n, dp = 2) => {
      const f = Math.pow(10, dp);
      return Math.round(n * f) / f;
    };

    const impacts = [];
    for (const cur of currents) {
      const k = curKey(cur);
      const targets = (byKey.get(k) || []).filter(targetOk);
      for (const t of targets) {
        const curVal = toNum(cur[a.valueFieldFromCurrent]);
        const base = toNum(t[a.field]);
        let next = base;
        if (a.op === "sub") next = base - curVal;
        if (a.op === "add") next = base + curVal;
        if (a.op === "mul") next = base * curVal;
        if (a.op === "div") next = curVal === 0 ? base : base / curVal;
        if (a.op === "assign") next = curVal;
        const final = a.round != null ? round(next, a.round) : next;
        impacts.push({
          ref: k,
          target_rowNo: t.rowNo ?? null,
          target_doc_type: t.document_type,
          field: a.field,
          before: t[a.field],
          change: `${a.op} ${cur[a.valueFieldFromCurrent]}`,
          after: final,
          exclude_current: !!rule.alsoExcludeCurrent,
        });
      }
    }
    return {
      count: impacts.length,
      examples: impacts.slice(0, 20),
      all: impacts,
    };
  };

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1200,
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
          Ptrs: {ptrsId || "—"}
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

        <Typography
          variant="subtitle2"
          sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
        >
          Sandbox — what data?
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mb: 1 }}
        >
          Use the sandbox to explore and filter staged data safely. No rules are
          applied and no data is changed.
        </Typography>
        <RulesSandbox
          ptrsId={ptrsId}
          headers={headers}
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
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
            >
              Preview — what impact?
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mb: 1 }}
            >
              Preview simulates the effect of your rules and shows how many rows
              would be affected. No data is written until you apply.
            </Typography>
            <RuleToolbar
              onImport={openImportDialog}
              onAddRule={addRule}
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
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={isBusy}
                  onClick={() => {
                    setLastPreview(null);
                    setLastPreviewExamples([]);
                  }}
                >
                  Clear
                </Button>
              </Stack>

              {lastPreview.kind === "crossRow" &&
                lastPreviewExamples.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 1,
                      }}
                    >
                      Examples (first {Math.min(lastPreviewExamples.length, 5)}
                      ):
                    </Typography>

                    <Stack spacing={0.75}>
                      {lastPreviewExamples.slice(0, 5).map((ex, idx) => (
                        <Box
                          key={`${ex.ref || "ref"}-${ex.target_rowNo || idx}-${idx}`}
                          sx={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            opacity: 0.9,
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {`ref=${ex.ref} rowNo=${ex.target_rowNo} doc=${ex.target_doc_type} ${ex.field}: ${ex.before} → ${ex.after}`}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
            </Box>
          )}

          {effectiveMap && headers.length > 0 && (
            <RuleList
              rules={rules}
              headers={headers}
              onUpdate={updateRule}
              onRemove={removeRule}
            />
          )}
        </Box>

        {!canApply && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.warning.main }}
          >
            You’ll need a saved column map (and staged data) before applying
            rules.
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
