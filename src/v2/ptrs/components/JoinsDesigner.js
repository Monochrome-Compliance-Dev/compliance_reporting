import { useEffect, useMemo, useRef, useState } from "react";
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
import { listDatasets } from "v2/ptrs/services/ptrsApi";

/**
 * Fancy Joins Designer (Option B)
 * - Left: canonical fields (from current mapping)
 * - Right: dataset cards with their headers
 * - Click a left item, then a right item to create a link (connection)
 * - SVG overlays draw bezier curves between linked items
 * - Emits `onChange(joins[])` where joins: [{ from:{field}, to:{role,column} }]
 */
export default function JoinsDesigner({
  runId,
  mapping = {},
  joins = [],
  onChange,
}) {
  const [datasets, setDatasets] = useState([]);
  const [hover, setHover] = useState(null);
  const [pending, setPending] = useState(null); // {field}
  const [links, setLinks] = useState(joins || []);

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const svgRef = useRef(null);
  const [positions, setPositions] = useState({}); // key -> {x,y}

  useEffect(() => setLinks(joins || []), [joins]);

  // Load datasets and cache header lists
  useEffect(() => {
    if (!runId) return;
    listDatasets(runId)
      .then((res) => {
        setDatasets(res?.items || []);
      })
      .catch(() => setDatasets([]));
  }, [runId]);

  // Build left-side canonical fields from mapping object values (unique fields)
  const leftFields = useMemo(() => {
    const set = new Set();
    Object.values(mapping || {}).forEach((v) => {
      if (v?.field) set.add(v.field);
    });
    return Array.from(set).sort();
  }, [mapping]);

  // Build right-side: group headers by dataset role
  const rightColumns = useMemo(() => {
    const byRole = new Map();
    (datasets || []).forEach((d) => {
      const role = d.role || "dataset";
      const headers = d.meta?.headers || [];
      if (!byRole.has(role)) byRole.set(role, new Set());
      headers.forEach((h) => byRole.get(role).add(h));
    });
    return Array.from(byRole.entries()).map(([role, set]) => ({
      role,
      headers: Array.from(set),
    }));
  }, [datasets]);

  // Recalculate absolute positions for endpoints used by SVG when DOM changes
  const computePositions = () => {
    const pos = {};
    const capture = (container, prefix) => {
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
    capture(leftRef.current, "L");
    capture(rightRef.current, "R");
    setPositions(pos);
  };

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
  }, [leftFields.length, rightColumns.length, datasets.length]);

  const beginLink = (field) => setPending({ field });
  const completeLink = (role, column) => {
    if (!pending?.field) return;
    const next = [
      ...links,
      { from: { field: pending.field }, to: { role, column } },
    ];
    setLinks(next);
    setPending(null);
    onChange && onChange(next);
    setTimeout(computePositions, 0);
  };
  const removeLink = (idx) => {
    const next = links.filter((_, i) => i !== idx);
    setLinks(next);
    onChange && onChange(next);
    setTimeout(computePositions, 0);
  };

  // Helpers to key DOM nodes for endpoints used by the SVG layer
  const keyL = (field) => `L:${field}`;
  const keyR = (role, column) => `R:${role}:${column}`;

  return (
    <Box sx={{ position: "relative" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* LEFT: Canonical fields */}
        <Paper ref={leftRef} sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Canonical fields</Typography>
            <Chip size="small" label={leftFields.length} />
          </Stack>
          <Stack spacing={0.5}>
            {leftFields.map((f) => (
              <Box
                key={f}
                data-endpoint={keyL(f)}
                onMouseEnter={() => setHover({ side: "L", key: keyL(f) })}
                onMouseLeave={() => setHover(null)}
                onClick={() => beginLink(f)}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: "crosshair",
                  bgcolor:
                    pending?.field === f ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{f}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* RIGHT: Dataset cards with headers */}
        <Paper ref={rightRef} sx={{ p: 2, flex: 2, minHeight: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Datasets</Typography>
            <Chip size="small" label={rightColumns.length} />
            <Tooltip title="Click a field on the left, then a column on the right to create a join.">
              <span />
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
                      onMouseEnter={() =>
                        setHover({ side: "R", key: keyR(role, h) })
                      }
                      onMouseLeave={() => setHover(null)}
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
            const a = positions[keyL(ln.from.field)];
            const b = positions[keyR(ln.to.role, ln.to.column)];
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const d = `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
            return (
              <g key={idx}>
                <path
                  d={d}
                  strokeWidth={2}
                  stroke="currentColor"
                  fill="none"
                  opacity={0.25}
                />
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
            ? `Select a column to join with “${pending.field}”`
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
