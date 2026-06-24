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
import { listProfiles } from "../services/dhApi";

const DataHubContext = createContext(null);

export function useDataHubContext() {
  const ctx = useContext(DataHubContext);
  if (!ctx) {
    throw new Error("useDataHubContext must be used within DataHubProvider");
  }
  return ctx;
}

export function DataHubProvider({ children }) {
  const currentCustomer = getCurrentCustomer();

  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [profileId, setProfileIdState] = useState(
    currentCustomer?.profileId ?? null,
  );
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const loadProfilesForCustomer = useCallback(async (customerId) => {
    if (!customerId) {
      setProfiles([]);
      return [];
    }

    setLoadingProfiles(true);
    try {
      const res = await listProfiles(customerId);
      const items = res?.items || [];
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

  const setProfileId = useCallback((nextProfileId) => {
    const next = nextProfileId || null;
    setProfileIdState(next);

    const current = getCurrentCustomer();
    if (!current?.id) return;

    setCurrentCustomer({
      ...current,
      profileId: next,
    });

    setSelectedDatasetId(null);
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

    const unsubscribe = onCustomerChange?.((customer) => {
      setSelectedDatasetId(null);
      setProfiles([]);
      setProfileIdState(customer?.profileId ?? null);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [loadProfilesForCustomer]);

  const setSelectedDataset = useCallback((datasetId) => {
    setSelectedDatasetId(datasetId || null);
  }, []);

  const value = useMemo(
    () => ({
      selectedDatasetId,
      setSelectedDatasetId: setSelectedDataset,
      profileId,
      selectedProfileId: profileId,
      setProfileId,
      profiles,
      loadingProfiles,
      loadProfilesForCustomer,
    }),
    [
      selectedDatasetId,
      setSelectedDataset,
      profileId,
      setProfileId,
      profiles,
      loadingProfiles,
      loadProfilesForCustomer,
    ],
  );

  return (
    <DataHubContext.Provider value={value}>{children}</DataHubContext.Provider>
  );
}
