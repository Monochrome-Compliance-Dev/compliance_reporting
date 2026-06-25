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
  map: ({ profileId, id }) => [
    "dataHub",
    "map",
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
    queryFn: async () => api.getDataHubDataset(id, { profileId }),
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
    queryFn: async () => api.getDatasetSample(id, { profileId }),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useUploadDataHubDatasetMutation(profileId) {
  return useMutation({
    mutationFn: (payload) =>
      api.uploadDataHubDataset({
        ...payload,
        profileId: payload?.profileId || profileId,
      }),
    onSuccess: (dataset) => {
      dataHubTraffic.emit(dataset?.profileId || profileId, dataset?.id, {
        reason: "dataset_uploaded",
      });
    },
  });
}

export function useDataHubDatasetMapQuery(
  id,
  profileId,
  { enabled = true } = {},
) {
  const queryEnabled = !!id && !!profileId && enabled;

  return useQuery({
    queryKey: K.map({ profileId, id }),
    queryFn: async () => api.getDataHubDatasetMap(id, { profileId }),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useUpdateDataHubDatasetMapMutation(id, profileId) {
  return useMutation({
    mutationFn: (payload) =>
      api.updateDataHubDatasetMap({
        ...payload,
        id: payload?.id || id,
        profileId: payload?.profileId || profileId,
      }),
    onSuccess: (datasetMap, payload) => {
      dataHubTraffic.emit(
        datasetMap?.profileId || payload?.profileId || profileId,
        datasetMap?.datasetId || datasetMap?.id || payload?.id || id,
        {
          reason: "mapping_updated",
        },
      );
    },
  });
}

export function usePublishDataHubDatasetMutation(id, profileId) {
  return useMutation({
    mutationFn: (payload = {}) =>
      api.publishDataHubDataset({
        ...payload,
        id: payload?.id || id,
        profileId: payload?.profileId || profileId,
      }),
    onSuccess: (result, payload) => {
      dataHubTraffic.emit(
        result?.profileId || payload?.profileId || profileId,
        result?.datasetId || payload?.id || id,
        {
          reason: "dataset_published",
        },
      );
    },
  });
}

export function useDeleteDataHubDatasetMutation(profileId) {
  return useMutation({
    mutationFn: (id) => api.deleteDataHubDataset(id, { profileId }),
    onSuccess: (_, id) => {
      dataHubTraffic.emit(profileId, id, {
        reason: "dataset_deleted",
      });
    },
  });
}

export const dataHubQueryKeys = K;
