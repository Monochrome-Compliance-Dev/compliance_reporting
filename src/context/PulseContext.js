import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import mockData from "../features/pulse/mockData.json";

export const PulseContext = createContext(null);

export const usePulseContext = () => {
  const context = useContext(PulseContext);
  if (!context) {
    throw new Error("usePulseContext must be used within a PulseProvider");
  }
  return context;
};

// --- helpers ---
const safeArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());

function mergeById(base = [], overrides = []) {
  const map = new Map(base.map((item) => [String(item.id), item]));
  for (const o of overrides) {
    if (!o || !o.id) continue;
    map.set(String(o.id), { ...map.get(String(o.id)), ...o });
  }
  // Add any brand-new items with new IDs
  for (const o of overrides) {
    if (!o || !o.id) continue;
    if (!base.some((b) => String(b.id) === String(o.id))) {
      map.set(String(o.id), o);
    }
  }
  return Array.from(map.values());
}

function readOverrides() {
  try {
    const raw = localStorage.getItem("pulse_mock_overrides");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOverrides(next) {
  try {
    localStorage.setItem("pulse_mock_overrides", JSON.stringify(next));
  } catch (e) {
    console.warn("PulseContext: failed to write overrides", e);
  }
}

export const PulseProvider = ({ children }) => {
  const [resources, setResources] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [clients, setClients] = useState([]);

  const [activeResourceId, setActiveResourceId] = useState(null);
  const [activeEngagementId, setActiveEngagementId] = useState(null);
  const [activeClientId, setActiveClientId] = useState(null);

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

  const loadAll = useCallback(() => {
    // base
    const baseResources = safeArray(mockData?.resources);
    const baseEngagements = safeArray(mockData?.engagements);
    const baseClients = safeArray(mockData?.clients);

    // overrides
    const overrides = readOverrides();
    const oRes = safeArray(overrides.resources);
    const oEng = safeArray(overrides.engagements);
    const oCli = safeArray(overrides.clients);

    const mergedRes = mergeById(baseResources, oRes);
    const mergedEng = mergeById(baseEngagements, oEng);
    const mergedCli = mergeById(baseClients, oCli);

    setResources(mergedRes);
    setEngagements(mergedEng);
    setClients(mergedCli);

    const storedRes = localStorage.getItem("pulse.activeResourceId");
    const storedEng = localStorage.getItem("pulse.activeEngagementId");
    const storedCli = localStorage.getItem("pulse.activeClientId");

    const resValid =
      storedRes && mergedRes.some((r) => r?.id === storedRes)
        ? storedRes
        : mergedRes[0]?.id || null;
    const engValid =
      storedEng && mergedEng.some((e) => e?.id === storedEng)
        ? storedEng
        : mergedEng[0]?.id || null;
    const cliValid =
      storedCli && mergedCli.some((c) => c?.id === storedCli)
        ? storedCli
        : mergedCli[0]?.id || null;

    setActiveResourceIdPersist(resValid);
    setActiveEngagementIdPersist(engValid);
    setActiveClientIdPersist(cliValid);
  }, [
    setActiveClientIdPersist,
    setActiveEngagementIdPersist,
    setActiveResourceIdPersist,
  ]);

  const refreshPulse = useCallback(async () => {
    loadAll();
  }, [loadAll]);

  // init
  useEffect(() => {
    try {
      const storedResources = localStorage.getItem("pulse.resources");
      const storedEngagements = localStorage.getItem("pulse.engagements");
      const storedClients = localStorage.getItem("pulse.clients");

      if (storedResources || storedEngagements || storedClients) {
        const res = safeArray(
          storedResources ? JSON.parse(storedResources) : []
        );
        const eng = safeArray(
          storedEngagements ? JSON.parse(storedEngagements) : []
        );
        const cls = safeArray(storedClients ? JSON.parse(storedClients) : []);
        setResources(res);
        setEngagements(eng);
        setClients(cls);
      } else {
        loadAll();
      }
    } catch (err) {
      console.error("Error initialising PulseContext from storage:", err);
      loadAll();
    }
  }, [loadAll]);

  // cache to localStorage for survivability
  useEffect(() => {
    try {
      localStorage.setItem("pulse.resources", JSON.stringify(resources));
      localStorage.setItem("pulse.engagements", JSON.stringify(engagements));
      localStorage.setItem("pulse.clients", JSON.stringify(clients));
    } catch (err) {
      console.warn("PulseContext: failed to write cache to localStorage", err);
    }
  }, [resources, engagements, clients]);

  // --- mocked backend operations ---
  const upsert = (arr, entity) => {
    const id = entity.id ?? genId();
    const idx = arr.findIndex((i) => String(i.id) === String(id));
    if (idx >= 0) {
      const next = [...arr];
      next[idx] = { ...next[idx], ...entity, id };
      return next;
    }
    return [...arr, { ...entity, id }];
  };

  const persistOverrides = (nextPart) => {
    const overrides = readOverrides();
    const next = { ...overrides, ...nextPart };
    writeOverrides(next);
  };

  // Clients
  const saveClient = async (partial) => {
    const next = upsert(safeArray(readOverrides().clients || clients), partial);
    persistOverrides({ clients: next });
    loadAll();
    return (
      next.find((c) => String(c.id) === String(partial.id)) ||
      next[next.length - 1]
    );
  };
  const deleteClient = async (id) => {
    const current = safeArray(readOverrides().clients || clients);
    const next = current.filter((c) => String(c.id) !== String(id));
    persistOverrides({ clients: next });
    loadAll();
  };

  // Resources
  const saveResource = async (partial) => {
    const next = upsert(
      safeArray(readOverrides().resources || resources),
      partial
    );
    persistOverrides({ resources: next });
    loadAll();
    return (
      next.find((r) => String(r.id) === String(partial.id)) ||
      next[next.length - 1]
    );
  };
  const deleteResource = async (id) => {
    const current = safeArray(readOverrides().resources || resources);
    const next = current.filter((r) => String(r.id) !== String(id));
    persistOverrides({ resources: next });
    loadAll();
  };

  // Engagements
  const saveEngagement = async (partial) => {
    const next = upsert(
      safeArray(readOverrides().engagements || engagements),
      partial
    );
    persistOverrides({ engagements: next });
    loadAll();
    return (
      next.find((e) => String(e.id) === String(partial.id)) ||
      next[next.length - 1]
    );
  };
  const deleteEngagement = async (id) => {
    const current = safeArray(readOverrides().engagements || engagements);
    const next = current.filter((e) => String(e.id) !== String(id));
    persistOverrides({ engagements: next });
    loadAll();
  };

  // Timesheets (stored as overrides map: timesheets[resourceId][weekKey] = rows)
  const readTimesheets = () => {
    const o = readOverrides();
    return o.timesheets || {};
  };
  const saveTimesheet = async (resourceId, weekKey, rows) => {
    const all = readTimesheets();
    const byRes = all[resourceId] || {};
    byRes[weekKey] = rows;
    const next = { ...all, [resourceId]: byRes };
    persistOverrides({ timesheets: next });
    return true;
  };
  const getTimesheet = (resourceId, weekKey) => {
    const all = readTimesheets();
    return all?.[resourceId]?.[weekKey] || null;
  };

  // Derived actives (optional convenience)
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
        // actives
        activeResourceId,
        activeEngagementId,
        activeClientId,
        activeResource,
        activeEngagement,
        activeClient,
        // setters
        setActiveResourceId: setActiveResourceIdPersist,
        setActiveEngagementId: setActiveEngagementIdPersist,
        setActiveClientId: setActiveClientIdPersist,
        // ops
        refreshPulse,
        saveClient,
        deleteClient,
        saveResource,
        deleteResource,
        saveEngagement,
        deleteEngagement,
        saveTimesheet,
        getTimesheet,
      }}
    >
      {children}
    </PulseContext.Provider>
  );
};
