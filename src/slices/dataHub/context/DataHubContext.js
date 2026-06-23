import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentCustomer,
  onCustomerChange,
  setCurrentCustomer,
} from "shared/utils";
import { getRun, listRuns } from "../services/dhApi";
import { listProfiles } from "../../ptrs/services/ptrsApi";

const DataHubContext = createContext(null);

export function useDataHubContext() {
  const ctx = useContext(DataHubContext);
  if (!ctx) {
    throw new Error("useDataHubContext must be used within DataHubProvider");
  }
  return ctx;
}

export function DataHubProvider({ children }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const currentCustomer = getCurrentCustomer();
  const [profileId, _setProfileId] = useState(
    currentCustomer?.profileId ?? null,
  );
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const selectedRun = useMemo(
    () =>
      runs.find(
        (run) => run.id === selectedRunId || run.runId === selectedRunId,
      ) || null,
    [runs, selectedRunId],
  );

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const { items } = await listRuns();
      setRuns(items || []);
      return items || [];
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    loadRuns().catch((err) => {
      console.error("[DataHubContext] failed to load runs:", err);
    });
  }, [loadRuns]);

  const loadProfilesForCustomer = useCallback(async (customerId) => {
    if (!customerId) {
      setProfiles([]);
      return [];
    }

    try {
      setLoadingProfiles(true);
      const res = await listProfiles(customerId);
      const items = (res && res.items) || [];
      setProfiles(items);
      return items;
    } catch (err) {
      console.error("[DataHubContext] listProfiles failed:", err);
      setProfiles([]);
      return [];
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const setProfileId = useCallback((val) => {
    const next = val || null;
    _setProfileId(next);

    try {
      const current = getCurrentCustomer();
      if (current && current.id) {
        setCurrentCustomer({
          ...current,
          profileId: next,
        });
      }
    } catch (err) {
      console.error(
        "[DataHubContext] failed to persist profileId to tenant scope:",
        err,
      );
    }
  }, []);

  useEffect(() => {
    const customer = getCurrentCustomer();
    if (!customer?.id) return;
    loadProfilesForCustomer(customer.id).catch((err) => {
      console.error("[DataHubContext] failed to load profiles:", err);
    });
  }, [loadProfilesForCustomer]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const unsubscribe = onCustomerChange?.((cust) => {
      const nextProfileId = cust?.profileId ?? null;
      _setProfileId(nextProfileId);
      loadProfilesForCustomer(cust?.id).catch((err) => {
        console.error(
          "[DataHubContext] failed to load profiles after customer change:",
          err,
        );
      });
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [loadProfilesForCustomer]);

  const selectRun = useCallback(
    async (runId) => {
      if (!runId) {
        setSelectedRunId(null);
        return null;
      }

      setSelectedRunId(runId);

      const loadedRun =
        runs.find((run) => run.id === runId || run.runId === runId) || null;
      if (loadedRun) return loadedRun;

      const run = await getRun(runId);
      setRuns((current) => {
        const exists = current.some(
          (item) => item.id === run.id || item.runId === run.runId,
        );
        return exists ? current : [run, ...current];
      });
      return run;
    },
    [runs],
  );

  const upsertRun = useCallback((run) => {
    if (!run) return;
    setRuns((current) => {
      const exists = current.some(
        (item) => item.id === run.id || item.runId === run.runId,
      );
      if (exists) {
        return current.map((item) =>
          item.id === run.id || item.runId === run.runId ? run : item,
        );
      }
      return [run, ...current];
    });
  }, []);

  const value = {
    runs,
    selectedRun,
    selectedRunId,
    loadingRuns,
    profileId,
    setProfileId,
    profiles,
    loadProfilesForCustomer,
    loadingProfiles,
    loadRuns,
    selectRun,
    upsertRun,
  };

  return (
    <DataHubContext.Provider value={value}>{children}</DataHubContext.Provider>
  );
}
