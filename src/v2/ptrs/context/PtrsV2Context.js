import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams, useLocation } from "react-router";
import { getPtrs, listProfiles } from "v2/ptrs/services/ptrsApi";
import { getPtrsMap } from "v2/ptrs/services/tablesAndMaps.ptrsApi";
import { listDatasets } from "v2/ptrs/services/data.ptrsApi";
import {
  getCurrentCustomer,
  setCurrentCustomer,
  onCustomerChange,
} from "lib/utils/";

const normaliseId = (val) => {
  if (!val) return null;
  return typeof val === "string" ? val : null;
};

const getInitialIdsFromParams = (params, pathname) => {
  const rawPtrsFromParams = params.get("ptrsId");
  const customer = getCurrentCustomer();

  // On the landing route, we deliberately ignore any ptrsId that might be
  // present in the URL. Landing should always start "clean" and let the
  // user either create a new run or explicitly resume one, rather than
  // implicitly restoring state from a query param.
  const ptrsFromParams = pathname === "/v2/ptrs" ? null : rawPtrsFromParams;

  return {
    ptrsId: ptrsFromParams || null,
    // profileId now comes from the global tenant scope, not the URL
    profileId: customer?.profileId ?? null,
  };
};

const PtrsV2Context = createContext(null);

export function usePtrsV2Context() {
  const ctx = useContext(PtrsV2Context);
  if (!ctx)
    throw new Error("usePtrsV2Context must be used within PtrsV2Provider");
  return ctx;
}

export function PtrsV2Provider({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === "/v2/ptrs";

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
        "[PtrsV2Context] failed to persist profileId to tenant scope:",
        err
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
      console.error("[PtrsV2Context] getPtrs failed:", err);
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
      console.error("[PtrsV2Context] listDatasets failed:", err);
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
      console.error("[PtrsV2Context] listProfiles failed:", err);
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
          "[PtrsV2Context] getPtrsMap returned empty payload for ptrsId:",
          ptrsId
        );
        setPtrsMap(null);
      }
    } catch (err) {
      console.error("[PtrsV2Context] getPtrsMap failed:", err);
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

  return (
    <PtrsV2Context.Provider value={value}>{children}</PtrsV2Context.Provider>
  );
}
