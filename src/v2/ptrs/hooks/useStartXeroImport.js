import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { getXeroImportStatus, startXeroImport } from "../services/ptrsXero.api";

function statusUpper(d) {
  const s = d?.status || d?.state || d?.stage || "";
  return typeof s === "string" ? s.toUpperCase() : "";
}

function isCompleteStatus(s) {
  return ["COMPLETE", "COMPLETED", "DONE", "SUCCESS"].includes(s);
}

function looksLike429(err) {
  const msg = err?.message || err?.toString?.() || "";
  if (typeof msg !== "string") return false;
  return (
    msg.includes(" 429") ||
    msg.includes("429") ||
    msg.includes("Too Many Requests")
  );
}

export function useStartXeroImport(ptrsId, options = {}) {
  const enabled = Boolean(ptrsId);
  const backoffAttemptRef = useRef(0);

  const statusQuery = useQuery({
    queryKey: ["ptrs", "xeroImportStatus", ptrsId],
    queryFn: () => getXeroImportStatus(ptrsId),
    enabled: enabled && Boolean(options.poll),
    refetchInterval: (query) => {
      const data = query?.state?.data;
      const s = statusUpper(data);

      // Stop polling once complete
      if (isCompleteStatus(s)) return false;

      const base = options.refetchIntervalMs ?? 2000;

      // If we were rate-limited, back off (v1-style).
      if (looksLike429(query?.state?.error)) {
        backoffAttemptRef.current = Math.min(backoffAttemptRef.current + 1, 6);
        const ms = Math.min(30000, base * 2 ** backoffAttemptRef.current);
        return ms;
      }

      // Reset backoff on normal responses / other errors
      backoffAttemptRef.current = 0;
      return base;
    },
  });

  const startMutation = useMutation({
    mutationFn: (payload) => startXeroImport(ptrsId, payload),
  });

  return {
    // Start import
    startImport: (payload) => startMutation.mutateAsync(payload),
    isStarting: startMutation.isPending,

    // Status (from query)
    status: statusQuery.data,
    refetchStatus: () => statusQuery.refetch(),

    // Useful flags
    isStatusLoading: statusQuery.isFetching,
    statusError: statusQuery.error,
  };
}
