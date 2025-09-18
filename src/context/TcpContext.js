// TCP Context — state only, id comes from PtrsContext
// Holds tcpRecords and exposes them read-only. No fetching, no flags, no snapshots.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePtrsContext } from "./PtrsContext";
import { tcpService } from "../services/";

const TcpContext = createContext({
  tcpRecords: [],
});

const MAX_IN_MEMORY_ROWS = 1000;

export function TcpProvider({ children }) {
  const { activePtrsId } = usePtrsContext();
  const [tcpRecords, setTcpRecords] = useState([]);

  // Expose a refresh function encapsulating the fetch/cache logic
  const refresh = useCallback(async () => {
    if (!activePtrsId) {
      setTcpRecords([]);
      return;
    }

    let cancelled = false;
    try {
      const resp = await tcpService.getAllByPtrsId(activePtrsId);
      const rows = Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp?.rows)
            ? resp.rows
            : [];
      // Hard cap to avoid blowing up memory in the browser
      const limited = Array.isArray(rows)
        ? rows.slice(0, MAX_IN_MEMORY_ROWS)
        : [];
      if (rows.length > MAX_IN_MEMORY_ROWS) {
        // eslint-disable-next-line no-console
        console.warn(
          `TcpContext: received ${rows.length} rows, capping to first ${MAX_IN_MEMORY_ROWS} for display to protect memory.`
        );
      }
      if (!cancelled) setTcpRecords(limited);
    } catch {
      if (!cancelled) setTcpRecords([]);
    }
  }, [activePtrsId]);

  // Restore tcpRecords from tolerant cache or API when the active PTRS id changes
  useEffect(() => {
    let abort = false;
    (async () => {
      if (document && document.visibilityState === "hidden") return; // don’t load when tab hidden
      if (!abort) await refresh();
    })();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      abort = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activePtrsId, refresh]);

  const value = useMemo(() => ({ tcpRecords, refresh }), [tcpRecords, refresh]);

  return <TcpContext.Provider value={value}>{children}</TcpContext.Provider>;
}

export function useTcpContext() {
  return useContext(TcpContext);
}

export default TcpContext;
