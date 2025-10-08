import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { onCustomerChange } from "lib/utils/";
import { getPulseConfig } from "../config/pulseConfig";

const safeParse = (text) => {
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch (_) {
    return null;
  }
};

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

  const [tenantType, setTenantType] = useState("default");
  const [config, setConfig] = useState(getPulseConfig("default"));

  const resolveTenantAndConfig = useCallback(() => {
    // 1) URL preset (highest priority)
    let urlTenant = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      urlTenant = sp.get("tenant");
    } catch (_) {}

    // 2) ENV preset
    const envTenant = process.env.REACT_APP_PULSE_TENANT || null;

    // 3) Stored tenant (previous selection)
    let storedTenant = null;
    try {
      storedTenant = localStorage.getItem("pulse.tenantType");
    } catch (_) {}

    const effectiveTenant = urlTenant || envTenant || storedTenant || "default";

    // Base config from tenant preset
    let baseConfig = getPulseConfig(effectiveTenant);

    // 4) JSON override in localStorage (lowest-level, merged on top)
    let override = null;
    try {
      const raw = localStorage.getItem("pulse_tenant_config");
      override = raw ? safeParse(raw) : null;
    } catch (_) {}

    const mergedConfig = {
      ...baseConfig,
      ...(override || {}),
    };

    return { effectiveTenant, mergedConfig };
  }, []);

  // One-time key migration: retire old large caches
  useEffect(() => {
    try {
      localStorage.removeItem("pulse.contributions");
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

  const setTenantTypePersist = useCallback(
    (type) => {
      const next = type || "default";
      try {
        localStorage.setItem("pulse.tenantType", next);
      } catch (_) {}
      // Recompute config with possible JSON override
      const { mergedConfig } = resolveTenantAndConfig();
      setTenantType(next);
      setConfig(mergedConfig);
    },
    [resolveTenantAndConfig]
  );

  const setConfigOverride = useCallback(
    (overridesObj) => {
      try {
        if (overridesObj && typeof overridesObj === "object") {
          localStorage.setItem(
            "pulse_tenant_config",
            JSON.stringify(overridesObj)
          );
        } else {
          localStorage.removeItem("pulse_tenant_config");
        }
      } catch (_) {}
      const { effectiveTenant, mergedConfig } = resolveTenantAndConfig();
      setTenantType(effectiveTenant);
      setConfig(mergedConfig);
    },
    [resolveTenantAndConfig]
  );

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

      const { effectiveTenant, mergedConfig } = resolveTenantAndConfig();
      setTenantType(effectiveTenant);
      setConfig(mergedConfig);
      setServerStatus("online"); // TSQ fetches will surface errors per-screen
    } catch (e) {
      setServerStatus("unknown");
    }
  }, [resolveTenantAndConfig]);

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
        // config
        tenantType,
        config,
        setTenantType: setTenantTypePersist,
        setConfigOverride,
      }}
    >
      {children}
    </PulseContext.Provider>
  );
};
