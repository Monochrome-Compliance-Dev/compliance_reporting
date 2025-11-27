import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router";
import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import JoinsDesigner from "v2/ptrs/components/JoinsDesigner";
import {
  listDatasets,
  getPtrsMap,
  savePtrsMap,
  getUnifiedSample,
} from "v2/ptrs/services/ptrsApi";
import { useUpdatePtrsMutation } from "v2/ptrs/hooks/usePtrsQueries";

export default function TablesAndJoinsPanel() {
  const [params] = useSearchParams();
  const debugJoins =
    params.get("debug") === "1" || params.get("debug") === "joins";
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsV2Context();

  const ptrsId = params.get("ptrsId");
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [datasets, setDatasets] = useState([]);
  const [joins, setJoins] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mainHeaders, setMainHeaders] = useState([]);
  const [examples, setExamples] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!ptrsId) return;
      setLoading(true);
      try {
        // Datasets
        const dsRes = await listDatasets(ptrsId);
        const items = dsRes?.items || [];
        if (!mounted) return;
        setDatasets(items);

        // Existing joins
        const mapRes = await getPtrsMap(ptrsId);
        const existingJoins =
          (mapRes && (mapRes.joins || mapRes.map?.joins)) || [];
        setJoins(Array.isArray(existingJoins) ? existingJoins : []);

        // Unified sample for headers/examples (main + supporting)
        const unified = await getUnifiedSample(ptrsId, { limit: 5, offset: 0 });
        const inferred = unified?.headers || [];
        const headerMeta = unified?.headerMeta || {};

        // Derive main-only headers from unified headerMeta:
        // keep headers that have at least one source with kind === "main"
        const mains = inferred.filter((h) => {
          const srcs = headerMeta[h]?.sources || [];
          if (!Array.isArray(srcs) || !srcs.length) return false;
          return srcs.some((s) => s && s.kind === "main");
        });
        setMainHeaders(mains);

        const ex = {};
        for (const h of inferred) {
          const meta = headerMeta[h] || {};
          const example =
            meta.example ??
            (meta.examples
              ? (meta.examples.main ?? Object.values(meta.examples)[0])
              : "");
          ex[h] = example == null ? "" : String(example);
        }

        setHeaders(inferred);
        setExamples(ex);

        console.log("[TablesAndJoinsPanel] loaded data", {
          datasets: items,
          joins: existingJoins,
          headers: inferred,
          examples: ex,
          mainHeaders: mains,
        });
      } catch (e) {
        showAlert(e?.message || "Failed to load tables & joins", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [ptrsId, showAlert]);

  const datasetSummary = useMemo(() => {
    return (datasets || []).map((d) => ({
      id: d.id,
      role: d.role,
      name: d.sourceName || d.fileName,
      rows: d.meta?.rowsCount ?? d.rowCount ?? 0,
    }));
  }, [datasets]);

  const saveJoins = async () => {
    if (!ptrsId) return showAlert("Missing ptrsId", "error");
    setLoading(true);
    try {
      // Load any existing mappings so we don't overwrite them when saving joins
      const mapRes = await getPtrsMap(ptrsId).catch(() => ({}));
      const existingMappings =
        (mapRes && (mapRes.mappings || mapRes.map?.mappings)) || {};

      const payload = { mappings: existingMappings, joins, profileId };
      console.log("[TablesAndJoinsPanel] saveJoins payload", payload);

      await savePtrsMap(ptrsId, payload);
      showAlert("Saved joins", "success");
    } catch (e) {
      showAlert(e?.message || "Failed to save joins", "error");
    } finally {
      setLoading(false);
    }
  };

  const goToMap = async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
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
    navigate(`/v2/ptrs/map?${qs.toString()}`);
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
            <Chip size="small" label={`${joins.length} defined`} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={saveJoins}
              disabled={loading || !ptrsId}
            >
              Save joins
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={goToMap}
              disabled={joins.length === 0 || loading || !ptrsId}
            >
              Next: Map columns
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <JoinsDesigner
          ptrsId={ptrsId}
          joins={joins}
          onChange={(next) => setJoins(next || [])}
          headers={headers}
          examples={examples}
          leftHeaders={mainHeaders}
          debug={debugJoins}
        />
      </Paper>
    </Box>
  );
}
