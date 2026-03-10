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
 * - Left: main dataset columns
 * - Right: supporting dataset cards with their headers
 * - Click a left item, then a right item to create a link (connection)
 * - SVG overlays draw bezier curves between linked items
 * - Emits `onChange(joins[])` where joins: [{ from:{role,column}, to:{role,column} }]
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
  const [examplesByRole, setExamplesByRole] = useState({});

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

  // Choose a FROM role for the left-side links (main or supporting).
  const [selectedFromRole, setSelectedFromRole] = useState(null);

  // Determine main dataset roles. We treat `main` and any role starting with `main_` as main datasets.
  const mainRoles = useMemo(() => {
    const roles = (datasets || [])
      .map((d) => String(d?.role || ""))
      .filter(Boolean);
    return Array.from(
      new Set(roles.filter((r) => r === "main" || r.startsWith("main_"))),
    );
  }, [datasets]);

  const supportingRoles = useMemo(() => {
    const roles = (datasets || [])
      .map((d) => String(d?.role || ""))
      .filter(Boolean);
    return Array.from(
      new Set(roles.filter((r) => !(r === "main" || r.startsWith("main_")))),
    );
  }, [datasets]);

  const supportingHeadersByRole = useMemo(() => {
    const byRole = {};
    (datasets || []).forEach((d) => {
      const role = String(d?.role || "");
      if (!role || role === "main" || role.startsWith("main_")) return;

      const headers = (d.meta?.headers || d.headers || [])
        .filter(Boolean)
        .map(String);

      byRole[role] = Array.from(new Set(headers)).sort((a, b) =>
        a.localeCompare(b),
      );
    });
    return byRole;
  }, [datasets]);

  const customFieldsByRole = useMemo(() => {
    const byRole = {};

    (customFields || []).forEach((field) => {
      const role = String(field?.role || "main");
      const key = String(field?.key || "").trim();
      if (!key) return;

      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(key);
    });

    Object.keys(byRole).forEach((role) => {
      byRole[role] = Array.from(new Set(byRole[role])).sort((a, b) =>
        a.localeCompare(b),
      );
    });

    return byRole;
  }, [customFields]);

  useEffect(() => {
    const allRoles = [...(mainRoles || []), ...(supportingRoles || [])];
    const fallback = allRoles[0] || "main";
    if (selectedFromRole && allRoles.includes(selectedFromRole)) return;
    setSelectedFromRole(fallback);
  }, [mainRoles, supportingRoles, selectedFromRole]);

  const leftFields = useMemo(() => {
    const fromRole = String(selectedFromRole || "main");

    const isMain = fromRole === "main" || fromRole.startsWith("main_");

    const roleHeaders = isMain
      ? fromRole &&
        leftHeadersByRole &&
        typeof leftHeadersByRole === "object" &&
        Array.isArray(leftHeadersByRole[fromRole])
        ? leftHeadersByRole[fromRole]
        : leftHeaders
      : supportingHeadersByRole &&
          typeof supportingHeadersByRole === "object" &&
          Array.isArray(supportingHeadersByRole[fromRole])
        ? supportingHeadersByRole[fromRole]
        : [];

    const roleCustomFields = Array.isArray(customFieldsByRole[fromRole])
      ? customFieldsByRole[fromRole]
      : [];

    const combinedHeaders = Array.from(
      new Set([
        ...(Array.isArray(roleHeaders) ? roleHeaders : []),
        ...roleCustomFields,
      ]),
    );

    const base = combinedHeaders.map((col) => ({ key: col, label: col }));
    const map = new Map(base.map((f) => [f.key, f]));

    // Ensure columns referenced in saved joins for the selected FROM role are present on the left
    (links || []).forEach((j) => {
      const isThisFrom = String(j?.from?.role || "") === fromRole;
      if (!isThisFrom) return;

      const key = j?.from?.column;
      if (key && !map.has(key)) {
        map.set(key, { key, label: key });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [
    leftHeaders,
    leftHeadersByRole,
    supportingHeadersByRole,
    selectedFromRole,
    links,
    customFieldsByRole,
  ]);

  useEffect(() => {
    if (!datasets || !datasets.length) {
      setExamplesByRole({});
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
      const roleMap = {};
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
        roleMap[d.role || "dataset"] = ex;
      }
      setExamplesByRole(roleMap);
    })();
  }, [datasets, mainRoles]);

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log(
      "[JoinsDesigner][debug] datasets roles",
      (datasets || []).map((d) => ({
        id: d.id,
        role: d.role,
        name: d.sourceName || d.fileName,
      })),
    );
    // eslint-disable-next-line no-console
    console.log("[JoinsDesigner][debug] mainRoles", mainRoles);
    // eslint-disable-next-line no-console
    console.log("[JoinsDesigner][debug] selectedFromRole", selectedFromRole);
    // eslint-disable-next-line no-console
    console.log(
      "[JoinsDesigner][debug] leftHeadersByRole counts",
      Object.fromEntries(
        Object.entries(leftHeadersByRole || {}).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.length : 0,
        ]),
      ),
    );
  }, [debug, datasets, mainRoles, selectedFromRole, leftHeadersByRole]);

  // Build right-side: join TARGET roles depend on the selected FROM role.
  // - If FROM is main/main_* => RHS should be supporting roles only.
  // - If FROM is supporting => RHS should include main roles + other supporting roles.
  const rightColumns = useMemo(() => {
    const byRole = new Map();
    const fromRole = String(selectedFromRole || "main");
    const fromIsMain = fromRole === "main" || fromRole.startsWith("main_");

    (datasets || []).forEach((d) => {
      const roleStr = String(d?.role || "dataset");

      // Never show the selected FROM role on the RHS
      if (roleStr === fromRole) return;

      // If FROM is main, we exclude all main datasets from RHS.
      // If FROM is supporting, we allow main datasets on RHS.
      if (fromIsMain && (roleStr === "main" || roleStr.startsWith("main_")))
        return;

      let baseHeaders = (d.meta?.headers || d.headers || [])
        .filter(Boolean)
        .map(String);

      // listDatasets() may not include headers for main datasets; fall back to the unified/left headers.
      if (
        !baseHeaders.length &&
        (roleStr === "main" || roleStr.startsWith("main_"))
      ) {
        const fallback =
          leftHeadersByRole &&
          typeof leftHeadersByRole === "object" &&
          Array.isArray(leftHeadersByRole[roleStr])
            ? leftHeadersByRole[roleStr]
            : Array.isArray(leftHeaders)
              ? leftHeaders
              : [];

        baseHeaders = fallback.filter(Boolean).map(String);
      }

      const roleCustomFields = Array.isArray(customFieldsByRole[roleStr])
        ? customFieldsByRole[roleStr]
        : [];

      if (!byRole.has(roleStr)) byRole.set(roleStr, new Set());
      [...baseHeaders, ...roleCustomFields].forEach((h) =>
        byRole.get(roleStr).add(h),
      );
    });

    // Make sure headers referenced in saved joins exist in the UI even if not present in metadata
    (links || []).forEach((j) => {
      const roleStr = String(j?.to?.role || "");
      const col = j?.to?.column;
      if (!roleStr || !col) return;

      // Respect the same RHS visibility rules for saved joins
      if (roleStr === fromRole) return;
      if (fromIsMain && (roleStr === "main" || roleStr.startsWith("main_")))
        return;

      if (!byRole.has(roleStr)) byRole.set(roleStr, new Set());
      byRole.get(roleStr).add(String(col));
    });

    return Array.from(byRole.entries()).map(([role, set]) => ({
      role,
      headers: Array.from(set).sort((a, b) => a.localeCompare(b)),
    }));
  }, [
    datasets,
    links,
    selectedFromRole,
    leftHeaders,
    leftHeadersByRole,
    customFieldsByRole,
  ]);

  const missingHeadersByRole = useMemo(() => {
    const issues = [];
    const fromRole = String(selectedFromRole || "main");
    const fromIsMain = fromRole === "main" || fromRole.startsWith("main_");

    const leftKnown = new Set(
      leftFields.map((f) => String(f?.key || "")).filter(Boolean),
    );

    const rightKnownByRole = new Map(
      rightColumns.map((group) => [
        String(group?.role || ""),
        new Set((group?.headers || []).map(String)),
      ]),
    );

    for (const ln of links || []) {
      const linkFromRole = String(ln?.from?.role || "");
      const linkFromColumn = String(ln?.from?.column || "");
      const linkToRole = String(ln?.to?.role || "");
      const linkToColumn = String(ln?.to?.column || "");

      if (
        linkFromRole === fromRole &&
        linkFromColumn &&
        !leftKnown.has(linkFromColumn)
      ) {
        issues.push({
          side: "from",
          role: linkFromRole,
          column: linkFromColumn,
        });
      }

      const rhsVisible =
        linkToRole &&
        linkToRole !== fromRole &&
        (!fromIsMain ||
          !(linkToRole === "main" || linkToRole.startsWith("main_")));

      if (rhsVisible) {
        const known = rightKnownByRole.get(linkToRole) || new Set();
        if (linkToColumn && !known.has(linkToColumn)) {
          issues.push({
            side: "to",
            role: linkToRole,
            column: linkToColumn,
          });
        }
      }
    }

    return issues;
  }, [links, leftFields, rightColumns, selectedFromRole]);

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
    selectedFromRole,
    leftFields,
    rightColumns,
    links,
    datasets.length,
    computePositions,
  ]);

  const beginLink = (column) => {
    setPending({ role: selectedFromRole || "main", column });
  };

  const completeLink = (role, column) => {
    if (!pending?.column || !pending?.role) return;
    const next = [
      ...links,
      {
        from: {
          role: pending.role,
          column: pending.column,
          transform: { op: "trim_upper" },
        },
        to: { role, column, transform: { op: "trim_upper" } },
      },
    ];
    setLinks(next);
    setPending(null);
    emitChange(next, customFields);
    setTimeout(computePositions, 0);
  };

  // Helpers to key DOM nodes for endpoints used by the SVG layer
  const keyL = (role, column) => `L:${role}:${column}`;
  const keyR = (role, column) => `R:${role}:${column}`;

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
    const nextEndpoint = {
      ...endpoint,
      transform: op
        ? { op, ...(arg != null && String(arg).trim() !== "" ? { arg } : {}) }
        : null,
    };
    updateLink(idx, { [side]: nextEndpoint });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* LEFT: Main dataset columns */}
        <Paper ref={leftRef} sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">FROM role columns</Typography>
            {[...(mainRoles || []), ...(supportingRoles || [])].length > 1 ? (
              <Select
                size="small"
                value={selectedFromRole || "main"}
                onChange={(e) => setSelectedFromRole(e.target.value)}
                sx={{ ml: 1, minWidth: 200 }}
              >
                {[...(mainRoles || []), ...(supportingRoles || [])].map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            ) : null}
          </Stack>
          <Stack spacing={0.5}>
            {leftFields.map(({ key, label }) => (
              <Box
                key={key}
                data-endpoint={keyL(selectedFromRole || "main", key)}
                onClick={() => beginLink(key)}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: "crosshair",
                  bgcolor:
                    pending?.column === key &&
                    pending?.role === (selectedFromRole || "main")
                      ? "action.selected"
                      : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{label}</Typography>
                {(() => {
                  const fromRole = String(selectedFromRole || "main");
                  const exVal = examplesByRole?.[fromRole]?.[key];

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
                    {keyL(selectedFromRole || "main", key)}
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
                    {issue.side.toUpperCase()} · {issue.role} · {issue.column}
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
            {rightColumns.map(({ role, headers }) => (
              <Paper
                key={role}
                variant="outlined"
                sx={{ p: 1.5, minWidth: 220, flex: "1 1 280px" }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{role}</Typography>
                  <Chip size="small" label={headers.length} />
                </Stack>
                <Stack spacing={0.5}>
                  {headers.map((h) => (
                    <Box
                      key={`${role}:${h}`}
                      data-endpoint={keyR(role, h)}
                      onClick={() => completeLink(role, h)}
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
                        const exVal = examplesByRole?.[role]?.[h];
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
                          {keyR(role, h)}
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
                        {ln?.from?.role || "main"} · {ln?.from?.column || ""}
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
                        {ln?.to?.role || ""} · {ln?.to?.column || ""}
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
            const currentRole = String(selectedFromRole || "main");
            const linkFromRole = String(ln?.from?.role || "");
            const linkToRole = String(ln?.to?.role || "");

            // Render a link when the currently selected role appears on either side.
            const selectedIsFrom = linkFromRole === currentRole;
            const selectedIsTo = linkToRole === currentRole;
            if (!selectedIsFrom && !selectedIsTo) return null;

            // If the selected role is on the TO side, reverse the visual direction so the
            // selected role still anchors to the visible left-hand side of the designer.
            const leftRole = currentRole;
            const leftColumn = selectedIsFrom
              ? ln?.from?.column
              : ln?.to?.column;
            const rightRole = selectedIsFrom ? linkToRole : linkFromRole;
            const rightColumn = selectedIsFrom
              ? ln?.to?.column
              : ln?.from?.column;

            const leftKey = keyL(leftRole, leftColumn);
            const rightKey = keyR(rightRole, rightColumn);

            const a = positions[leftKey];
            const b = positions[rightKey];

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
                        Missing left: {leftKey}
                      </text>
                    )}
                    {!b && (
                      <text x={12} y={34 + idx * 16} fontSize="11" fill="red">
                        Missing right: {rightKey}
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
            const allFieldOptions = leftFields.map((f) => f.key);

            const updateField = (patch) => {
              const next = customFields.map((item, i) =>
                i === idx
                  ? {
                      ...item,
                      role: String(item?.role || selectedFromRole || "main"),
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
                      name: allFieldOptions[0] || "",
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
                      label={`Role: ${String(cf?.role || "main")}`}
                    />
                    <Button
                      size="small"
                      onClick={removeField}
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
                            value={seg.kind === "literal" ? "literal" : "field"}
                            onChange={(e) => {
                              const kind = e.target.value;
                              if (kind === "field") {
                                updateSegment(segIdx, {
                                  kind: "field",
                                  name: seg.name || allFieldOptions[0] || "",
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
                                allFieldOptions.includes(seg.name)
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
                                  {allFieldOptions.map((opt) => (
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
                      disabled={!leftFields.length}
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
                  role: String(selectedFromRole || "main"),
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
            ? `Select a column to join with “${pending.column}”`
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
