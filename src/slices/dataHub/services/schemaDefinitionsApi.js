import { fetchWrapper } from "shared/utils";
import { API_ROOT, pickData } from "./dhApi";

export const normaliseSchemaDefinition = (x = {}) => ({
  ...x,
  id: x.id || null,
  schemaKey: x.schemaKey || null,
  name: x.name || null,
  datasetType: x.datasetType || null,
  version: Number(x.version || 1),
  status: x.status || "Draft",
  description: x.description || null,
  fields: Array.isArray(x.fields)
    ? x.fields
    : Array.isArray(x.definition?.fields)
      ? x.definition.fields
      : [],
  definition: x.definition || null,
  createdAt: x.createdAt || null,
  updatedAt: x.updatedAt || null,
});

export const normaliseSchemaDefinitionList = (arr = []) =>
  arr.map(normaliseSchemaDefinition);

function pickSchemaDefinition(res) {
  const data = pickData(res);
  return data.schemaDefinition || data;
}

export const listSchemaDefinitions = async (params = {}) => {
  const search = new URLSearchParams();

  if (params.datasetType) search.set("datasetType", params.datasetType);
  if (params.status) search.set("status", params.status);
  if (params.schemaKey) search.set("schemaKey", params.schemaKey);

  const suffix = search.toString() ? `?${search.toString()}` : "";

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/source-onboarding/schema-definitions${suffix}`,
  );

  const data = pickData(res);
  const items = Array.isArray(data)
    ? data
    : data.schemaDefinitions || data.items || [];

  return { items: normaliseSchemaDefinitionList(items) };
};

export const getSchemaDefinition = async (id) => {
  if (!id) throw new Error("id is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/source-onboarding/schema-definitions/${encodeURIComponent(id)}`,
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};

export const createSchemaDefinition = async (definition) => {
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/source-onboarding/schema-definitions`,
    definition,
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};

export const updateSchemaDefinition = async (id, definition) => {
  if (!id) throw new Error("id is required");

  const res = await fetchWrapper.put(
    `${API_ROOT}/v2/source-onboarding/schema-definitions/${encodeURIComponent(id)}`,
    definition,
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};

export const approveSchemaDefinition = async (id) => {
  if (!id) throw new Error("id is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/source-onboarding/schema-definitions/${encodeURIComponent(id)}/approve`,
    {},
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};

export const createSchemaDefinitionVersion = async (id) => {
  if (!id) throw new Error("id is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/source-onboarding/schema-definitions/${encodeURIComponent(id)}/new-version`,
    {},
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};

export const deprecateSchemaDefinition = async (id) => {
  if (!id) throw new Error("id is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/source-onboarding/schema-definitions/${encodeURIComponent(id)}/deprecate`,
    {},
  );

  return normaliseSchemaDefinition(pickSchemaDefinition(res));
};
