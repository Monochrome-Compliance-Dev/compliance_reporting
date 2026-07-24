// dataHubTrafficController.js
// Centralised controller for Data Hub FE cache invalidation & traffic coordination.
// This file is the ONLY place allowed to call queryClient.invalidateQueries for Data Hub.

import { queryClient } from "shared/utils";

const BATCH_WINDOW_MS = 75;

// Query key namespace (cache only, not a URL path).
const DATA_HUB_QUERY_KEY_ROOT = ["dataHub"];

function qk(segment, profileId, datasetId) {
  const key = [...DATA_HUB_QUERY_KEY_ROOT, segment, profileId || "none"];
  if (datasetId) key.push(datasetId);
  return key;
}

function globalQk(segment, id) {
  const key = [...DATA_HUB_QUERY_KEY_ROOT, segment];
  if (id) key.push(id);
  return key;
}

const queue = new Map();
let flushTimer = null;

function getQueueKey(profileId, datasetId) {
  return `${profileId || "none"}:${datasetId || "none"}`;
}

function enqueue(profileId, datasetId, event) {
  const key = getQueueKey(profileId, datasetId);

  if (!queue.has(key)) {
    queue.set(key, { profileId, datasetId, events: [] });
  }

  queue.get(key).events.push({ ...event, ts: Date.now() });

  if (!flushTimer) {
    flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
  }
}

function flush() {
  flushTimer = null;

  for (const item of queue.values()) {
    processEvents(item.profileId, item.datasetId, item.events);
  }

  queue.clear();
}

function invalidate(keysToInvalidate) {
  for (const key of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

function processEvents(profileId, datasetId, events) {
  const reasons = [...new Set(events.map((event) => event.reason))];
  const keysToInvalidate = new Set();

  for (const reason of reasons) {
    switch (reason) {
      case "dataset_created":
      case "dataset_uploaded":
      case "dataset_deleted":
        keysToInvalidate.add(qk("datasets", profileId));
        break;

      case "dataset_updated":
        keysToInvalidate.add(qk("datasets", profileId));
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        break;

      case "mapping_imported":
      case "mapping_updated":
        keysToInvalidate.add(qk("datasets", profileId));
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("map", profileId, datasetId));
        break;

      case "dataset_published":
      case "map_published":
        keysToInvalidate.add(qk("datasets", profileId));
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("map", profileId, datasetId));
        break;

      default:
        break;
    }
  }

  invalidate(keysToInvalidate);
}

function processGlobalEvents(events) {
  const reasons = [...new Set(events.map((event) => event.reason))];
  const keysToInvalidate = new Set();

  for (const reason of reasons) {
    switch (reason) {
      case "schema_definition_created":
      case "schema_definition_updated":
      case "schema_definition_approved":
      case "schema_definition_version_created":
      case "schema_definition_deprecated":
        keysToInvalidate.add(globalQk("schemaDefinitions"));

        for (const event of events) {
          if (event.schemaDefinitionId) {
            keysToInvalidate.add(
              globalQk("schemaDefinition", event.schemaDefinitionId),
            );
          }
        }
        break;

      default:
        break;
    }
  }

  invalidate(keysToInvalidate);
}

export const dataHubTraffic = {
  emit(profileId, datasetId, event) {
    if (!profileId || !event?.reason) return;
    enqueue(profileId, datasetId, event);
  },
  emitGlobal(event) {
    if (!event?.reason) return;
    processGlobalEvents([{ ...event, ts: Date.now() }]);
  },
};

export default dataHubTraffic;
