import { useState, useEffect } from "react";
import { listRuleSources } from "../services/rulesHistory.ptrsApi";

export default function useRuleSources(ptrsId, profileId) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ptrsId || !profileId) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await listRuleSources(ptrsId, profileId);
        setSources(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ptrsId, profileId]);

  return { sources, loading };
}
