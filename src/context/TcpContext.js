import { createContext, useContext, useState, useEffect } from "react";
import { tcpService } from "../services";
import { useReportContext } from "./ReportContext";

const TcpContext = createContext();

export const TcpProvider = ({ children }) => {
  const { reportDetails } = useReportContext();
  const selectedReport = reportDetails?.[0] || null;
  const [tcpRecords, setTcpRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Utility functions for sessionStorage caching
  const storageKey = (reportId) => `tcp_records_${reportId}`;

  const cacheRecords = (records) => {
    if (!selectedReport?.id) return;
    sessionStorage.setItem(
      storageKey(selectedReport.id),
      JSON.stringify(records)
    );
  };

  const loadCachedRecords = () => {
    if (!selectedReport?.id) return null;
    const key = storageKey(selectedReport.id);
    const raw = sessionStorage.getItem(key);
    console.log("Cached data found for", key, raw);
    return raw ? JSON.parse(raw) : null;
  };

  const pruneOldCaches = () => {
    const currentKey = storageKey(selectedReport.id);
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
      if (!selectedReport?.id) return;

      pruneOldCaches();

      const cached = loadCachedRecords();
      console.log("Checking cached records for reportId:", selectedReport?.id);
      if (Array.isArray(cached) && cached.length > 0) {
        console.log("Using cached TCP records");
        setTcpRecords(cached);
        return;
      }

      setIsLoading(true);
      try {
        const records = await tcpService.getAll(selectedReport.id);
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
  }, [selectedReport?.id]);

  return (
    <TcpContext.Provider
      value={{ tcpRecords, setTcpRecords, updateTcpRecord, isLoading }}
    >
      {children}
    </TcpContext.Provider>
  );
};

export const useTcp = () => useContext(TcpContext);
