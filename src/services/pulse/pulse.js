import { fetchWrapper } from "../../lib/utils/fetch-wrapper";
import mockData from "../../features/pulse/mockData.json";

// Toggle mock vs real via env. Default to mock while building the frontend.
const USE_MOCK =
  (process.env.REACT_APP_PULSE_MOCK ?? "true").toLowerCase() !== "false";

const baseUrl = `${process.env.REACT_APP_API_URL}/pulse`;

// -----------------------------
// Helpers for MOCK adapter
// -----------------------------
const STORAGE_KEY = "pulse.mock.store";

const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));
const safeArray = (v) => (Array.isArray(v) ? v : []);

const DEFAULTS = {
  resources: safeArray(mockData?.resources),
  clients: safeArray(mockData?.clients),
  engagements: safeArray(mockData?.engagements),
  timesheets: safeArray(mockData?.timesheets), // service treats as array of entries
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      resources: safeArray(parsed.resources),
      clients: safeArray(parsed.clients),
      engagements: safeArray(parsed.engagements),
      timesheets: safeArray(parsed.timesheets),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn("pulseService (mock): failed to persist store", e);
  }
}

const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}`;

function buildCrudMock(entity) {
  return {
    list: async () => {
      await delay();
      const store = loadStore();
      return [...store[entity]];
    },
    getById: async (id) => {
      await delay();
      const store = loadStore();
      return store[entity].find((x) => String(x.id) === String(id)) || null;
    },
    create: async (params) => {
      console.log("pulseService (mock): create", entity, params);
      await delay();
      const store = loadStore();
      const now = new Date().toISOString();
      const record = { id: genId(), createdAt: now, updatedAt: now, ...params };
      store[entity] = [...store[entity], record];
      saveStore(store);
      return record;
    },
    update: async (id, params) => {
      await delay();
      const store = loadStore();
      const idx = store[entity].findIndex((x) => String(x.id) === String(id));
      if (idx === -1) throw new Error(`${entity} not found`);
      const next = {
        ...store[entity][idx],
        ...params,
        id,
        updatedAt: new Date().toISOString(),
      };
      store[entity] = store[entity].map((x, i) => (i === idx ? next : x));
      saveStore(store);
      return next;
    },
    patch: async (id, params) => {
      // same as update for mock
      return await this.update?.(id, params);
    },
    delete: async (id) => {
      await delay();
      const store = loadStore();
      const before = store[entity].length;
      store[entity] = store[entity].filter((x) => String(x.id) !== String(id));
      saveStore(store);
      return { ok: store[entity].length < before };
    },
  };
}

// -----------------------------
// REAL adapter via fetchWrapper
// -----------------------------
function buildCrudReal(entity) {
  const entityUrl = `${baseUrl}/${entity}`;
  return {
    list: async () => fetchWrapper.get(entityUrl),
    getById: async (id) => fetchWrapper.get(`${entityUrl}/${id}`),
    create: async (params) => fetchWrapper.post(entityUrl, params),
    update: async (id, params) =>
      fetchWrapper.put(`${entityUrl}/${id}`, params),
    patch: async (id, params) =>
      fetchWrapper.patch(`${entityUrl}/${id}`, params),
    delete: async (id) => fetchWrapper.delete(`${entityUrl}/${id}`),
  };
}

const buildCrud = USE_MOCK ? buildCrudMock : buildCrudReal;

export const pulseService = {
  resources: buildCrud("resources"),
  clients: buildCrud("clients"),
  engagements: buildCrud("engagements"),
  timesheets: buildCrud("timesheets"),
};
