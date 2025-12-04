import { useState, useEffect } from "react";

export default function useRuleHeaders(ptrsId, ptrsMap) {
  const [headers, setHeaders] = useState([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);

  useEffect(() => {
    if (!ptrsId || !ptrsMap) return;

    setIsLoadingHeaders(true);
    const mapped = Object.keys(ptrsMap || {});
    setHeaders(mapped);
    setIsLoadingHeaders(false);
  }, [ptrsId, ptrsMap]);

  return { headers, isLoadingHeaders };
}
