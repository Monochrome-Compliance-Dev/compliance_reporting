import { createContext, useContext, useState, useEffect } from "react";
import { tcpService } from "../services";
import { usePtrsContext } from "./PtrsContext";

const TcpContext = createContext();

export const TcpProvider = ({ children }) => {
  const { ptrsDetails } = usePtrsContext();
  const selectedPtrs = ptrsDetails?.[0] || null;
  const [tcpRecords, setTcpRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Utility functions for sessionStorage caching
  const storageKey = (ptrsId) => `tcp_records_${ptrsId}`;

  const cacheRecords = (records) => {
    if (!selectedPtrs?.id) return;
    sessionStorage.setItem(
      storageKey(selectedPtrs.id),
      JSON.stringify(records)
    );
  };

  const loadCachedRecords = () => {
    if (!selectedPtrs?.id) return null;
    const key = storageKey(selectedPtrs.id);
    const raw = sessionStorage.getItem(key);
    console.log("Cached data found for", key, raw);
    return raw ? JSON.parse(raw) : null;
  };

  const pruneOldCaches = () => {
    const currentKey = storageKey(selectedPtrs.id);
    console.log("Pruning sessionStorage. Keeping:", currentKey);
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith("tcp_records_") && k !== currentKey) {
        sessionStorage.removeItem(k);
      }
    });
  };

  const updateTcpRecord = async (id, data) => {
    try {
      await tcpService.update(id, data);
      setTcpRecords((prev) => {
        const updated = prev.map((rec) =>
          rec.id === id ? { ...rec, ...data } : rec
        );
        cacheRecords(updated);
        return updated;
      });
    } catch (error) {
      console.error("Failed to update TCP record", error);
    }
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!selectedPtrs?.id) return;

      pruneOldCaches();

      const cached = loadCachedRecords();
      console.log("Checking cached records for ptrsId:", selectedPtrs?.id);
      if (Array.isArray(cached) && cached.length > 0) {
        console.log("Using cached TCP records");
        setTcpRecords(cached);
        return;
      }

      setIsLoading(true);
      try {
        const records = await tcpService.getAll(selectedPtrs.id);
        console.log("Fetched TCP records:", records);
        setTcpRecords(records);
        cacheRecords(records);
      } catch (err) {
        console.error("Failed to fetch TCP records", err);
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, [selectedPtrs?.id]);

  return (
    <TcpContext.Provider
      value={{ tcpRecords, setTcpRecords, updateTcpRecord, isLoading }}
    >
      {children}
    </TcpContext.Provider>
  );
};

export const useTcp = () => useContext(TcpContext);
