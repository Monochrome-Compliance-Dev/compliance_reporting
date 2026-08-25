// ptrsTrafficController.js
// Centralised controller for PTRS FE cache invalidation & traffic coordination
// This file is the ONLY place allowed to call queryClient.invalidateQueries

import { queryClient } from "shared/utils";

// Small debounce window to batch rapid-fire events
const BATCH_WINDOW_MS = 75;

// Query key namespace (cache only, not a URL path).
// Centralise it so we don't scatter cache keys across the codebase.
const PTRS_QUERY_KEY_ROOT = ["ptrs"];

function qk(segment, ptrsId) {
  return [...PTRS_QUERY_KEY_ROOT, segment, ptrsId];
}

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
        keysToInvalidate.add(qk("data", ptrsId));
        break;

      case "datasets_uploaded":
        // Uploading datasets affects the uploaded dataset list, unified sample headers/examples,
        // and any downstream mapping/state derived from the upload.
        keysToInvalidate.add(qk("data", ptrsId));
        keysToInvalidate.add(qk("map", ptrsId));
        keysToInvalidate.add(qk("datasets", ptrsId));
        // Prefix invalidation for any unified sample variants (limit/offset)
        keysToInvalidate.add(["ptrs", "sample", ptrsId]);
        break;

      case "joins_updated":
        keysToInvalidate.add(qk("joins", ptrsId));
        // Joins can change which headers/examples are relevant for mapping.
        // Prefix invalidation for any unified sample variants (limit/offset)
        keysToInvalidate.add(["ptrs", "sample", ptrsId]);
        break;

      case "ptrs_updated":
        // "ptrs_updated" is intentionally narrow: only PTRS record fields changed.
        // Downstream invalidations must be triggered by more specific reasons.
        keysToInvalidate.add(qk("data", ptrsId));
        break;

      case "map_built":
        // No explicit stagePreview key exists in usePtrsQueries.js today.
        keysToInvalidate.add(qk("map", ptrsId));
        keysToInvalidate.add(qk("stage", ptrsId));
        break;

      case "exclusions_applied":
        // Exclusions changes which rows are eligible for downstream steps.
        keysToInvalidate.add(qk("stage", ptrsId));
        keysToInvalidate.add(qk("sbi", ptrsId));
        keysToInvalidate.add(qk("validate", ptrsId));
        keysToInvalidate.add(qk("metrics", ptrsId));
        keysToInvalidate.add(qk("report", ptrsId));
        break;

      case "transformations_ran":
        keysToInvalidate.add(qk("stage", ptrsId));
        keysToInvalidate.add(qk("exclusions", ptrsId));
        keysToInvalidate.add(qk("sbi", ptrsId));
        keysToInvalidate.add(qk("validate", ptrsId));
        keysToInvalidate.add(qk("metrics", ptrsId));
        keysToInvalidate.add(qk("report", ptrsId));
        break;

      case "sbi_imported":
        // Preserve existing behaviour from usePtrsQueries.js.
        keysToInvalidate.add(qk("sbi", ptrsId));
        keysToInvalidate.add(qk("stage", ptrsId));
        keysToInvalidate.add(qk("validate", ptrsId));
        break;

      case "validate_ran":
        keysToInvalidate.add(qk("validate", ptrsId));
        break;

      case "metrics_draft_updated":
        keysToInvalidate.add(qk("metrics", ptrsId));
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
