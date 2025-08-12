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

  const fetchPtrs = useCallback(async () => {
    try {
      const user = userService.userValue;
      const result = await ptrsService.getAll({ clientId: user.clientId });
      console.log("Fetched ptrsDetails:", result);

      // Unwrap `{ status, data }` envelope while tolerating legacy bare-array responses
      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      if (rows.length > 0) {
        setPtrsDetails(rows);
        localStorage.setItem("ptrsDetails", JSON.stringify(rows));
      } else {
        setPtrsDetails([]);
        localStorage.removeItem("ptrsDetails");
      }
    } catch (err) {
      console.error("Error fetching ptrsDetails:", err);
      localStorage.removeItem("ptrsDetails");
    }
  }, []);

  // Load from localStorage once on mount
  useEffect(() => {
    const storedPtrs = localStorage.getItem("ptrsDetails");

    if (storedPtrs) {
      const parsed = JSON.parse(storedPtrs);
      setPtrsDetails(Array.isArray(parsed) ? parsed : parsed ? [parsed] : []);
    } else {
      fetchPtrs();
    }
  }, [fetchPtrs]);

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
        refreshPtrs,
      }}
    >
      {children}
    </PtrsContext.Provider>
  );
};
