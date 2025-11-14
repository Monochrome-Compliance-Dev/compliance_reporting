import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams } from "react-router";
import {
  getPtrs,
  listDatasets,
  getPtrsMap,
  listProfiles,
} from "v2/ptrs/services/ptrsApi";

const normaliseId = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.ptrsId === "string") return val.ptrsId;
    if (typeof val.id === "string") return val.id;
    if (val.data && typeof val.data.id === "string") return val.data.id;
  }
  return null;
};

const getInitialIdsFromParams = (params) => {
  const ptrsFromParams = params.get("ptrsId");
  const profileFromParams = params.get("profileId");

  return {
    ptrsId: ptrsFromParams || null,
    profileId: profileFromParams || null,
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
  const [params, setParams] = useSearchParams();

  const initialIds = getInitialIdsFromParams(params);

  const [ptrsId, _setPtrsId] = useState(initialIds.ptrsId);
  const [profileId, _setProfileId] = useState(initialIds.profileId);

  const setPtrsId = useCallback((val) => {
    _setPtrsId(normaliseId(val));
  }, []);

  const setProfileId = useCallback((val) => {
    _setProfileId(val || null);
  }, []);

  console.log(
    "PtrsV2Provider render, ptrsId=",
    ptrsId,
    "profileId=",
    profileId
  );

  // Keep ptrsId/profileId in sync with the URL query string.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = window.location.search || "";
    const current = new URLSearchParams(search);

    if (ptrsId && typeof ptrsId === "string") {
      current.set("ptrsId", ptrsId);
    } else {
      current.delete("ptrsId");
    }

    if (profileId && typeof profileId === "string") {
      current.set("profileId", profileId);
    } else {
      current.delete("profileId");
    }

    const nextStr = current.toString();
    const currentStr =
      search && search.startsWith("?") ? search.substring(1) : search;

    if (nextStr !== currentStr) {
      setParams(current, { replace: true });
    }
  }, [ptrsId, profileId, setParams]);

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
      console.log("[PtrsV2Context] getPtrsMap response:", res);
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
    if (ptrsId) {
      refreshPtrsMeta();
      refreshDatasets();
      refreshPtrsMap();
    } else {
      clearCache();
    }
  }, [ptrsId, refreshPtrsMeta, refreshDatasets, refreshPtrsMap, clearCache]);

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
