// ptrsTrafficController.js
// Centralised controller for PTRS FE cache invalidation & traffic coordination
// This file is the ONLY place allowed to call queryClient.invalidateQueries

import { queryClient } from "lib/utils/queryClient";

// Small debounce window to batch rapid-fire events
const BATCH_WINDOW_MS = 75;

// In-memory queue keyed by ptrsId
const queue = new Map();
let flushTimer = null;

// ---- Helpers ---------------------------------------------------------------

function enqueue(ptrsId, event) {
  if (!queue.has(ptrsId)) {
    queue.set(ptrsId, []);
  }
  queue.get(ptrsId).push({ ...event, ts: Date.now() });

  if (!flushTimer) {
    flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
  }
}

function flush() {
  flushTimer = null;

  for (const [ptrsId, events] of queue.entries()) {
    processEvents(ptrsId, events);
  }

  queue.clear();
}

// ---- Core decision logic ----------------------------------------------------

function processEvents(ptrsId, events) {
  // Deduplicate by reason
  const reasons = [...new Set(events.map((e) => e.reason))];

  // TODO: Wire in real step awareness (from store / route / ptrs record)
  // For now we stay conservative and minimal

  const keysToInvalidate = new Set();

  for (const reason of reasons) {
    switch (reason) {
      case "ptrs_created":
        keysToInvalidate.add(["ptrs", "v2", "data", ptrsId]);
        break;

      case "datasets_uploaded":
        // Preserve existing behaviour from usePtrsQueries.js:
        // uploading datasets currently invalidates both PTRS data + map.
        keysToInvalidate.add(["ptrs", "v2", "data", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "map", ptrsId]);
        break;

      case "ptrs_updated":
        // Preserve existing behaviour from usePtrsQueries.js:
        // updatePtrs currently invalidates data + stage + map.
        keysToInvalidate.add(["ptrs", "v2", "data", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "stage", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "map", ptrsId]);
        break;

      case "map_built":
        // No explicit stagePreview key exists in usePtrsQueries.js today.
        keysToInvalidate.add(["ptrs", "v2", "map", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "stage", ptrsId]);
        break;

      case "sbi_imported":
        // Preserve existing behaviour from usePtrsQueries.js.
        keysToInvalidate.add(["ptrs", "v2", "sbi", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "stage", ptrsId]);
        keysToInvalidate.add(["ptrs", "v2", "validate", ptrsId]);
        break;

      case "validate_ran":
        keysToInvalidate.add(["ptrs", "v2", "validate", ptrsId]);
        break;

      case "metrics_draft_updated":
        keysToInvalidate.add(["ptrs", "v2", "metrics", ptrsId]);
        break;

      default:
        // Unknown events are ignored by design
        break;
    }
  }

  // Execute invalidations in a single batch
  for (const key of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

// ---- Public API -------------------------------------------------------------

export const ptrsTraffic = {
  emit(ptrsId, event) {
    if (!ptrsId || !event?.reason) return;
    enqueue(ptrsId, event);
  },
};

export default ptrsTraffic;
