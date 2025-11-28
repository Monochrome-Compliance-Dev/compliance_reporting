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
} from "@mui/material";
import { getDatasetSample } from "v2/ptrs/services/ptrsApi";
import { listDatasets } from "v2/ptrs/services/data.ptrsApi";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
  examples = {},
  joins = [],
  onChange,
  debug = false,
}) {
  const [datasets, setDatasets] = useState([]);
  const [pending, setPending] = useState(null); // { role, column }
  const [links, setLinks] = useState(joins || []);
  const [examplesByRole, setExamplesByRole] = useState({});

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const svgRef = useRef(null);
  const [positions, setPositions] = useState({}); // key -> {x,y}

  useEffect(() => setLinks(joins || []), [joins]);

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

  // Build left-side main dataset columns as [{key, label}] objects
  const leftFields = useMemo(() => {
    const base = Array.isArray(leftHeaders)
      ? leftHeaders.map((col) => ({ key: col, label: col }))
      : [];
    const map = new Map(base.map((f) => [f.key, f]));

    // Ensure columns referenced in saved joins are present on the left
    (links || []).forEach((j) => {
      const key = j?.from?.column;
      if (key && !map.has(key)) {
        map.set(key, { key, label: key });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [leftHeaders, links]);

  // Determine main dataset role (transactions, primary, main). If none match, don't exclude anything
  const mainRole = useMemo(() => {
    const roles = (datasets || []).map((d) => d.role).filter(Boolean);
    const preferred = ["transactions", "primary", "main"];
    return preferred.find((r) => roles.includes(r)) || null;
  }, [datasets]);

  // Use a stable fallback when we can't positively identify a main dataset role
  const effectiveMainRole = mainRole || "main";

  useEffect(() => {
    if (!datasets || !datasets.length) {
      setExamplesByRole({});
      return;
    }

    const targets = (datasets || []).filter(
      (d) => !mainRole || d.role !== mainRole
    );

    const firstExample = (rows, colIdx) => {
      for (const r of rows || []) {
        const v = r?.[colIdx];
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
          getDatasetSample(d.id, { limit: 5 }).then((s) => ({ d, s }))
        )
      );
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { d, s } = r.value;
        const headers = s.headers || [];
        const rows = s.rows || [];
        const ex = {};
        headers.forEach((h, i) => {
          const val = firstExample(rows, i);
          if (val) ex[String(h)] = val;
        });
        roleMap[d.role || "dataset"] = ex;
      }
      setExamplesByRole(roleMap);
    })();
  }, [datasets, mainRole]);

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log(
      "[JoinsDesigner][debug] datasets roles",
      (datasets || []).map((d) => ({
        id: d.id,
        role: d.role,
        name: d.sourceName || d.fileName,
      }))
    );
    // eslint-disable-next-line no-console
    console.log("[JoinsDesigner][debug] mainRole", mainRole);
  }, [debug, datasets, mainRole]);

  // Build right-side: group headers by dataset role excluding mainRole
  const rightColumns = useMemo(() => {
    const byRole = new Map();

    (datasets || []).forEach((d) => {
      const role = d.role || "dataset";
      // Only exclude a dataset if we positively identified the main role
      if (mainRole && role === mainRole) return;

      const baseHeaders = (d.meta?.headers || d.headers || [])
        .filter(Boolean)
        .map(String);
      if (!byRole.has(role)) byRole.set(role, new Set());
      baseHeaders.forEach((h) => byRole.get(role).add(h));
    });

    // Make sure headers referenced in saved joins exist in the UI even if not present in metadata
    (links || []).forEach((j) => {
      const role = j?.to?.role;
      const col = j?.to?.column;
      if (!role || !col) return;
      if (!byRole.has(role)) byRole.set(role, new Set());
      byRole.get(role).add(String(col));
    });

    return Array.from(byRole.entries()).map(([role, set]) => ({
      role,
      headers: Array.from(set).sort((a, b) => a.localeCompare(b)),
    }));
  }, [datasets, mainRole, links]);

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
    leftFields.length,
    rightColumns.length,
    datasets.length,
    computePositions,
  ]);

  const beginLink = (column) => {
    // Allow creating a link even if we couldn't detect a main role; use a stable fallback
    setPending({ role: effectiveMainRole, column });
  };
  const completeLink = (role, column) => {
    if (!pending?.column || !pending?.role) return;
    const next = [
      ...links,
      {
        from: { role: pending.role, column: pending.column },
        to: { role, column },
      },
    ];
    setLinks(next);
    setPending(null);
    onChange && onChange(next);
    setTimeout(computePositions, 0);
  };

  // Helpers to key DOM nodes for endpoints used by the SVG layer
  const keyL = (role, column) => `L:${role}:${column}`;
  const keyR = (role, column) => `R:${role}:${column}`;

  return (
    <Box sx={{ position: "relative" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* LEFT: Main dataset columns */}
        <Paper ref={leftRef} sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Main dataset columns</Typography>
            <Chip size="small" label={leftFields.length} />
          </Stack>
          <Stack spacing={0.5}>
            {leftFields.map(({ key, label }) => (
              <Box
                key={key}
                data-endpoint={keyL(effectiveMainRole, key)}
                onClick={() => beginLink(key)}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: "crosshair",
                  bgcolor:
                    pending?.column === key &&
                    pending?.role === effectiveMainRole
                      ? "action.selected"
                      : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{label}</Typography>
                {examples &&
                  examples[key] !== undefined &&
                  examples[key] !== null &&
                  String(examples[key]).trim() !== "" && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      e.g. {String(examples[key]).slice(0, 80)}
                      {String(examples[key]).length > 80 ? "…" : ""}
                    </Typography>
                  )}
                {debug && (
                  <Typography variant="caption" color="text.secondary">
                    {keyL(effectiveMainRole, key)}
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
                        const exVal =
                          examplesByRole?.[role]?.[h] ??
                          (examples && examples[h]);
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

      {/* SVG overlay for links */}
      <Box
        ref={svgRef}
        sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <svg width="100%" height="100%">
          {links.map((ln, idx) => {
            // Prefer the exact role stored in the link, but if we didn't detect a mainRole
            // we also try a stable fallback role ("main") so lines can render.
            const leftKeyPrimary = keyL(ln.from?.role, ln.from?.column);
            const leftKeyFallback = !mainRole
              ? keyL("main", ln.from?.column)
              : null;
            const rightKey = keyR(ln.to?.role, ln.to?.column);

            let a = positions[leftKeyPrimary];
            if (!a && leftKeyFallback) a = positions[leftKeyFallback];
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
                        Missing left: {leftKeyPrimary}
                        {leftKeyFallback
                          ? ` | fallback: ${leftKeyFallback}`
                          : ""}
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
              onChange && onChange([]);
            }}
          >
            Clear
          </Button>
        )}
      </Stack>
    </Box>
  );
}
