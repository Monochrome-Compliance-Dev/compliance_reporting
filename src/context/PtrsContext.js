import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ptrsService, userService } from "../services";

export const PtrsContext = createContext(null);

export const usePtrsContext = () => {
  const context = useContext(PtrsContext);
  if (!context) {
    throw new Error("usePtrsContext must be used within a PtrsProvider");
  }
  return context;
};

export const PtrsProvider = ({ children }) => {
  const [ptrsDetails, setPtrsDetails] = useState([]);
  const [activePtrsId, setActivePtrsId] = useState(null);

  // Persisted setter for active PTRS id
  const setActivePtrsIdPersist = useCallback((id) => {
    const next = id ?? null;
    setActivePtrsId(next);
    if (next) {
      localStorage.setItem("activePtrsId", next);
    } else {
      localStorage.removeItem("activePtrsId");
    }
  }, []);

  const fetchPtrs = useCallback(async () => {
    try {
      const user = userService.userValue;
      const result = await ptrsService.getAll({ clientId: user.clientId });
      // console.log("Fetched ptrsDetails:", result);

      // Unwrap `{ status, data }` envelope while tolerating legacy bare-array responses
      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      if (rows.length > 0) {
        setPtrsDetails(rows);
        localStorage.setItem("ptrsDetails", JSON.stringify(rows));

        // Ensure active PTRS id is valid and set
        const storedActive = localStorage.getItem("activePtrsId");
        const storedValid =
          storedActive && rows.some((r) => r?.id === storedActive)
            ? storedActive
            : null;
        const currentValid =
          activePtrsId && rows.some((r) => r?.id === activePtrsId)
            ? activePtrsId
            : null;
        const nextId = currentValid || storedValid || rows[0]?.id || null;
        setActivePtrsIdPersist(nextId);
      } else {
        setPtrsDetails([]);
        localStorage.removeItem("ptrsDetails");
        setActivePtrsIdPersist(null);
      }
    } catch (err) {
      console.error("Error fetching ptrsDetails:", err);
      localStorage.removeItem("ptrsDetails");
    }
  }, [activePtrsId, setActivePtrsIdPersist]);

  // Load from localStorage once on mount
  useEffect(() => {
    const storedPtrs = localStorage.getItem("ptrsDetails");

    if (storedPtrs) {
      const parsed = JSON.parse(storedPtrs);
      const rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      setPtrsDetails(rows);

      const storedActive = localStorage.getItem("activePtrsId");
      const initialId =
        storedActive && rows.some((r) => r?.id === storedActive)
          ? storedActive
          : rows[0]?.id || null;
      setActivePtrsIdPersist(initialId);
    } else {
      fetchPtrs();
    }
  }, [fetchPtrs, setActivePtrsIdPersist]);

  const refreshPtrs = useCallback(async () => {
    try {
      fetchPtrs();
    } catch (err) {
      console.error("Error refreshing ptrsDetails:", err);
      localStorage.removeItem("ptrsDetails");
    }
  }, [fetchPtrs]);

  return (
    <PtrsContext.Provider
      value={{
        ptrsDetails,
        activePtrsId,
        setActivePtrsId: setActivePtrsIdPersist,
        refreshPtrs,
      }}
    >
      {children}
    </PtrsContext.Provider>
  );
};
