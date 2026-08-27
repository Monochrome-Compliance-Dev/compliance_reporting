import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { useUpdatePtrsMutation } from "../hooks/usePtrsQueries";
import { getPtrsJoins, savePtrsJoins } from "../services/joins.ptrsApi";
import {
  usePtrsDatasetsQuery,
  usePtrsJoinsQuery,
  useCompatibleJoinsQuery,
} from "../hooks/usePtrsQueries";
import JoinsDesigner from "../components/JoinsDesigner";

const normaliseRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normaliseFileName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.csv$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/\b\d{6,8}\b/g, " ")
    .replace(/\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b/g, " ")
    .replace(/\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fileNameTokens = (value) =>
  new Set(
    normaliseFileName(value)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean),
  );

const countSharedTokens = (left, right) => {
  const leftTokens = fileNameTokens(left);
  const rightTokens = fileNameTokens(right);

  let count = 0;

  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) count += 1;
  });

  return count;
};

const countSharedHeaders = (leftHeaders, rightHeaders) => {
  const right = new Set(
    (Array.isArray(rightHeaders) ? rightHeaders : []).map((header) =>
      String(header || "")
        .trim()
        .toLowerCase(),
    ),
  );

  return (Array.isArray(leftHeaders) ? leftHeaders : []).reduce(
    (count, header) => {
      const normalised = String(header || "")
        .trim()
        .toLowerCase();

      return normalised && right.has(normalised) ? count + 1 : count;
    },
    0,
  );
};

const getDatasetHeaders = (dataset) => {
  const headers = dataset?.meta?.headers || dataset?.headers || [];
  return Array.isArray(headers) ? headers.filter(Boolean).map(String) : [];
};

