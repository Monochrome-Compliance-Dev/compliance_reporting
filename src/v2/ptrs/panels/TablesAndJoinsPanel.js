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
import { usePtrsV2Context } from "v2/ptrs/hooks/usePtrsQueries";
import JoinsDesigner from "v2/ptrs/components/JoinsDesigner";
import {
  listDatasets,
  getRunMap,
  saveRunMap,
  getRunSample,
} from "v2/ptrs/services/ptrsApi";

export default function TablesAndJoinsPanel() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsV2Context();

  const runId = params.get("runId");

  const [datasets, setDatasets] = useState([]);
  const [joins, setJoins] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [examples, setExamples] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!runId) return;
      setLoading(true);
      try {
        // Datasets
        const dsRes = await listDatasets(runId);
        const items = dsRes?.items || [];
        if (!mounted) return;
        setDatasets(items);

        // Existing joins
        const mapRes = await getRunMap(runId);
        const existingJoins =
          (mapRes && (mapRes.joins || mapRes.map?.joins)) || [];
        setJoins(Array.isArray(existingJoins) ? existingJoins : []);

        // Sample for header/examples
        const sample = await getRunSample(runId, { limit: 5, offset: 0 });
        const inferred = sample?.headers || [];
        const rows = sample?.rows || [];
        const ex = {};
        for (const h of inferred) {
          for (const r of rows) {
            const v = r?.data?.[h];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
              ex[h] = String(v);
              break;
            }
          }
          if (!ex[h]) ex[h] = "";
        }
        setHeaders(inferred);
        setExamples(ex);
        console.log("[TablesAndJoinsPanel] loaded data", {
          datasets: items,
          joins: existingJoins,
          headers: inferred,
          examples: ex,
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
  }, [runId, showAlert]);

  const datasetSummary = useMemo(() => {
    return (datasets || []).map((d) => ({
      id: d.id,
      role: d.role,
      name: d.sourceName || d.fileName,
      rows: d.meta?.rowsCount ?? d.rowCount ?? 0,
    }));
  }, [datasets]);

  const saveJoins = async () => {
    if (!runId) return showAlert("Missing runId", "error");
    setLoading(true);
    try {
      // Load any existing mappings so we don't overwrite them when saving joins
      const mapRes = await getRunMap(runId).catch(() => ({}));
      const existingMappings =
        (mapRes && (mapRes.mappings || mapRes.map?.mappings)) || {};

      const payload = { mappings: existingMappings, joins, profileId };
      // eslint-disable-next-line no-console
      console.log("[TablesAndJoinsPanel] saveJoins payload", payload);

      await saveRunMap(runId, payload);
      showAlert("Saved joins", "success");
    } catch (e) {
      showAlert(e?.message || "Failed to save joins", "error");
    } finally {
      setLoading(false);
    }
  };

  const goToMap = () => {
    const qs = new URLSearchParams();
    if (runId) qs.set("runId", runId);
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
              disabled={loading || !runId}
            >
              Save joins
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={goToMap}
              disabled={joins.length === 0 || loading || !runId}
            >
              Next: Map columns
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <JoinsDesigner
          runId={runId}
          mapping={{}}
          joins={joins}
          onChange={(next) => setJoins(next || [])}
          headers={headers}
          examples={examples}
        />
      </Paper>
    </Box>
  );
}
