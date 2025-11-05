import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams } from "react-router";
import { getRun, listDatasets, getRunMap } from "v2/ptrs/services/ptrsApi";

const PtrsV2Context = createContext(null);

export function usePtrsV2Context() {
  const ctx = useContext(PtrsV2Context);
  if (!ctx)
    throw new Error("usePtrsV2Context must be used within PtrsV2Provider");
  return ctx;
}

export function PtrsV2Provider({ children }) {
  const [params] = useSearchParams();

  const [runId, setRunId] = useState(() => params.get("runId") || null);
  const [profileId, setProfileId] = useState(
    () => params.get("profileId") || null
  );

  const [runMeta, setRunMeta] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [runMap, setRunMap] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshRunMeta = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      const res = await getRun(runId);
      if (res?.data) setRunMeta(res.data);
    } catch (err) {
      console.error("[PtrsV2Context] getRun failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const refreshDatasets = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      const res = await listDatasets(runId);
      if (res?.items) setDatasets(res.items);
    } catch (err) {
      console.error("[PtrsV2Context] listDatasets failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const refreshRunMap = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      const res = await getRunMap(runId);
      if (res?.data) setRunMap(res.data);
    } catch (err) {
      console.error("[PtrsV2Context] getRunMap failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const clearCache = useCallback(() => {
    setRunMeta(null);
    setDatasets([]);
    setRunMap(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (runId) {
      refreshRunMeta();
      refreshDatasets();
      refreshRunMap();
    }
  }, [runId, refreshRunMeta, refreshDatasets, refreshRunMap]);

  const value = {
    runId,
    setRunId,
    profileId,
    setProfileId,
    runMeta,
    datasets,
    runMap,
    refreshRunMeta,
    refreshDatasets,
    refreshRunMap,
    clearCache,
    loading,
    error,
  };

  return (
    <PtrsV2Context.Provider value={value}>{children}</PtrsV2Context.Provider>
  );
}
