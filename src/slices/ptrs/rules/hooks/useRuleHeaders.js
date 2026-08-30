import { useMemo } from "react";
import { useStagePreviewQuery } from "slices/ptrs/hooks/usePtrsQueries";

const toSnake = (s) =>
  !s
    ? s
    : String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();

const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

const deriveHeadersFromMap = (map) => {
  if (!map || !map.mappings) return [];
  const fields = Object.values(map.mappings || {}).map((m) => m && m.field);
  return uniq(fields.map(toSnake));
};

export default function useRuleHeaders(ptrsId, ptrsMap) {
  const stagePreviewQuery = useStagePreviewQuery(ptrsId, {
    limit: 1,
    enabled: !!ptrsId,
  });
  const seed = useMemo(() => deriveHeadersFromMap(ptrsMap), [ptrsMap]);
  const headers = useMemo(() => {
    const fromStage = Array.isArray(stagePreviewQuery.data?.headers)
      ? stagePreviewQuery.data.headers
      : [];
    return uniq(fromStage.length ? fromStage : seed);
  }, [seed, stagePreviewQuery.data?.headers]);

  return {
    headers,
    isLoadingHeaders: stagePreviewQuery.isLoading,
  };
}
