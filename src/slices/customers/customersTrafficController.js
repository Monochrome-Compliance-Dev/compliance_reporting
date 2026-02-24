// customersTrafficController.js
// Centralised controller for Customers FE cache invalidation & traffic coordination
// This file is the ONLY place allowed to call queryClient.invalidateQueries

import { queryClient } from "shared/utils";

// Small debounce window to batch rapid-fire events
const BATCH_WINDOW_MS = 75;

// Query key namespace (cache only, not a URL path).
const CUSTOMER_QUERY_KEY_ROOT = ["customers"];

function qk(segment, customerId) {
  return customerId
    ? [...CUSTOMER_QUERY_KEY_ROOT, segment, customerId]
    : [...CUSTOMER_QUERY_KEY_ROOT, segment];
}

// In-memory queue keyed by customerId (or "_global" when none is provided)
const queue = new Map();
let flushTimer = null;

function enqueue(customerId, event) {
  const key = customerId || "_global";

  if (!queue.has(key)) {
    queue.set(key, []);
  }

  queue.get(key).push({ ...event, ts: Date.now() });

  if (!flushTimer) {
    flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
  }
}

function flush() {
  flushTimer = null;

  for (const [key, events] of queue.entries()) {
    const customerId = key === "_global" ? null : key;
    processEvents(customerId, events);
  }

  queue.clear();
}

function processEvents(customerId, events) {
  const reasons = [...new Set(events.map((e) => e.reason))];

  const keysToInvalidate = new Set();

  for (const reason of reasons) {
    switch (reason) {
      case "customer_created":
      case "customer_updated":
      case "customer_deleted":
        // Conservative: anything that changes customer data impacts lists + access views.
        keysToInvalidate.add(qk("all"));
        keysToInvalidate.add(qk("byAccess"));
        if (customerId) keysToInvalidate.add(qk("byId", customerId));
        break;

      case "customer_context_changed":
        // "Acting as" / accessible customers should refresh.
        keysToInvalidate.add(qk("byAccess"));
        break;

      default:
        // Unknown events are ignored by design
        break;
    }
  }

  for (const key of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export const customersTraffic = {
  emit(customerId, event) {
    if (!event?.reason) return;
    enqueue(customerId, event);
  },
};

export default customersTraffic;
