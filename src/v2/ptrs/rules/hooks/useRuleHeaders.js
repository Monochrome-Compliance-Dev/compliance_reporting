import { useState, useEffect } from "react";
import { getStagePreview } from "v2/ptrs/services/stage.ptrsApi";

const toSnake = (s) =>
  !s
    ? s
    : String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s\-]+/g, "_")
        .toLowerCase();

const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

const deriveHeadersFromMap = (map) => {
  if (!map || !map.mappings) return [];
  const fields = Object.values(map.mappings || {}).map((m) => m && m.field);
  return uniq(fields.map(toSnake));
};

export default function useRuleHeaders(ptrsId, ptrsMap) {
  const [headers, setHeaders] = useState([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!ptrsId && !ptrsMap) return;

      setIsLoadingHeaders(true);

      const seed = deriveHeadersFromMap(ptrsMap);
      if (!cancelled && seed.length) {
        setHeaders(seed);
      }

      if (!ptrsId) {
        setIsLoadingHeaders(false);
        return;
      }

      try {
        const prev = await getStagePreview(ptrsId, { limit: 1 });
        if (cancelled) return;
        const fromSrv = Array.isArray(prev?.headers) ? prev.headers : [];
        const combined = fromSrv.length ? fromSrv : seed;
        if (combined.length) {
          setHeaders(uniq(combined));
        }
      } catch (e) {
        if (!cancelled && seed.length) {
          setHeaders(seed);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHeaders(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [ptrsId, ptrsMap]);

  return { headers, isLoadingHeaders };
}