const buildImportedDatasetMap = ({ sourceDatasets, targetDatasets }) => {
  const mapping = new Map();
  const unresolved = [];

  for (const sourceDataset of sourceDatasets) {
    const sourceId = String(sourceDataset?.id || "").trim();
    const sourceRole = normaliseRole(sourceDataset?.role);

    if (!sourceId || !sourceRole) {
      unresolved.push({
        sourceDataset,
        reason: "The historical dataset has no ID or role.",
      });
      continue;
    }

    const candidates = targetDatasets.filter(
      (targetDataset) => normaliseRole(targetDataset?.role) === sourceRole,
    );

    if (candidates.length === 0) {
      unresolved.push({
        sourceDataset,
        reason: `No current dataset has role ${sourceRole}.`,
      });
      continue;
    }

    if (candidates.length === 1) {
      mapping.set(sourceId, String(candidates[0].id));
      continue;
    }

    const ranked = candidates
      .map((candidate) => {
        const filenameScore = countSharedTokens(
          sourceDataset?.fileName,
          candidate?.sourceName || candidate?.fileName,
        );

        const headerScore = countSharedHeaders(
          sourceDataset?.headers,
          getDatasetHeaders(candidate),
        );

        return {
          candidate,
          score: filenameScore * 1000 + headerScore,
          filenameScore,
          headerScore,
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const second = ranked[1];

    if (!best || best.score === 0 || (second && second.score === best.score)) {
      unresolved.push({
        sourceDataset,
        reason: `Multiple current datasets have role ${sourceRole}, but no unique match could be determined.`,
      });
      continue;
    }

    mapping.set(sourceId, String(best.candidate.id));
  }

  return { mapping, unresolved };
};

export default function TablesAndJoinsPanel() {
  const [params] = useSearchParams();
  const debugJoins =
    params.get("debug") === "1" || params.get("debug") === "joins";
  const { goTo } = usePtrsNavigation();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsContext();

  const ptrsId = params.get("ptrsId");
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [datasets, setDatasets] = useState([]);
  const [joins, setJoins] = useState({ conditions: [], customFields: [] });
  const [transactionHeaders, setTransactionHeaders] = useState([]);
  const [transactionHeadersByDataset, setTransactionHeadersByDataset] =
    useState({});
  const [loading, setLoading] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingTemplateId, setImportingTemplateId] = useState(null);

  // ---- Autosave (joins + computed fields) ----
  const saveTimerRef = useRef(null);
  const lastSavedHashRef = useRef(null);
  const dirtyRef = useRef(false);
  const autosaveNoticeShownRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const savePromiseRef = useRef(null);

  const computeJoinsHash = (j) => {
    const safe = {
      conditions: Array.isArray(j?.conditions) ? j.conditions : [],
      customFields: Array.isArray(j?.customFields) ? j.customFields : [],
    };
    return JSON.stringify(safe);
  };

  const performSave = async (nextJoins, opts = {}) => {
    if (!ptrsId) return;
    if (isSavingRef.current) return;

    const { silent = true } = opts;

    const targetJoins = nextJoins || joins;
    const nextHash = computeJoinsHash(targetJoins);
    if (lastSavedHashRef.current === nextHash) {
      dirtyRef.current = false;
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    let resolveSave;
    savePromiseRef.current = new Promise((resolve) => {
      resolveSave = resolve;
    });

    try {
      // Load existing mappings so we don't overwrite them when saving joins

      const conditions = Array.isArray(targetJoins?.conditions)
        ? targetJoins.conditions
        : [];
      const customFields = Array.isArray(targetJoins?.customFields)
        ? targetJoins.customFields
        : [];

      const payload = {
        joins: { conditions },
        customFields,
        profileId,
      };

      await savePtrsJoins(ptrsId, payload);

      lastSavedHashRef.current = nextHash;
      dirtyRef.current = false;

      if (!silent) {
        showAlert("Saved joins", "success");
      }
    } catch (e) {
      // Autosave should never be silent on failure.
      showAlert(e?.message || "Failed to save joins", "error");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      if (savePromiseRef.current) {
        // Resolve anyone awaiting the in-flight save
        savePromiseRef.current = null;
        resolveSave?.();
      }
    }
  };

  const scheduleAutosave = (nextJoins) => {
    if (!ptrsId) return;

    // One-time info notice so the user understands what’s happening.
    if (!autosaveNoticeShownRef.current) {
      autosaveNoticeShownRef.current = true;
      showAlert("Joins and computed fields are autosaved.", "info");
    }

    dirtyRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      performSave(nextJoins, { silent: true });
    }, 800);
  };

  const dsQ = usePtrsDatasetsQuery(ptrsId);
  const joinsQ = usePtrsJoinsQuery(ptrsId);

  const compatibleJoinsQ = useCompatibleJoinsQuery(ptrsId);

  useEffect(() => {
    setLoading(Boolean(dsQ.isLoading || joinsQ.isLoading));
  }, [dsQ.isLoading, joinsQ.isLoading]);

  useEffect(() => {
    if (dsQ.isError)
      showAlert(dsQ.error?.message || "Failed to load datasets", "error");
  }, [dsQ.isError, dsQ.error, showAlert]);

  useEffect(() => {
    if (joinsQ.isError)
      showAlert(joinsQ.error?.message || "Failed to load joins", "error");
  }, [joinsQ.isError, joinsQ.error, showAlert]);

  useEffect(() => {
    setDatasets(dsQ.data?.items || []);
  }, [dsQ.data]);

  // normalise joins (same logic you already have)
  const normaliseJoins = (raw) => {
    if (!raw || typeof raw !== "object")
      return { conditions: [], customFields: [] };

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
      if (Array.isArray(joinsSource.conditions))
        conditions = joinsSource.conditions;
      if (Array.isArray(joinsSource.customFields))
        customFields = joinsSource.customFields;
    }

    const topLevelCustomFields =
      raw.customFields || raw.map?.customFields || null;
    if (Array.isArray(topLevelCustomFields))
      customFields = topLevelCustomFields;

    return { conditions, customFields };
  };

  useEffect(() => {
    const mapRes = joinsQ.data || null;
    const { conditions, customFields } = normaliseJoins(mapRes || {});
    setJoins({ conditions, customFields });

    const initialHash = computeJoinsHash({ conditions, customFields });
    lastSavedHashRef.current = initialHash;
    dirtyRef.current = false;
  }, [joinsQ.data]);

  useEffect(() => {
    const items = Array.isArray(dsQ.data?.items) ? dsQ.data.items : [];

    const byDatasetId = {};

    items.forEach((dataset) => {
      if (dataset?.purpose !== "transaction" || !dataset?.id) return;

      const roleHeaders = (dataset?.meta?.headers || dataset?.headers || [])
        .filter(Boolean)
        .map(String);

      if (!roleHeaders.length) return;

      byDatasetId[dataset.id] = Array.from(new Set(roleHeaders)).sort((a, b) =>
        a.localeCompare(b),
      );
    });

    const transactionHeaders = Array.from(
      new Set(Object.values(byDatasetId).flatMap((headers) => headers || [])),
    ).sort((a, b) => a.localeCompare(b));

    setTransactionHeadersByDataset(byDatasetId);
    setTransactionHeaders(transactionHeaders);

    if (debugJoins) {
      // eslint-disable-next-line no-console
      console.log("[TablesAndJoinsPanel] dataset metadata headers", {
        datasets: items,
        transactionHeaders,
        transactionHeadersByDatasetId: byDatasetId,
      });
    }
  }, [dsQ.data, debugJoins]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  const datasetSummary = useMemo(() => {
    return (datasets || []).map((d) => ({
      id: d.id,
      role: d.role,
      purpose: d.purpose,
      referenceKind: d.referenceKind || null,
      name: d.sourceName || d.fileName,
      rows: d.meta?.rowsCount ?? d.rowCount ?? 0,
    }));
  }, [datasets]);

  const joinsCount = Array.isArray(joins?.conditions)
    ? joins.conditions.length
    : 0;

  const datasetIds = useMemo(() => {
    return (datasets || [])
      .map((dataset) => String(dataset?.id || "").trim())
      .filter(Boolean);
  }, [datasets]);

  const transactionDatasetIds = useMemo(
    () =>
      (datasets || [])
        .filter((dataset) => dataset?.purpose === "transaction")
        .map((dataset) => String(dataset.id)),
    [datasets],
  );
  const hasReferenceDatasets = (datasets || []).some(
    (dataset) => dataset?.purpose === "reference",
  );
  const mustHaveJoin = hasReferenceDatasets;
  const hasMultipleTransactionDatasets = transactionDatasetIds.length > 1;

  const joinCoverage = useMemo(() => {
    const conditions = Array.isArray(joins?.conditions) ? joins.conditions : [];
    const idSet = new Set(datasetIds);

    if (!datasetIds.length) {
      return {
        connected: true,
        connectedDatasetIds: [],
        orphanedDatasetIds: [],
      };
    }

    const graph = new Map();
    datasetIds.forEach((datasetId) => graph.set(datasetId, new Set()));

    for (const j of conditions) {
      const fromDatasetId = String(j?.from?.datasetId || "").trim();
      const toDatasetId = String(j?.to?.datasetId || "").trim();
      if (!fromDatasetId || !toDatasetId) continue;
      if (!idSet.has(fromDatasetId) || !idSet.has(toDatasetId)) continue;

      graph.get(fromDatasetId)?.add(toDatasetId);
      graph.get(toDatasetId)?.add(fromDatasetId);
    }

    const roots = transactionDatasetIds.length
      ? transactionDatasetIds
      : datasetIds.slice(0, 1);

    const visited = new Set();
    const queue = [...roots];

    while (queue.length) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      const neighbours = Array.from(graph.get(current) || []);
      neighbours.forEach((n) => {
        if (!visited.has(n)) queue.push(n);
      });
    }

    const orphanedDatasetIds = datasetIds.filter(
      (datasetId) => !visited.has(datasetId),
    );

    return {
      connected: orphanedDatasetIds.length === 0,
      connectedDatasetIds: Array.from(visited),
      orphanedDatasetIds,
    };
  }, [joins, datasetIds, transactionDatasetIds]);

  const canProceedToMap = !mustHaveJoin || joinCoverage.connected;

  const saveJoins = async () => {
    if (!ptrsId) return showAlert("Missing ptrsId", "error");
    setLoading(true);
    try {
      await performSave(joins, { silent: false });
    } finally {
      setLoading(false);
    }
  };

  const goToMap = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    if (!canProceedToMap) {
      showAlert(
        orphanedJoinMessage ||
          "Every uploaded dataset must be connected before you can continue.",
        "error",
      );
      return;
    }

    // Flush any pending autosave and ensure joins/custom fields are saved before moving on.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (dirtyRef.current) {
      await performSave(joins, { silent: true });
    } else if (isSavingRef.current && savePromiseRef.current) {
      // If a save is in-flight, await its completion.
      await savePromiseRef.current;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "map" });
    } catch (e) {
      // Surface the error but still allow navigation so the user isn't blocked
      showAlert(e?.message || "Failed to update PTRS step", "error");
    }

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`map?${qs.toString()}`, { includeId: false });
  };

  const orphanedJoinMessage =
    mustHaveJoin && !joinCoverage.connected
      ? `Every reference dataset must be connected to a transaction dataset before you can continue. Orphaned dataset ID(s): ${joinCoverage.orphanedDatasetIds.join(", ")}.`
      : null;

  const importableJoinItems = Array.isArray(compatibleJoinsQ.data?.items)
    ? compatibleJoinsQ.data.items
    : [];

  const applyImportedJoins = async (templatePtrsId) => {
    if (!templatePtrsId) return;

    try {
      setImportingTemplateId(templatePtrsId);

      const sourceItem = importableJoinItems.find(
        (item) => String(item?.id) === String(templatePtrsId),
      );

      if (!sourceItem) {
        throw new Error(
          "The selected historical joins template was not found.",
        );
      }

      const imported = await getPtrsJoins(templatePtrsId);

      const rawImportedConditions = Array.isArray(imported?.joins?.conditions)
        ? imported.joins.conditions
        : [];

      const rawImportedCustomFields = Array.isArray(imported?.customFields)
        ? imported.customFields
        : [];

      const sourceDatasets = Array.isArray(sourceItem?.datasets)
        ? sourceItem.datasets
        : [];

      const sourceDatasetIds = new Set(
        sourceDatasets
          .map((dataset) => String(dataset?.id || "").trim())
          .filter(Boolean),
      );

      const importedConditions = rawImportedConditions.filter((condition) => {
        const fromDatasetId = String(condition?.from?.datasetId || "").trim();

        const toDatasetId = String(condition?.to?.datasetId || "").trim();

        const fromColumn = String(condition?.from?.column || "").trim();
        const toColumn = String(condition?.to?.column || "").trim();

        const belongsToSelectedTemplate =
          sourceDatasetIds.has(fromDatasetId) &&
          sourceDatasetIds.has(toDatasetId);

        const isRedundantSelfJoin =
          fromDatasetId &&
          fromDatasetId === toDatasetId &&
          fromColumn &&
          fromColumn === toColumn;

        return belongsToSelectedTemplate && !isRedundantSelfJoin;
      });

      const redundantSelfJoinCount = rawImportedConditions.filter(
        (condition) => {
          const fromDatasetId = String(condition?.from?.datasetId || "").trim();

          const toDatasetId = String(condition?.to?.datasetId || "").trim();

          const fromColumn = String(condition?.from?.column || "").trim();
          const toColumn = String(condition?.to?.column || "").trim();

          return (
            fromDatasetId &&
            fromDatasetId === toDatasetId &&
            fromColumn &&
            fromColumn === toColumn
          );
        },
      ).length;

      const importedCustomFields = rawImportedCustomFields.filter((field) =>
        sourceDatasetIds.has(String(field?.datasetId || "").trim()),
      );

      const skippedJoinCount =
        rawImportedConditions.length -
        importedConditions.length -
        redundantSelfJoinCount;

      const skippedCustomFieldCount =
        rawImportedCustomFields.length - importedCustomFields.length;

      if (!sourceDatasets.length) {
        throw new Error(
          "The historical joins template does not include source dataset metadata.",
        );
      }

      const { mapping, unresolved } = buildImportedDatasetMap({
        sourceDatasets,
        targetDatasets: datasets,
      });

      if (unresolved.length > 0) {
        const details = unresolved
          .map(({ sourceDataset, reason }) => {
            const label =
              sourceDataset?.fileName || sourceDataset?.id || "Unknown dataset";

            return `${label}: ${reason}`;
          })
          .join(" ");

        throw new Error(
          `The joins could not be imported because one or more historical datasets could not be matched to the current run. ${details}`,
        );
      }

      const remapEndpoint = (endpoint) => {
        const sourceDatasetId = String(endpoint?.datasetId || "").trim();
        const role = normaliseRole(endpoint?.role);
        const column = String(endpoint?.column || "").trim();

        let targetDatasetId = mapping.get(sourceDatasetId);

        if (!targetDatasetId) {
          const candidates = datasets.filter((dataset) => {
            if (normaliseRole(dataset?.role) !== role) return false;

            const headers = new Set(getDatasetHeaders(dataset));
            return column && headers.has(column);
          });

          if (candidates.length === 1) {
            targetDatasetId = String(candidates[0].id);
          } else if (candidates.length === 0) {
            throw new Error(
              `No current dataset with role ${role || "unknown"} contains column ${column || "unknown"} for historical dataset ${sourceDatasetId || "unknown"}.`,
            );
          } else {
            throw new Error(
              `Historical dataset ${sourceDatasetId || "unknown"} is ambiguous: ${candidates.length} current datasets with role ${role} contain column ${column}.`,
            );
          }
        }

        return {
          ...endpoint,
          datasetId: targetDatasetId,
        };
      };

      const remappedConditions = importedConditions.map((condition) => ({
        ...condition,
        from: remapEndpoint(condition?.from),
        to: remapEndpoint(condition?.to),
      }));

      const remappedCustomFields = importedCustomFields.map((field) => {
        const sourceDatasetId = String(field?.datasetId || "").trim();
        const role = normaliseRole(field?.role);

        let targetDatasetId = mapping.get(sourceDatasetId);

        if (!targetDatasetId) {
          const requiredHeaders = (
            Array.isArray(field?.segments) ? field.segments : []
          )
            .filter((segment) => segment?.kind === "field")
            .map((segment) => String(segment?.name || "").trim())
            .filter(Boolean);

          const candidates = datasets.filter((dataset) => {
            if (normaliseRole(dataset?.role) !== role) return false;

            const headers = new Set(getDatasetHeaders(dataset));
            return requiredHeaders.every((header) => headers.has(header));
          });

          if (candidates.length === 1) {
            targetDatasetId = String(candidates[0].id);
          } else if (candidates.length === 0) {
            throw new Error(
              `No current dataset with role ${role || "unknown"} contains all fields required by computed field ${field?.key || "unknown"}.`,
            );
          } else {
            throw new Error(
              `Computed field ${field?.key || "unknown"} is ambiguous across ${candidates.length} current datasets with role ${role}.`,
            );
          }
        }

        const targetDataset = datasets.find(
          (dataset) => String(dataset?.id) === targetDatasetId,
        );

        const targetHeaders = new Set(getDatasetHeaders(targetDataset));

        const missingSegmentFields = (
          Array.isArray(field?.segments) ? field.segments : []
        )
          .filter((segment) => segment?.kind === "field")
          .map((segment) => String(segment?.name || "").trim())
          .filter((fieldName) => fieldName && !targetHeaders.has(fieldName));

        if (missingSegmentFields.length > 0) {
          throw new Error(
            `Computed field ${field?.key || "unknown"} refers to missing current header(s): ${missingSegmentFields.join(", ")}.`,
          );
        }

        return {
          ...field,
          datasetId: targetDatasetId,
          role: String(targetDataset?.role || field?.role || ""),
        };
      });

      const currentDatasetIds = new Set(
        datasets.map((dataset) => String(dataset?.id || "")),
      );

      const invalidEndpoint = remappedConditions.find(
        (condition) =>
          !currentDatasetIds.has(String(condition?.from?.datasetId || "")) ||
          !currentDatasetIds.has(String(condition?.to?.datasetId || "")),
      );

      if (invalidEndpoint) {
        throw new Error(
          "The imported joins still contain a dataset reference that does not belong to the current PTRS run.",
        );
      }

      const invalidCustomField = remappedCustomFields.find(
        (field) => !currentDatasetIds.has(String(field?.datasetId || "")),
      );

      if (invalidCustomField) {
        throw new Error(
          "The imported computed fields still contain a dataset reference that does not belong to the current PTRS run.",
        );
      }

      const nextJoins = {
        conditions: remappedConditions,
        customFields: remappedCustomFields,
      };

      setJoins(nextJoins);

      await performSave(nextJoins, { silent: true });

      setImportDialogOpen(false);

      const skippedParts = [];

      if (redundantSelfJoinCount > 0) {
        skippedParts.push(
          `${redundantSelfJoinCount} redundant self-join(s) ignored`,
        );
      }

      if (skippedJoinCount > 0) {
        skippedParts.push(`${skippedJoinCount} stale join(s) ignored`);
      }

      if (skippedCustomFieldCount > 0) {
        skippedParts.push(
          `${skippedCustomFieldCount} stale computed field(s) ignored`,
        );
      }

      showAlert(
        [
          `Imported ${remappedConditions.length} join(s) and ${remappedCustomFields.length} computed field(s).`,
          skippedParts.join("; "),
        ]
          .filter(Boolean)
          .join(" "),
        "success",
      );
    } catch (e) {
      showAlert(e?.message || "Failed to import joins", "error");
    } finally {
      setImportingTemplateId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tables & joins
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Inputs detected
        </Typography>
        <Stack spacing={1}>
          {datasetSummary.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No datasets uploaded yet.
            </Typography>
          ) : (
            datasetSummary.map((d) => (
              <Stack
                key={d.id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={d.role || "unknown"} />
                  <Typography>{d.name}</Typography>
                </Stack>
                <Chip size="small" label={`${d.rows} rows`} />
              </Stack>
            ))
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">Joins</Typography>
            <Chip size="small" label={`${joinsCount} defined`} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={(e) => {
                e.currentTarget.blur();
                setImportDialogOpen(true);
              }}
              disabled={loading || !ptrsId}
            >
              Import joins
            </Button>
            <Button
              size="small"
              onClick={saveJoins}
              disabled={loading || isSaving || !ptrsId}
            >
              {isSaving ? "Saving…" : "Save joins"}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={goToMap}
              disabled={!canProceedToMap || loading || !ptrsId}
            >
              Next: Map columns
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {mustHaveJoin && !joinCoverage.connected ? (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {orphanedJoinMessage}
          </Typography>
        ) : hasMultipleTransactionDatasets && !hasReferenceDatasets ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Multiple transaction datasets are available. Map each transaction
            dataset independently; joins between transaction datasets are not
            required.
          </Typography>
        ) : null}
        <JoinsDesigner
          ptrsId={ptrsId}
          joins={joins}
          customFields={joins.customFields}
          onChange={(next) => {
            if (!next || typeof next !== "object") {
              const cleared = { conditions: [], customFields: [] };
              setJoins(cleared);
              scheduleAutosave(cleared);
              return;
            }

            const nextJoins = {
              conditions: Array.isArray(next.conditions) ? next.conditions : [],
              customFields: Array.isArray(next.customFields)
                ? next.customFields
                : [],
            };

            setJoins(nextJoins);
            scheduleAutosave(nextJoins);
          }}
          leftHeaders={transactionHeaders}
          leftHeadersByRole={transactionHeadersByDataset}
          debug={debugJoins}
        />
      </Paper>

      <Dialog
        open={importDialogOpen}
        onClose={() => {
          if (!importingTemplateId) setImportDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "70vh",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle>Import joins from previous PTRS</DialogTitle>
        <DialogContent dividers>
          {compatibleJoinsQ.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading previous joins…
            </Typography>
          ) : compatibleJoinsQ.isError ? (
            <Typography variant="body2" color="error">
              {compatibleJoinsQ.error?.message ||
                "Failed to load previous joins."}
            </Typography>
          ) : importableJoinItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No previous PTRS runs with saved joins were found.
            </Typography>
          ) : (
            <List disablePadding>
              {importableJoinItems.map((item) => {
                const label =
                  item?.fileName || item?.name || item?.ptrsId || item?.id;

                const selected = importingTemplateId === item.id;

                const sourceDatasets = Array.isArray(item?.datasets)
                  ? item.datasets
                  : [];

                const updatedLabel = item?.updatedAt
                  ? new Date(item.updatedAt).toLocaleString("en-AU")
                  : "Unknown";

                return (
                  <ListItemButton
                    key={item.id}
                    onClick={() => applyImportedJoins(item.id)}
                    disabled={!!importingTemplateId}
                    selected={selected}
                    alignItems="flex-start"
                    sx={{
                      py: 2,
                      px: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Stack spacing={0.75}>
                          <Typography variant="subtitle1">{label}</Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                          >
                            <Chip
                              size="small"
                              label={`${item?.joinsCount || 0} join(s)`}
                            />

                            <Chip
                              size="small"
                              label={`${item?.customFieldsCount || 0} computed field(s)`}
                            />

                            <Chip
                              size="small"
                              variant="outlined"
                              label={`${sourceDatasets.length} dataset(s)`}
                            />
                          </Stack>

                          <Typography variant="caption" color="text.secondary">
                            PTRS: {item?.ptrsId || item?.id || "Unknown"} ·
                            Updated: {updatedLabel}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                          {sourceDatasets.map((dataset) => (
                            <Paper
                              key={dataset.id}
                              variant="outlined"
                              sx={{ px: 1.25, py: 1 }}
                            >
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {dataset?.fileName || dataset?.id}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    Dataset ID: {dataset?.id || "Unknown"}
                                  </Typography>
                                </Box>

                                <Stack direction="row" spacing={1}>
                                  <Chip
                                    size="small"
                                    label={dataset?.role || "unknown role"}
                                  />

                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`${dataset?.rowCount || 0} rows`}
                                  />
                                </Stack>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => {
              e.currentTarget.blur();
              setImportDialogOpen(false);
            }}
            disabled={!!importingTemplateId}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
