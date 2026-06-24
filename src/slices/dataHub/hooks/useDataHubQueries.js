// Centralised Data Hub queries & mutations.
// Mirrors the PTRS hook pattern: dhApi handles API calls/normalisation;
// hooks handle query keys, cache behaviour and mutation orchestration.

import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "../services/dhApi";
import dataHubTraffic from "./dataHubTrafficController";

const K = {
  datasets: ({ profileId }) => ["dataHub", "datasets", profileId || "none"],
  dataset: ({ profileId, id }) => [
    "dataHub",
    "dataset",
    profileId || "none",
    id || "none",
  ],
  sample: ({ profileId, id }) => [
    "dataHub",
    "sample",
    profileId || "none",
    id || "none",
  ],
};

export function useDataHubDatasetsQuery(profileId, { enabled = true } = {}) {
  const queryEnabled = !!profileId && enabled;

  return useQuery({
    queryKey: K.datasets({ profileId }),
    queryFn: async () => api.listDataHubDatasets({ profileId }),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useDataHubDatasetQuery(id, profileId, { enabled = true } = {}) {
  const queryEnabled = !!id && !!profileId && enabled;

  return useQuery({
    queryKey: K.dataset({ profileId, id }),
    queryFn: async () => api.getDataHubDataset(id),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useDatasetSampleQuery(id, profileId, { enabled = true } = {}) {
  const queryEnabled = !!id && !!profileId && enabled;

  return useQuery({
    queryKey: K.sample({ profileId, id }),
    queryFn: async () => api.getDatasetSample(id),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateDataHubDatasetMutation(profileId) {
  return useMutation({
    mutationFn: (payload) =>
      api.createDataHubDataset({
        ...payload,
        profileId: payload?.profileId || profileId,
      }),
    onSuccess: (dataset) => {
      dataHubTraffic.emit(dataset?.profileId || profileId, dataset?.id, {
        reason: "dataset_created",
      });
    },
  });
}

export function useDeleteDataHubDatasetMutation(profileId) {
  return useMutation({
    mutationFn: (id) => api.deleteDataHubDataset(id),
    onSuccess: (_, id) => {
      dataHubTraffic.emit(profileId, id, {
        reason: "dataset_deleted",
      });
    },
  });
}

export const dataHubQueryKeys = K;
