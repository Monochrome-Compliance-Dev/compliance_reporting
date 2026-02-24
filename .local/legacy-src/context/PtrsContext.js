import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ptrsService, userService } from "services";
import { useAlert } from "./AlertContext";
import { onCustomerChange } from "lib/utils/";

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

  const { showAlert } = useAlert();

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

      const canUsePTRS =
        typeof userService.hasFeature === "function"
          ? userService.hasFeature("ptrs")
          : Array.isArray(user?.entitlements) &&
            user.entitlements.includes("ptrs");

      if (!canUsePTRS) {
        // Clear any cached data and active selection; inform the user
        setPtrsDetails([]);
        localStorage.removeItem("ptrsDetails");
        setActivePtrsIdPersist(null);
        showAlert(
          "This customer doesn’t have PTRS enabled. Select a different customer or return to your default.",
          "warning"
        );
        return;
      }

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
  }, [activePtrsId, setActivePtrsIdPersist, showAlert]);

  // Load from localStorage once on mount
  useEffect(() => {
    // Skip loading/fetching if the effective tenant lacks PTRS
    const user = userService.userValue;
    const canUsePTRS =
      typeof userService.hasFeature === "function"
        ? userService.hasFeature("ptrs")
        : Array.isArray(user?.entitlements) &&
          user.entitlements.includes("ptrs");
    if (!canUsePTRS) {
      setPtrsDetails([]);
      localStorage.removeItem("ptrsDetails");
      setActivePtrsIdPersist(null);
      return;
    }

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

  useEffect(() => {
    // Re-evaluate PTRS data whenever the acting tenant changes
    const unsubscribe = onCustomerChange?.(() => {
      fetchPtrs();
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
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
        activePtrsId,
        setActivePtrsId: setActivePtrsIdPersist,
        refreshPtrs,
      }}
    >
      {children}
    </PtrsContext.Provider>
  );
};
