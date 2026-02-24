import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

/**
 * Joins + custom fields API (new-world).
 *
 * Backend contract:
 *   GET  /api/v2/ptrs/:ptrsId/joins  -> { joins: { conditions: [] }, customFields: [], profileId: string|null }
 *   PUT  /api/v2/ptrs/:ptrsId/joins  -> accepts same shape and persists to tbl_ptrs_column_map.joins/customFields
 *
 * No backwards-compatibility shims. Callers must send/receive the canonical shape.
 */

export const getPtrsJoins = async (ptrsId) => {
  if (!ptrsId) throw new Error("Missing ptrsId");

  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/joins`);

  // joins endpoints return the canonical shape directly (no envelope),
  // but we still use pickData to stay consistent with other API callers.
  return pickData(res) || res || {};
};

export const savePtrsJoins = async (
  ptrsId,
  { joins, customFields, profileId } = {},
) => {
  if (!ptrsId) throw new Error("Missing ptrsId");

  if (!joins || typeof joins !== "object" || !Array.isArray(joins.conditions)) {
    throw new Error("Invalid joins payload (expected { conditions: [] })");
  }
  if (!Array.isArray(customFields)) {
    throw new Error("Invalid customFields payload (expected array)");
  }

  const res = await fetchWrapper.put(`${API_ROOT}/v2/ptrs/${ptrsId}/joins`, {
    joins,
    customFields,
    profileId: profileId ?? null,
  });

  return pickData(res) || res || {};
};
