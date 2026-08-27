import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Tooltip,
  MenuItem,
  Select,
  TextField,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { getDatasetSample, listDatasets } from "../services/data.ptrsApi";

/**
 * Fancy Joins Designer (Option B)
 * - Left: selected transaction dataset columns
 * - Right: supporting dataset cards with their headers
 * - Click a left item, then a right item to create a link (connection)
 * - SVG overlays draw bezier curves between linked items
 * - Emits `onChange(joins[])` where every endpoint includes datasetId, role and column.
 */
export default function JoinsDesigner({
  ptrsId,
  leftHeaders = [],
  leftHeadersByRole = {},
  joins = {},
  customFields: customFieldsProp,
  onChange,
  debug = false,
}) {
  const [datasets, setDatasets] = useState([]);
  const [pending, setPending] = useState(null); // { role, column }
  const [links, setLinks] = useState(
    Array.isArray(joins?.conditions) ? joins.conditions : [],
  );
  const [customFields, setCustomFields] = useState(
    Array.isArray(customFieldsProp)
      ? customFieldsProp
      : Array.isArray(joins?.customFields)
        ? joins.customFields
        : [],
  );
  const [examplesByDatasetId, setExamplesByDatasetId] = useState({});

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const svgRef = useRef(null);
  const [positions, setPositions] = useState({}); // key -> {x,y}

  const emitChange = useCallback(
    (nextLinks, nextCustomFields) => {
      if (!onChange) return;

      const safeLinks = Array.isArray(nextLinks) ? nextLinks : [];
      const safeCustomFields = Array.isArray(nextCustomFields)
        ? nextCustomFields
        : [];

      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[JoinsDesigner][debug] emitChange", {
          conditionsCount: safeLinks.length,
          customFieldsCount: safeCustomFields.length,
          conditions: safeLinks,
          customFields: safeCustomFields,
        });
      }

      onChange({
        conditions: safeLinks,
        customFields: safeCustomFields,
      });
    },
    [onChange, debug],
  );

  useEffect(() => {
    const nextLinks = Array.isArray(joins?.conditions) ? joins.conditions : [];
    const nextCustomFields = Array.isArray(customFieldsProp)
      ? customFieldsProp
      : Array.isArray(joins?.customFields)
        ? joins.customFields
        : [];

    setLinks(nextLinks);
    setCustomFields(nextCustomFields);

    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[JoinsDesigner][debug] sync from props", {
        joinsProp: joins,
        customFieldsProp,
        nextLinks,
        nextCustomFields,
      });
    }
  }, [joins, customFieldsProp, debug]);

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log("[JoinsDesigner][debug] links", links);
  }, [debug, links]);

  // Load datasets and cache header lists
  useEffect(() => {
    if (!ptrsId) return;
    listDatasets(ptrsId)
      .then((res) => {
        setDatasets(res?.items || []);
      })
      .catch(() => setDatasets([]));
  }, [ptrsId]);

  // Choose the concrete transaction dataset for the left-side links.
  const [selectedFromDatasetId, setSelectedFromDatasetId] = useState(null);

  const transactionDatasets = useMemo(() => {
    return (datasets || []).filter(
      (dataset) => dataset?.purpose === "transaction",
    );
  }, [datasets]);

  const referenceDatasets = useMemo(() => {
    return (datasets || []).filter(
      (dataset) => dataset?.purpose === "reference",
    );
  }, [datasets]);

  const customFieldsByDatasetId = useMemo(() => {
    const byDatasetId = {};

    (customFields || []).forEach((field) => {
      const datasetId = String(field?.datasetId || "").trim();
      const key = String(field?.key || "").trim();
      if (!datasetId || !key) return;

      if (!byDatasetId[datasetId]) byDatasetId[datasetId] = [];
      byDatasetId[datasetId].push(key);
    });

    Object.keys(byDatasetId).forEach((datasetId) => {
      byDatasetId[datasetId] = Array.from(new Set(byDatasetId[datasetId])).sort(
        (a, b) => a.localeCompare(b),
      );
    });

    return byDatasetId;
  }, [customFields]);

  useEffect(() => {
    const transactionIds = (transactionDatasets || []).map((dataset) =>
      String(dataset.id),
    );
    const fallback = transactionIds[0] || null;
    if (
      selectedFromDatasetId &&
      transactionIds.includes(String(selectedFromDatasetId))
    ) {
      return;
    }
    setSelectedFromDatasetId(fallback);
  }, [transactionDatasets, selectedFromDatasetId]);

  const selectedFromDataset = useMemo(() => {
    return (
      (transactionDatasets || []).find(
        (d) => String(d.id) === String(selectedFromDatasetId || ""),
      ) || null
    );
  }, [transactionDatasets, selectedFromDatasetId]);

  const leftFields = useMemo(() => {
    const fromDatasetId = String(selectedFromDataset?.id || "");
    const datasetHeaders = (
      selectedFromDataset?.meta?.headers ||
      selectedFromDataset?.headers ||
      []
    )
      .filter(Boolean)
      .map(String);

    const datasetCustomFields = Array.isArray(
      customFieldsByDatasetId[fromDatasetId],
    )
      ? customFieldsByDatasetId[fromDatasetId]
      : [];

    const combinedHeaders = Array.from(
      new Set([...datasetHeaders, ...datasetCustomFields]),
    );

    return combinedHeaders
      .map((col) => ({ key: col, label: col }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedFromDataset, customFieldsByDatasetId]);

  useEffect(() => {
    if (!datasets || !datasets.length) {
      setExamplesByDatasetId({});
      return;
    }

    // Fetch lightweight samples for ALL roles (including main), so main columns can show examples.
    // This keeps the UI independent of whether the parent passed unified examples.
    const targets = (datasets || []).filter((d) => !!d?.id);

    const firstExample = (rows, header, colIdx) => {
      const h = String(header || "");
      for (const r of rows || []) {
        // Rows can be arrays (legacy) or objects (normalised). Prefer object access.
        let v;
        if (r && typeof r === "object" && !Array.isArray(r)) {
          if (r.data && typeof r.data === "object" && h in r.data)
            v = r.data[h];
          else if (h in r) v = r[h];
        } else {
          v = r?.[colIdx];
        }

        if (v !== undefined && v !== null && String(v).trim() !== "") {
          return String(v);
        }
      }
      return "";
    };

    (async () => {
      const datasetMap = {};
      const results = await Promise.allSettled(
        targets.map((d) =>
          getDatasetSample(d.id, { limit: 5 }).then((s) => ({ d, s })),
        ),
      );
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { d, s } = r.value;
        const headers = s.headers || [];
        const rows = s.rows || [];
        const ex = {};
        headers.forEach((h, i) => {
          const val = firstExample(rows, h, i);
          if (val) ex[String(h)] = val;
        });
        datasetMap[String(d.id)] = ex;
      }
      setExamplesByDatasetId(datasetMap);
    })();
  }, [datasets, transactionDatasets]);

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log(
      "[JoinsDesigner][debug] datasets",
      (datasets || []).map((d) => ({
        id: d.id,
        role: d.role,
        name: d.sourceName || d.fileName,
      })),
    );
    // eslint-disable-next-line no-console
    console.log(
      "[JoinsDesigner][debug] transactionDatasets",
      (transactionDatasets || []).map((d) => ({
        id: d.id,
        role: d.role,
        name: d.sourceName || d.fileName,
      })),
    );
    // eslint-disable-next-line no-console
    console.log("[JoinsDesigner][debug] selectedFromDataset", {
      id: selectedFromDataset?.id,
      role: selectedFromDataset?.role,
      name: selectedFromDataset?.sourceName || selectedFromDataset?.fileName,
    });
  }, [debug, datasets, transactionDatasets, selectedFromDataset]);

  // Build right-side reference endpoints for the selected transaction dataset.
  // Each reference endpoint remains a concrete dataset, even when kinds repeat.
  const rightColumns = useMemo(() => {
    return (referenceDatasets || []).map((d) => {
      const role = String(d?.role || "dataset");
      const datasetId = String(d?.id || "");
      const baseHeaders = (d.meta?.headers || d.headers || [])
        .filter(Boolean)
        .map(String);
      const datasetCustomFields = Array.isArray(
        customFieldsByDatasetId[datasetId],
      )
        ? customFieldsByDatasetId[datasetId]
        : [];
      const headers = Array.from(
        new Set([...baseHeaders, ...datasetCustomFields]),
      ).sort((a, b) => a.localeCompare(b));

      return {
        datasetId,
        role,
        label: d?.sourceName || d?.fileName || datasetId,
        headers,
      };
    });
  }, [referenceDatasets, customFieldsByDatasetId]);

  const datasetFieldOptionsById = useMemo(() => {
    const map = {};

    (datasets || []).forEach((d) => {
      const datasetId = String(d?.id || "");
      if (!datasetId) return;

      const headers = (d.meta?.headers || d.headers || [])
        .filter(Boolean)
        .map(String);

      map[datasetId] = Array.from(new Set(headers)).sort((a, b) =>
        a.localeCompare(b),
      );
    });

    return map;
  }, [datasets]);

  const missingHeadersByRole = useMemo(() => {
    const issues = [];

    const leftKnown = new Set(
      leftFields.map((f) => String(f?.key || "")).filter(Boolean),
    );

    const rightKnownByDataset = new Map(
      rightColumns.map((group) => [
        String(group?.datasetId || ""),
        new Set((group?.headers || []).map(String)),
      ]),
    );

    for (const ln of links || []) {
      const linkFromDatasetId = String(ln?.from?.datasetId || "");
      const linkFromRole = String(ln?.from?.role || "");
      const linkFromColumn = String(ln?.from?.column || "");
      const linkToDatasetId = String(ln?.to?.datasetId || "");
      const linkToRole = String(ln?.to?.role || "");
      const linkToColumn = String(ln?.to?.column || "");

      if (
        linkFromDatasetId === String(selectedFromDataset?.id || "") &&
        linkFromColumn &&
        !leftKnown.has(linkFromColumn)
      ) {
        issues.push({
          side: "from",
          role: linkFromRole,
          datasetId: linkFromDatasetId,
          column: linkFromColumn,
        });
      }

      const known = rightKnownByDataset.get(linkToDatasetId) || new Set();
      if (linkToColumn && !known.has(linkToColumn)) {
        issues.push({
          side: "to",
          role: linkToRole,
          datasetId: linkToDatasetId,
          column: linkToColumn,
        });
      }
    }

    return issues;
  }, [links, leftFields, rightColumns, selectedFromDataset]);

  // Recalculate absolute positions for endpoints used by SVG when DOM changes
  const computePositions = useCallback(() => {
    const pos = {};
    const capture = (container) => {
      if (!container) return;
      container.querySelectorAll("[data-endpoint]")?.forEach((el) => {
        const key = el.getAttribute("data-endpoint");
        const rect = el.getBoundingClientRect();
        const parent = svgRef.current?.getBoundingClientRect();
        if (parent) {
          pos[key] = {
            x: rect.left - parent.left + rect.width / 2,
            y: rect.top - parent.top + rect.height / 2,
          };
        }
      });
    };
    capture(leftRef.current);
    capture(rightRef.current);
    setPositions(pos);
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[JoinsDesigner][debug] endpoints", Object.keys(pos));
    }
  }, [debug]);

  useEffect(() => {
    computePositions();
    const obs = new ResizeObserver(computePositions);
    if (leftRef.current) obs.observe(leftRef.current);
    if (rightRef.current) obs.observe(rightRef.current);
    window.addEventListener("scroll", computePositions, true);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", computePositions, true);
    };
  }, [
    selectedFromDataset,
    leftFields,
    rightColumns,
    links,
    datasets.length,
    computePositions,
  ]);

  const beginLink = (datasetId, role, column) => {
    if (!datasetId || !role || !column) return;

    setPending({
      datasetId: String(datasetId),
      role: String(role || "transaction"),
      column,
    });
  };

  const completeLink = (datasetId, role, column) => {
    if (!pending?.column || !pending?.role || !pending?.datasetId) return;

    const from = {
      datasetId: String(pending.datasetId),
      role: String(pending.role),
      column: pending.column,
      transform: { op: "trim_upper" },
    };

    const to = {
      datasetId: String(datasetId),
      role: String(role),
      column,
      transform: { op: "trim_upper" },
    };

    const exists = (links || []).some(
      (l) =>
        String(l?.from?.datasetId || "") === from.datasetId &&
        String(l?.from?.role || "") === from.role &&
        String(l?.from?.column || "") === from.column &&
        String(l?.to?.datasetId || "") === to.datasetId &&
        String(l?.to?.role || "") === to.role &&
        String(l?.to?.column || "") === to.column,
    );

    if (exists) {
      setPending(null);
      return;
    }

    const next = [...links, { from, to }];

    setLinks(next);
    setPending(null);
    emitChange(next, customFields);
    setTimeout(computePositions, 0);
  };

  // Helpers to key DOM nodes for endpoints used by the SVG layer
  const keyL = (datasetId, role, column) => `L:${datasetId}:${role}:${column}`;

  const keyR = (datasetId, role, column) => `R:${datasetId}:${role}:${column}`;

  const TRANSFORM_OPTIONS = [
    { value: "", label: "None" },
    { value: "trim_upper", label: "Trim + UPPER" },
    { value: "digits_only", label: "Digits only" },
    { value: "remove_spaces_punct", label: "Remove spaces/punct" },
    { value: "strip_prefix", label: "Strip prefix" },
    { value: "lpad", label: "Left pad" },
  ];

  const updateLink = (idx, patch) => {
    const next = (links || []).map((l, i) =>
      i === idx ? { ...l, ...patch } : l,
    );
    setLinks(next);
    emitChange(next, customFields);
    setTimeout(computePositions, 0);
  };

  const removeLink = (idx) => {
    const next = (links || []).filter((_, i) => i !== idx);
    setLinks(next);
    emitChange(next, customFields);
    setTimeout(computePositions, 0);
  };

  const setEndpointTransform = (idx, side, op, arg) => {
    const ln = links?.[idx] || {};
    const endpoint = side === "to" ? ln.to || {} : ln.from || {};

    const nextTransform = !op
      ? null
      : op === "strip_prefix" || op === "lpad"
        ? {
            op,
            ...(arg != null && String(arg).trim() !== ""
              ? { arg: String(arg) }
              : {}),
          }
        : { op };

    const nextEndpoint = {
      ...endpoint,
      transform: nextTransform,
    };

    updateLink(idx, { [side]: nextEndpoint });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* LEFT: selected transaction dataset columns */}
        <Paper ref={leftRef} sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">FROM transaction dataset</Typography>
            {(transactionDatasets || []).length > 1 ? (
              <Select
                size="small"
                value={selectedFromDatasetId || ""}
                onChange={(e) => setSelectedFromDatasetId(e.target.value)}
                sx={{ ml: 1, minWidth: 320 }}
              >
                {(transactionDatasets || []).map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {String(d?.sourceName || d?.fileName || d?.id || "Dataset")}
                  </MenuItem>
                ))}
              </Select>
            ) : null}
          </Stack>
          {selectedFromDataset ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Dataset:{" "}
              {selectedFromDataset.sourceName ||
                selectedFromDataset.fileName ||
                selectedFromDataset.id}{" "}
              · Role: {selectedFromDataset.role}
            </Typography>
          ) : null}
          <Stack spacing={0.5}>
            {leftFields.map(({ key, label }) => (
              <Box
                key={key}
                data-endpoint={keyL(
                  selectedFromDataset?.id || "",
                  selectedFromDataset?.role || "transaction",
                  key,
                )}
                onClick={() => {
                  if (!pending) {
                    beginLink(
                      selectedFromDataset?.id,
                      selectedFromDataset?.role || "transaction",
                      key,
                    );
                  } else {
                    completeLink(
                      selectedFromDataset?.id,
                      selectedFromDataset?.role || "transaction",
                      key,
                    );
                  }
                }}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: "crosshair",
                  bgcolor:
                    pending?.column === key &&
                    String(pending?.datasetId || "") ===
                      String(selectedFromDataset?.id || "")
                      ? "action.selected"
                      : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{label}</Typography>
                {(() => {
                  const exVal =
                    examplesByDatasetId?.[
                      String(selectedFromDataset?.id || "")
                    ]?.[key];

                  return exVal !== undefined &&
                    exVal !== null &&
                    String(exVal).trim() !== "" ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      e.g. {String(exVal).slice(0, 80)}
                      {String(exVal).length > 80 ? "…" : ""}
                    </Typography>
                  ) : null;
                })()}
                {debug && (
                  <Typography variant="caption" color="text.secondary">
                    {keyL(
                      selectedFromDataset?.id || "",
                      selectedFromDataset?.role || "transaction",
                      key,
                    )}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* RIGHT: Supporting dataset cards with headers */}
        <Paper ref={rightRef} sx={{ p: 2, flex: 2, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Datasets</Typography>
            <Chip size="small" label={rightColumns.length} />
            <Tooltip title="Click a column on the left, then a column on the right to create a join.">
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ cursor: "help", color: "text.secondary" }}
              />
            </Tooltip>
          </Stack>

          {missingHeadersByRole.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                mb: 1,
                borderColor: "error.main",
                bgcolor: "error.lighter",
              }}
            >
              <Typography variant="body2" color="error">
                One or more saved join headers are missing from the currently
                loaded dataset metadata. Refresh the screen first. If the issue
                remains, reimport the affected dataset before continuing.
              </Typography>
              <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                {missingHeadersByRole.map((issue, idx) => (
                  <Typography
                    key={`${issue.side}:${issue.role}:${issue.column}:${idx}`}
                    variant="caption"
                    color="error"
                  >
                    {issue.side.toUpperCase()} · {issue.role} ·{" "}
                    {issue.datasetId} · {issue.column}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
          >
            {rightColumns.map(({ datasetId, role, label, headers }) => (
              <Paper
                key={datasetId}
                variant="outlined"
                sx={{ p: 1.5, minWidth: 220, flex: "1 1 280px" }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{label}</Typography>
                  <Chip size="small" label={role} />
                  <Chip size="small" label={headers.length} />
                </Stack>
                <Stack spacing={0.5}>
                  {headers.map((h) => (
                    <Box
                      key={`${datasetId}:${role}:${h}`}
                      data-endpoint={keyR(datasetId, role, h)}
                      onClick={() => {
                        if (!pending) {
                          beginLink(datasetId, role, h);
                        } else {
                          completeLink(datasetId, role, h);
                        }
                      }}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        cursor: pending ? "copy" : "default",
                        "&:hover": { bgcolor: "action.hover" },
                        border: "1px dashed",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2">{h}</Typography>
                      {(() => {
                        const exVal = examplesByDatasetId?.[datasetId]?.[h];
                        return exVal !== undefined &&
                          exVal !== null &&
                          String(exVal).trim() !== "" ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            e.g. {String(exVal).slice(0, 80)}
                            {String(exVal).length > 80 ? "…" : ""}
                          </Typography>
                        ) : null;
                      })()}
                      {debug && (
                        <Typography variant="caption" color="text.secondary">
                          {keyR(datasetId, role, h)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Join conditions</Typography>
          <Chip size="small" label={links.length} />
        </Stack>

        {links.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No joins defined yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {links.map((ln, idx) => {
              const fromOp = ln?.from?.transform?.op || "";
              const fromArg = ln?.from?.transform?.arg || "";
              const toOp = ln?.to?.transform?.op || "";
              const toArg = ln?.to?.transform?.arg || "";

              const needsFromArg =
                fromOp === "strip_prefix" || fromOp === "lpad";
              const needsToArg = toOp === "strip_prefix" || toOp === "lpad";

              return (
                <Paper
                  key={`${idx}:${ln?.from?.role}:${ln?.from?.column}:${ln?.to?.role}:${ln?.to?.column}`}
                  variant="outlined"
                  sx={{ p: 1.5 }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    alignItems="center"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        From
                      </Typography>
                      <Typography variant="body2">
                        {ln?.from?.role || "transaction"} ·{" "}
                        {ln?.from?.datasetId || ""}{" "}
                        · {ln?.from?.column || ""}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 180 }}>
                      <Select
                        size="small"
                        fullWidth
                        value={fromOp}
                        onChange={(e) =>
                          setEndpointTransform(
                            idx,
                            "from",
                            e.target.value || "",
                            needsFromArg ? fromArg : undefined,
                          )
                        }
                      >
                        {TRANSFORM_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>

                    {needsFromArg ? (
                      <TextField
                        size="small"
                        label={fromOp === "lpad" ? "Length" : "Prefix"}
                        value={fromArg}
                        onChange={(e) =>
                          setEndpointTransform(
                            idx,
                            "from",
                            fromOp,
                            e.target.value,
                          )
                        }
                        sx={{ minWidth: 140 }}
                      />
                    ) : null}

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        To
                      </Typography>
                      <Typography variant="body2">
                        {ln?.to?.role || ""} · {ln?.to?.datasetId || ""} ·{" "}
                        {ln?.to?.column || ""}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 180 }}>
                      <Select
                        size="small"
                        fullWidth
                        value={toOp}
                        onChange={(e) =>
                          setEndpointTransform(
                            idx,
                            "to",
                            e.target.value || "",
                            needsToArg ? toArg : undefined,
                          )
                        }
                      >
                        {TRANSFORM_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>

                    {needsToArg ? (
                      <TextField
                        size="small"
                        label={toOp === "lpad" ? "Length" : "Prefix"}
                        value={toArg}
                        onChange={(e) =>
                          setEndpointTransform(idx, "to", toOp, e.target.value)
                        }
                        sx={{ minWidth: 140 }}
                      />
                    ) : null}

                    <IconButton
                      size="small"
                      onClick={() => removeLink(idx)}
                      aria-label="Remove join"
                    >
                      ×
                    </IconButton>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* SVG overlay for links */}
      <Box
        ref={svgRef}
        sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <svg width="100%" height="100%">
          {links.map((ln, idx) => {
            const currentDatasetId = String(selectedFromDataset?.id || "");
            const fromDatasetId = String(ln?.from?.datasetId || "");
            const toDatasetId = String(ln?.to?.datasetId || "");

            const fromOnLeft = fromDatasetId === currentDatasetId;
            const toOnLeft = toDatasetId === currentDatasetId;

            const fromKey = fromOnLeft
              ? keyL(
                  fromDatasetId,
                  String(ln?.from?.role || "transaction"),
                  ln?.from?.column,
                )
              : keyR(
                  fromDatasetId,
                  String(ln?.from?.role || ""),
                  ln?.from?.column,
                );

            const toKey = toOnLeft
              ? keyL(
                  toDatasetId,
                  String(ln?.to?.role || "transaction"),
                  ln?.to?.column,
                )
              : keyR(toDatasetId, String(ln?.to?.role || ""), ln?.to?.column);

            const a = positions[fromKey];
            const b = positions[toKey];

            if (!debug && (!a || !b)) return null;

            const midX = a && b ? (a.x + b.x) / 2 : 0;
            const d =
              a && b
                ? `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`
                : "";

            return (
              <g key={idx}>
                {a && b && (
                  <path
                    d={d}
                    strokeWidth={2}
                    stroke="currentColor"
                    fill="none"
                    opacity={0.25}
                  />
                )}
                {debug && (
                  <>
                    {a && (
                      <circle
                        cx={a.x}
                        cy={a.y}
                        r={3}
                        fill="currentColor"
                        opacity={0.6}
                      />
                    )}
                    {b && (
                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={3}
                        fill="currentColor"
                        opacity={0.6}
                      />
                    )}
                    {!a && (
                      <text x={12} y={18 + idx * 16} fontSize="11" fill="red">
                        Missing from: {fromKey}
                      </text>
                    )}
                    {!b && (
                      <text x={12} y={34 + idx * 16} fontSize="11" fill="red">
                        Missing to: {toKey}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Custom fields (concat) */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Custom fields (concat)</Typography>
          <Chip size="small" label={customFields.length} />
          <Tooltip title="Define custom columns built from multiple fields, e.g. a join key.">
            <InfoOutlinedIcon
              fontSize="small"
              sx={{ cursor: "help", color: "text.secondary" }}
            />
          </Tooltip>
        </Stack>

        <Stack spacing={2}>
          {customFields.map((cf, idx) => {
            const segments = Array.isArray(cf.segments) ? cf.segments : [];
            const selectedCustomDatasetId = String(cf?.datasetId || "");
            const datasetFieldOptions = selectedCustomDatasetId
              ? datasetFieldOptionsById[selectedCustomDatasetId] || []
              : [];

            const updateField = (patch) => {
              const next = customFields.map((item, i) =>
                i === idx
                  ? {
                      ...item,
                      datasetId: String(
                        item?.datasetId || selectedFromDataset?.id || "",
                      ),
                      role: String(
                        item?.role || selectedFromDataset?.role || "transaction",
                      ),
                      ...patch,
                    }
                  : item,
              );
              setCustomFields(next);
              emitChange(links, next);
            };

            const updateSegment = (segIdx, patch) => {
              const nextSegments = segments.map((seg, i) =>
                i === segIdx ? { ...seg, ...patch } : seg,
              );
              updateField({ segments: nextSegments });
            };

            const addSegment = (kind) => {
              const baseSegment =
                kind === "field"
                  ? {
                      kind: "field",
                      name: datasetFieldOptions[0] || "",
                    }
                  : { kind: "literal", value: "" };
              updateField({ segments: [...segments, baseSegment] });
            };

            const removeSegment = (segIdx) => {
              const nextSegments = segments.filter((_, i) => i !== segIdx);
              updateField({ segments: nextSegments });
            };

            const removeField = () => {
              const next = customFields.filter((_, i) => i !== idx);
              setCustomFields(next);
              emitChange(links, next);
            };

            return (
              <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Field name"
                      size="small"
                      value={cf.key || ""}
                      onChange={(e) =>
                        updateField({
                          key: e.target.value,
                          type: cf.type || "concat",
                        })
                      }
                      sx={{ flex: 1 }}
                    />
                    <Chip
                      size="small"
                      label={`Role: ${String(cf?.role || "transaction")}`}
                    />
                    <Chip
                      size="small"
                      label={`Dataset: ${String(cf?.datasetId || "none")}`}
                    />
                    <Button
                      size="small"
                      onClick={removeField}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Remove field
                    </Button>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Select
                      size="small"
                      value={selectedCustomDatasetId}
                      onChange={(e) => {
                        const nextDatasetId = String(e.target.value || "");
                        const selectedDataset = (datasets || []).find(
                          (d) => String(d?.id || "") === nextDatasetId,
                        );
                        updateField({
                          datasetId: nextDatasetId,
                          role: String(
                            selectedDataset?.role || cf?.role || "transaction",
                          ),
                          segments: segments.map((seg) =>
                            seg?.kind === "field" ? { ...seg, name: "" } : seg,
                          ),
                        });
                      }}
                      sx={{ minWidth: 320 }}
                    >
                      {(datasets || []).map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {String(
                            d?.sourceName || d?.fileName || d?.id || "Dataset",
                          )}{" "}
                          · {String(d?.role || "")}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ alignSelf: "center" }}
                    >
                      Choose the dataset slice this custom field belongs to.
                    </Typography>
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
                            value={seg.kind === "literal" ? "literal" : "field"}
                            onChange={(e) => {
                              const kind = e.target.value;
                              if (kind === "field") {
                                updateSegment(segIdx, {
                                  kind: "field",
                                  name:
                                    seg.name || datasetFieldOptions[0] || "",
                                  value: undefined,
                                });
                              } else {
                                updateSegment(segIdx, {
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
                                updateSegment(segIdx, {
                                  value: e.target.value,
                                })
                              }
                              sx={{ flex: 1 }}
                            />
                          ) : (
                            (() => {
                              const safeValue =
                                seg &&
                                typeof seg.name === "string" &&
                                datasetFieldOptions.includes(seg.name)
                                  ? seg.name
                                  : "";
                              return (
                                <Select
                                  size="small"
                                  value={safeValue}
                                  onChange={(e) =>
                                    updateSegment(segIdx, {
                                      name: e.target.value,
                                    })
                                  }
                                  sx={{ flex: 1 }}
                                >
                                  {datasetFieldOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                      {opt}
                                    </MenuItem>
                                  ))}
                                </Select>
                              );
                            })()
                          )}

                          <Button
                            size="small"
                            onClick={() => removeSegment(segIdx)}
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
                      onClick={() => addSegment("field")}
                      disabled={
                        !selectedCustomDatasetId || !datasetFieldOptions.length
                      }
                    >
                      Add field segment
                    </Button>
                    <Button size="small" onClick={() => addSegment("literal")}>
                      Add literal
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}

          <Button
            size="small"
            onClick={() => {
              const next = [
                ...customFields,
                {
                  key: "",
                  type: "concat",
                  datasetId: String(selectedFromDataset?.id || ""),
                  role: String(selectedFromDataset?.role || "transaction"),
                  segments: [],
                },
              ];
              setCustomFields(next);
              emitChange(links, next);
            }}
          >
            Add custom field
          </Button>
        </Stack>
      </Paper>

      {/* Footer actions */}
      <Divider sx={{ my: 2 }} />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
      >
        <Typography variant="body2" sx={{ flex: 1 }} color="text.secondary">
          {pending
            ? `Select a column to join with “${pending.column}” in the chosen slice`
            : links.length
              ? `${links.length} join${links.length > 1 ? "s" : ""} defined`
              : "No joins defined yet"}
        </Typography>
        {!!links.length && (
          <Button
            size="small"
            onClick={() => {
              setLinks([]);
              setCustomFields([]);
              emitChange([], []);
            }}
          >
            Clear
          </Button>
        )}
      </Stack>
    </Box>
  );
}
