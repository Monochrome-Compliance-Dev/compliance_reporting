import { useEffect, useState } from "react";

import { listRuleSources } from "../services/rulesHistory.ptrsApi";

export default function useRuleSources(ptrsId, profileId) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ptrsId || !profileId) {
      setSources([]);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const data = await listRuleSources(ptrsId, profileId);

        if (!cancelled) {
          setSources(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setSources([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [ptrsId, profileId]);

  return { sources, loading };
}
