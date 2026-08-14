import { fetchWrapper } from "shared/utils";
import { pickData } from "../../services/ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const getPtrsHistory = () => [];

export const getPtrsHistoryStep = (ptrsId, stepId) =>
  fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/history/${stepId}`);

export const listRuleSources = async (ptrsId, profileId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");

  const query = new URLSearchParams();
  query.set("profileId", String(profileId));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/sources?${query.toString()}`,
  );

  const data = pickData(res);
  const rows = Array.isArray(data) ? data : [];

  const sourcesByPtrsId = new Map();

  rows.forEach((row) => {
    const sourcePtrsId = String(row?.ptrsId || "").trim();
    if (!sourcePtrsId) return;

    const definition =
      row?.definition &&
      typeof row.definition === "object" &&
      !Array.isArray(row.definition)
        ? row.definition
        : {};

    const rule = {
      id: row?.id || definition?.id || "",
      name:
        String(row?.name || definition?.label || "Unnamed rule").trim() ||
        "Unnamed rule",
      description: String(
        row?.description || definition?.description || "",
      ).trim(),
      scope: String(row?.scope || definition?.type || "row").trim(),
      groupName: String(definition?.groupName || "").trim(),
      definition,
      createdAt: row?.createdAt || null,
      updatedAt: row?.updatedAt || null,
    };

    const existing = sourcesByPtrsId.get(sourcePtrsId) || {
      ptrsId: sourcePtrsId,
      profileId: row?.profileId || profileId,
      rules: [],
      updatedAt: null,
    };

    existing.rules.push(rule);

    if (
      rule.updatedAt &&
      (!existing.updatedAt ||
        new Date(rule.updatedAt).getTime() >
          new Date(existing.updatedAt).getTime())
    ) {
      existing.updatedAt = rule.updatedAt;
    }

    sourcesByPtrsId.set(sourcePtrsId, existing);
  });

  return Array.from(sourcesByPtrsId.values())
    .map((source) => ({
      ...source,
      ruleCount: source.rules.length,
      groupCount: new Set(
        source.rules.map((rule) => rule.groupName).filter(Boolean),
      ).size,
      label: `PTRS ${source.ptrsId} — ${source.rules.length} rule${
        source.rules.length === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
};
