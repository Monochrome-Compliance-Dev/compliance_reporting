import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAlert } from "context";
import * as api from "../services/schemaDefinitionsApi";
import dataHubTraffic from "./dataHubTrafficController";

const K = {
  list: ({ datasetType, status, schemaKey } = {}) => [
    "dataHub",
    "schemaDefinitions",
    datasetType || "all",
    status || "all",
    schemaKey || "all",
  ],
  detail: (id) => ["dataHub", "schemaDefinition", id || "none"],
};

export function useSchemaDefinitionsQuery(
  params = {},
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: K.list(params),
    queryFn: () => api.listSchemaDefinitions(params),
    enabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSchemaDefinitionQuery(id, { enabled = true } = {}) {
  const queryEnabled = !!id && enabled;

  return useQuery({
    queryKey: K.detail(id),
    queryFn: () => api.getSchemaDefinition(id),
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSchemaDefinitionActions() {
  const { showAlert } = useAlert();
  const [selectedSchemaDefinitionId, setSelectedSchemaDefinitionId] =
    useState(null);

  const emitSchemaDefinitionChanged = useCallback(
    (reason, schemaDefinitionId) => {
      dataHubTraffic.emitGlobal({ reason, schemaDefinitionId });
    },
    [],
  );

  const createMutation = useMutation({
    mutationFn: api.createSchemaDefinition,
    onSuccess: async (schemaDefinition) => {
      setSelectedSchemaDefinitionId(schemaDefinition?.id || null);
      emitSchemaDefinitionChanged(
        "schema_definition_created",
        schemaDefinition?.id,
      );
      showAlert("Schema Definition created.", "success");
    },
    onError: (err) => {
      showAlert(
        err?.message || "Schema Definition could not be created.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, definition }) =>
      api.updateSchemaDefinition(id, definition),
    onSuccess: async (schemaDefinition) => {
      emitSchemaDefinitionChanged(
        "schema_definition_updated",
        schemaDefinition?.id,
      );
      showAlert("Schema Definition updated.", "success");
    },
    onError: (err) => {
      showAlert(
        err?.message || "Schema Definition could not be updated.",
        "error",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: api.approveSchemaDefinition,
    onSuccess: async (schemaDefinition) => {
      emitSchemaDefinitionChanged(
        "schema_definition_approved",
        schemaDefinition?.id,
      );
      showAlert("Schema Definition approved.", "success");
    },
    onError: (err) => {
      showAlert(
        err?.message || "Schema Definition could not be approved.",
        "error",
      );
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: api.createSchemaDefinitionVersion,
    onSuccess: async (schemaDefinition) => {
      setSelectedSchemaDefinitionId(schemaDefinition?.id || null);
      emitSchemaDefinitionChanged(
        "schema_definition_version_created",
        schemaDefinition?.id,
      );
      showAlert("New Schema Definition version created.", "success");
    },
    onError: (err) => {
      showAlert(
        err?.message || "New Schema Definition version could not be created.",
        "error",
      );
    },
  });

  const deprecateMutation = useMutation({
    mutationFn: api.deprecateSchemaDefinition,
    onSuccess: async (schemaDefinition) => {
      emitSchemaDefinitionChanged(
        "schema_definition_deprecated",
        schemaDefinition?.id,
      );
      showAlert("Schema Definition deprecated.", "success");
    },
    onError: (err) => {
      showAlert(
        err?.message || "Schema Definition could not be deprecated.",
        "error",
      );
    },
  });

  return {
    selectedSchemaDefinitionId,
    setSelectedSchemaDefinitionId,
    createSchemaDefinition: createMutation.mutateAsync,
    updateSchemaDefinition: updateMutation.mutateAsync,
    approveSchemaDefinition: approveMutation.mutateAsync,
    createSchemaDefinitionVersion: createVersionMutation.mutateAsync,
    deprecateSchemaDefinition: deprecateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isCreatingVersion: createVersionMutation.isPending,
    isDeprecating: deprecateMutation.isPending,
  };
}

export const schemaDefinitionQueryKeys = K;
