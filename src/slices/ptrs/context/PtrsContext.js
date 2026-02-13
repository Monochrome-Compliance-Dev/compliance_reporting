import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams, useLocation } from "react-router";
import {
  getCurrentCustomer,
  onCustomerChange,
  setCurrentCustomer,
} from "shared/utils";
import { getPtrs, listProfiles } from "../services/ptrsApi";
import { listDatasets } from "../services/data.ptrsApi";
import { getPtrsMap } from "../services/tablesAndMaps.ptrsApi";

const normaliseId = (val) => {
  if (!val) return null;
  return typeof val === "string" ? val : null;
};

const getInitialIdsFromParams = (params, pathname) => {
  const rawPtrsFromParams = params.get("ptrsId");
  const customer = getCurrentCustomer();

  const onLanding = /^\/app\/ptrs(?:\/landing)?\/?$/.test(pathname);
  const ptrsFromParams = onLanding ? null : rawPtrsFromParams;

  return {
    ptrsId: ptrsFromParams || null,
    // profileId now comes from the global tenant scope, not the URL
    profileId: customer?.profileId ?? null,
  };
};

const PtrsContext = createContext(null);

export function usePtrsContext() {
  const ctx = useContext(PtrsContext);
  if (!ctx) throw new Error("usePtrsContext must be used within PtrsProvider");
  return ctx;
}

export function PtrsProvider({ children }) {
  const location = useLocation();
  const isLanding = /^\/app\/ptrs(?:\/landing)?\/?$/.test(location.pathname);

  const [params, setParams] = useSearchParams();

  const initialIds = getInitialIdsFromParams(params, location.pathname);

  const [ptrsId, _setPtrsId] = useState(initialIds.ptrsId);
  const [profileId, _setProfileId] = useState(initialIds.profileId);

  const setPtrsId = useCallback((val) => {
    _setPtrsId(normaliseId(val));
  }, []);

  const setProfileId = useCallback((val) => {
    const next = val || null;
    _setProfileId(next);

    // Also persist into the global tenant scope so other modules can see it
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
        "[PtrsContext] failed to persist profileId to tenant scope:",
        err,
      );
    }
  }, []);

  // Keep ptrsId in sync with the URL query string. profileId now lives in tenant scope only.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = window.location.search || "";
    const current = new URLSearchParams(search);

    // Only scrub ptrsId from the URL on the landing route when there is
    // no active ptrsId in context. This avoids fighting against a recent
    // navigation triggered by Resume, which sets ptrsId and then moves
    // to a working step route.
    if (isLanding && !ptrsId) {
      if (current.has("ptrsId")) {
        current.delete("ptrsId");
        setParams(current, { replace: true });
      }
      return;
    }

    if (ptrsId && typeof ptrsId === "string") {
      current.set("ptrsId", ptrsId);
    } else {
      current.delete("ptrsId");
    }

    const nextStr = current.toString();
    const currentStr =
      search && search.startsWith("?") ? search.substring(1) : search;

    if (nextStr !== currentStr) {
      setParams(current, { replace: true });
    }
  }, [ptrsId, setParams, location.pathname, isLanding]);

  // When the global tenant selection changes, adopt its profileId into local state.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = onCustomerChange?.((cust) => {
      const nextProfileId = cust?.profileId ?? null;
      _setProfileId(nextProfileId);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const [ptrsMeta, setPtrsMeta] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [ptrsMap, setPtrsMap] = useState(null);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshPtrsMeta = useCallback(async () => {
    if (!ptrsId || typeof ptrsId !== "string") return;
    try {
      setLoading(true);
      const res = await getPtrs(ptrsId);
      setPtrsMeta(res || null);
    } catch (err) {
      console.error("[PtrsContext] getPtrs failed:", err);
      setError(err.message);
      setPtrsMeta(null);
    } finally {
      setLoading(false);
    }
  }, [ptrsId]);

  const refreshDatasets = useCallback(async () => {
    if (!ptrsId || typeof ptrsId !== "string") return;
    try {
      setLoading(true);
      const res = await listDatasets(ptrsId);
      if (res?.items) setDatasets(res.items);
    } catch (err) {
      console.error("[PtrsContext] listDatasets failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ptrsId]);

  const loadProfilesForCustomer = useCallback(async (customerId) => {
    if (!customerId) {
      setProfiles([]);
      return;
    }

    try {
      setLoading(true);
      const res = await listProfiles(customerId);
      const items = (res && res.items) || [];
      setProfiles(items);
    } catch (err) {
      console.error("[PtrsContext] listProfiles failed:", err);
      setError(err.message);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPtrsMap = useCallback(async () => {
    if (!ptrsId || typeof ptrsId !== "string") return;
    try {
      setLoading(true);
      const res = await getPtrsMap(ptrsId);
      const mapData = res || null;
      if (mapData) {
        setPtrsMap(mapData);
      } else {
        console.warn(
          "[PtrsContext] getPtrsMap returned empty payload for ptrsId:",
          ptrsId,
        );
        setPtrsMap(null);
      }
    } catch (err) {
      console.error("[PtrsContext] getPtrsMap failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ptrsId]);

  const clearCache = useCallback(() => {
    setPtrsMeta(null);
    setDatasets([]);
    setPtrsMap(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!ptrsId) {
      clearCache();
      return;
    }

    if (isLanding) {
      return;
    }

    refreshPtrsMeta();
    refreshDatasets();
    refreshPtrsMap();
  }, [
    ptrsId,
    refreshPtrsMeta,
    refreshDatasets,
    isLanding,
    refreshPtrsMap,
    clearCache,
  ]);

  const value = {
    // new canonical identifiers
    ptrsId,
    setPtrsId,
    // profile selection
    profileId,
    setProfileId,
    profiles,
    loadProfilesForCustomer,
    // loaded resources
    ptrsMeta,
    datasets,
    ptrsMap,
    // refresh helpers
    refreshPtrsMeta,
    refreshDatasets,
    refreshPtrsMap,
    clearCache,
    // state flags
    loading,
    error,
  };

  return <PtrsContext.Provider value={value}>{children}</PtrsContext.Provider>;
}
