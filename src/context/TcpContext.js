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

// Helpers for tolerant cache restore
function readJsonArray(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function tryCachedRecords(id) {
  if (!id) return null;
  const legacyKey = `tcp_records_${id}`; // legacy Data Review key
  const camelKey = `tcpRecords_${id}`; // newer camel key
  // Prefer sessionStorage first, then localStorage
  return (
    readJsonArray(sessionStorage, legacyKey) ||
    readJsonArray(sessionStorage, camelKey) ||
    readJsonArray(localStorage, legacyKey) ||
    readJsonArray(localStorage, camelKey) ||
    null
  );
}

export function TcpProvider({ children }) {
  const { activePtrsId } = usePtrsContext();
  const [tcpRecords, setTcpRecords] = useState([]);

  // Expose a refresh function encapsulating the fetch/cache logic
  const refresh = useCallback(async () => {
    if (!activePtrsId) {
      setTcpRecords([]);
      return;
    }

    const cached = tryCachedRecords(activePtrsId);
    if (cached) {
      setTcpRecords(cached);
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
      if (!cancelled) {
        setTcpRecords(rows);
        try {
          sessionStorage.setItem(
            `tcp_records_${activePtrsId}`,
            JSON.stringify(rows)
          );
        } catch {}
      }
    } catch {
      if (!cancelled) setTcpRecords([]);
    }
  }, [activePtrsId]);

  // Restore tcpRecords from tolerant cache or API when the active PTRS id changes
  useEffect(() => {
    (async () => {
      await refresh();
    })();
    // No cleanup needed since 'cancelled' is not used
  }, [activePtrsId, refresh]);

  const value = useMemo(() => ({ tcpRecords, refresh }), [tcpRecords, refresh]);

  return <TcpContext.Provider value={value}>{children}</TcpContext.Provider>;
}

export function useTcpContext() {
  return useContext(TcpContext);
}

export default TcpContext;
