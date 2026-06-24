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
      case "dataset_deleted":
        keysToInvalidate.add(qk("datasets", profileId));
        break;

      case "dataset_updated":
        keysToInvalidate.add(qk("datasets", profileId));
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("status", profileId, datasetId));
        break;

      case "uploaded_dataset_created":
      case "uploaded_dataset_deleted":
      case "uploaded_dataset_updated":
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("uploadedDatasets", profileId, datasetId));
        keysToInvalidate.add(qk("status", profileId, datasetId));
        keysToInvalidate.add(qk("sample", profileId, datasetId));
        break;

      case "mapping_updated":
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("uploadedDatasets", profileId, datasetId));
        keysToInvalidate.add(qk("sample", profileId, datasetId));
        keysToInvalidate.add(qk("status", profileId, datasetId));
        break;

      case "dataset_published":
        keysToInvalidate.add(qk("datasets", profileId));
        keysToInvalidate.add(qk("dataset", profileId, datasetId));
        keysToInvalidate.add(qk("uploadedDatasets", profileId, datasetId));
        keysToInvalidate.add(qk("status", profileId, datasetId));
        break;

      case "status_updated":
        keysToInvalidate.add(qk("status", profileId, datasetId));
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
};

export default dataHubTraffic;
