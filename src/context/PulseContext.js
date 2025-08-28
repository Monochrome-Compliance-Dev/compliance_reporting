import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { pulseService } from "../services/pulse/pulse";

export const PulseContext = createContext(null);

export const usePulseContext = () => {
  const context = useContext(PulseContext);
  if (!context) {
    throw new Error("usePulseContext must be used within a PulseProvider");
  }
  return context;
};

// ---- constants ----
const EMPTY = {
  clients: [],
  resources: [],
  engagements: [],
  timesheets: {}, // shape: { [resourceId]: { [weekKey]: rows[] } }
};

export const PulseProvider = ({ children }) => {
  // canonical state held in context (no network calls here)
  const [resources, setResources] = useState(EMPTY.resources);
  const [engagements, setEngagements] = useState(EMPTY.engagements);
  const [clients, setClients] = useState(EMPTY.clients);
  const [timesheets, setTimesheets] = useState(EMPTY.timesheets);

  const [activeResourceId, setActiveResourceId] = useState(null);
  const [activeEngagementId, setActiveEngagementId] = useState(null);
  const [activeClientId, setActiveClientId] = useState(null);

  // ---- active ID persistence (ok for UX continuity) ----
  const setActiveResourceIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveResourceId(next);
    if (next) localStorage.setItem("pulse.activeResourceId", next);
    else localStorage.removeItem("pulse.activeResourceId");
  }, []);

  const setActiveEngagementIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveEngagementId(next);
    if (next) localStorage.setItem("pulse.activeEngagementId", next);
    else localStorage.removeItem("pulse.activeEngagementId");
  }, []);

  const setActiveClientIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActiveClientId(next);
    if (next) localStorage.setItem("pulse.activeClientId", next);
    else localStorage.removeItem("pulse.activeClientId");
  }, []);

  // ---- refresh (fetch from backend and cache) ----
  const refreshPulse = useCallback(async () => {
    try {
      const [nextClients, nextResources, nextEngagements] = await Promise.all([
        pulseService.clients.list(),
        pulseService.resources.list(),
        pulseService.engagements.list(),
      ]);

      setClients(nextClients);
      setResources(nextResources);
      setEngagements(nextEngagements);

      // cache
      localStorage.setItem("pulse.clients", JSON.stringify(nextClients));
      localStorage.setItem("pulse.resources", JSON.stringify(nextResources));
      localStorage.setItem(
        "pulse.engagements",
        JSON.stringify(nextEngagements)
      );
    } catch (e) {
      console.warn("PulseContext: refresh failed", e);
    }

    // (Re)hydrate active IDs from localStorage without touching lists
    const sr = localStorage.getItem("pulse.activeResourceId");
    const se = localStorage.getItem("pulse.activeEngagementId");
    const sc = localStorage.getItem("pulse.activeClientId");
    if (sr) setActiveResourceId(sr);
    if (se) setActiveEngagementId(se);
    if (sc) setActiveClientId(sc);
  }, []);

  // ---- init ----
  useEffect(() => {
    refreshPulse();
  }, [refreshPulse]);

  // ---- survivability cache (no API) ----
  useEffect(() => {
    try {
      localStorage.setItem("pulse.resources", JSON.stringify(resources));
      localStorage.setItem("pulse.engagements", JSON.stringify(engagements));
      localStorage.setItem("pulse.clients", JSON.stringify(clients));
      localStorage.setItem("pulse.timesheets", JSON.stringify(timesheets));
    } catch (err) {
      console.warn("PulseContext: failed to write cache to localStorage", err);
    }
  }, [resources, engagements, clients, timesheets]);

  // ---- pure mutators (no network or mocked backend here) ----
  const upsertResource = useCallback((partial) => {
    const item = partial;
    const id = item?.id;
    if (!id) return null;
    setResources((arr) => {
      const idx = arr.findIndex((i) => String(i.id) === String(id));
      if (idx >= 0) {
        const next = [...arr];
        next[idx] = { ...next[idx], ...item, id };
        return next;
      }
      return [...arr, { ...item, id }];
    });
    return id;
  }, []);

  const removeResource = useCallback((id) => {
    setResources((arr) => arr.filter((r) => String(r.id) !== String(id)));
  }, []);

  const upsertClient = useCallback((partial) => {
    const item = partial;
    const id = item?.id;
    if (!id) return null;
    setClients((arr) => {
      const idx = arr.findIndex((i) => String(i.id) === String(id));
      if (idx >= 0) {
        const next = [...arr];
        next[idx] = { ...next[idx], ...item, id };
        return next;
      }
      return [...arr, { ...item, id }];
    });
    return id;
  }, []);

  const removeClient = useCallback((id) => {
    setClients((arr) => arr.filter((c) => String(c.id) !== String(id)));
  }, []);

  const upsertEngagement = useCallback((partial) => {
    const item = partial;
    const id = item?.id;
    if (!id) return null;
    setEngagements((arr) => {
      const idx = arr.findIndex((i) => String(i.id) === String(id));
      if (idx >= 0) {
        const next = [...arr];
        next[idx] = { ...next[idx], ...item, id };
        return next;
      }
      return [...arr, { ...item, id }];
    });
    return id;
  }, []);

  const removeEngagement = useCallback((id) => {
    setEngagements((arr) => arr.filter((e) => String(e.id) !== String(id)));
  }, []);

  // timesheet helpers kept inside state (no mocked backend)
  const setTimesheet = useCallback((resourceId, weekKey, rows) => {
    setTimesheets((all) => {
      const byRes = all[resourceId] ? { ...all[resourceId] } : {};
      byRes[weekKey] = rows;
      return { ...all, [resourceId]: byRes };
    });
  }, []);

  const getTimesheet = useCallback(
    (resourceId, weekKey) => {
      const byRes = timesheets?.[resourceId] || {};
      return byRes?.[weekKey] || null;
    },
    [timesheets]
  );

  // derived actives
  const activeResource =
    resources.find((r) => String(r.id) === String(activeResourceId)) || null;
  const activeEngagement =
    engagements.find((e) => String(e.id) === String(activeEngagementId)) ||
    null;
  const activeClient =
    clients.find((c) => String(c.id) === String(activeClientId)) || null;

  return (
    <PulseContext.Provider
      value={{
        // data
        resources,
        engagements,
        clients,
        timesheets,
        // actives
        activeResourceId,
        activeEngagementId,
        activeClientId,
        activeResource,
        activeEngagement,
        activeClient,
        // setters for actives
        setActiveResourceId: setActiveResourceIdPersist,
        setActiveEngagementId: setActiveEngagementIdPersist,
        setActiveClientId: setActiveClientIdPersist,
        // lifecycle
        refreshPulse,
        // pure mutators
        upsertResource,
        removeResource,
        upsertClient,
        removeClient,
        upsertEngagement,
        removeEngagement,
        // timesheets in-state
        setTimesheet,
        getTimesheet,
      }}
    >
      {children}
    </PulseContext.Provider>
  );
};
