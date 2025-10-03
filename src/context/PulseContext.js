import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { onCustomerChange } from "lib/utils/";

export const PulseContext = createContext(null);

export const usePulseContext = () => {
  const context = useContext(PulseContext);
  if (!context)
    throw new Error("usePulseContext must be used within a PulseProvider");
  return context;
};

export const PulseProvider = ({ children }) => {
  // ---- selections only (server state now lives in TanStack Query) ----
  const [activeResourceId, setActiveResourceId] = useState(null);
  const [activeTrackableId, setActiveTrackableId] = useState(null);
  const [activeClientId, setActiveClientId] = useState(null);
  const [serverStatus, setServerStatus] = useState("unknown");

  // One-time key migration: retire old large caches
  useEffect(() => {
    try {
      localStorage.removeItem("pulse.timesheets");
    } catch (_) {}
  }, []);

  // Persist helpers
  const setActiveResourceIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveResourceId(next);
    if (next) localStorage.setItem("pulse.activeResourceId", next);
    else localStorage.removeItem("pulse.activeResourceId");
  }, []);

  const setActiveTrackableIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveTrackableId(next);
    if (next) localStorage.setItem("pulse.activeTrackableId", next);
    else localStorage.removeItem("pulse.activeTrackableId");
  }, []);

  const setActiveClientIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveClientId(next);
    if (next) localStorage.setItem("pulse.activeClientId", next);
    else localStorage.removeItem("pulse.activeClientId");
  }, []);

  // Rehydrate selections on mount & tenant change
  const rehydrateSelections = useCallback(() => {
    try {
      const sr = localStorage.getItem("pulse.activeResourceId");
      const st = localStorage.getItem("pulse.activeTrackableId");
      const sc = localStorage.getItem("pulse.activeClientId");
      if (sr) setActiveResourceId(sr);
      else setActiveResourceId(null);
      if (st) setActiveTrackableId(st);
      else setActiveTrackableId(null);
      if (sc) setActiveClientId(sc);
      else setActiveClientId(null);
      setServerStatus("online"); // TSQ fetches will surface errors per-screen
    } catch (e) {
      setServerStatus("unknown");
    }
  }, []);

  useEffect(() => {
    rehydrateSelections();
  }, [rehydrateSelections]);
  useEffect(() => {
    const unsubscribe = onCustomerChange?.(() => rehydrateSelections());
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [rehydrateSelections]);

  return (
    <PulseContext.Provider
      value={{
        // actives only
        activeResourceId,
        activeTrackableId,
        activeClientId,
        serverStatus,
        // setters
        setActiveResourceId: setActiveResourceIdPersist,
        setActiveTrackableId: setActiveTrackableIdPersist,
        setActiveClientId: setActiveClientIdPersist,
      }}
    >
      {children}
    </PulseContext.Provider>
  );
};
