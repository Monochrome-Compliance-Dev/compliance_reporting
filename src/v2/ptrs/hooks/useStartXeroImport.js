import { useMutation, useQuery } from "@tanstack/react-query";
import { getXeroImportStatus, startXeroImport } from "../services/ptrsXero.api";

/**
 * Starts Xero ingestion for a PTRS run and provides status polling while it is running.
 *
 * Contract expectation (BE):
 * - start endpoint returns an envelope or a plain object; this service normalises it.
 * - status endpoint returns current state so the UI can poll.
 */
export function useStartXeroImport(ptrsId, options = {}) {
  const enabled = Boolean(ptrsId);

  const statusQuery = useQuery({
    queryKey: ["ptrs", "xeroImportStatus", ptrsId],
    queryFn: () => getXeroImportStatus(ptrsId),
    enabled: enabled && Boolean(options.poll),
    refetchInterval: options.refetchIntervalMs ?? 2000,
  });

  const mutation = useMutation({
    mutationFn: (payload = {}) => startXeroImport(ptrsId, payload),
  });

  return {
    startImport: mutation.mutateAsync,
    isStarting: mutation.isPending,
    startError: mutation.error,
    startResult: mutation.data,
    status: statusQuery.data,
    isStatusLoading: statusQuery.isLoading,
    statusError: statusQuery.error,
    refetchStatus: statusQuery.refetch,
  };
}
