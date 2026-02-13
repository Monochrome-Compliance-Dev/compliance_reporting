import { useState, useEffect } from "react";
import { getPtrsHistory } from "../services/rulesHistory.ptrsApi";

export default function useRuleExecutionHistory(ptrsId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ptrsId) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPtrsHistory(ptrsId);
        setHistory(data); // ← raw, unmodified
      } catch {
        setHistory(undefined); // ← FE can't normalise BE shape
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ptrsId]);

  return { history, loading };
}
