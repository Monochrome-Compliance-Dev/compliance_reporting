import { useMemo } from "react";
import { useMatches, useNavigate } from "react-router";
import { useDataHubContext } from "../context/DataHubContext";

function splitPathAndQuery(target) {
  const raw = String(target || "");
  const idx = raw.indexOf("?");
  if (idx === -1) return { path: raw, query: "" };
  return { path: raw.slice(0, idx), query: raw.slice(idx + 1) };
}

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  if (!p) return b;
  return `${b}/${p}`;
}

export function useDataHubNavigation() {
  const navigate = useNavigate();
  const matches = useMatches();
  const { selectedDatasetId, selectedProfileId } = useDataHubContext();

  const dataHubBase = useMemo(() => {
    const match = matches.find((x) => x?.route?.id === "dataHubRoot");

    const base =
      match && typeof match === "object" && "pathnameBase" in match
        ? match.pathnameBase
        : match?.pathname;

    return base || "/app/data-hub";
  }, [matches]);

  function goTo(
    target,
    { replace = false, includeDatasetId = true, includeProfileId = true } = {},
  ) {
    const { path, query } = splitPathAndQuery(target);

    const qs = new URLSearchParams(query);
    if (includeDatasetId && selectedDatasetId && !qs.has("datasetId")) {
      qs.set("datasetId", selectedDatasetId);
    }
    if (includeProfileId && selectedProfileId && !qs.has("profileId")) {
      qs.set("profileId", selectedProfileId);
    }

    const url = joinUrl(dataHubBase, path);
    const q = qs.toString();
    navigate(q ? `${url}?${q}` : url, { replace });
  }

  function goHome(options) {
    goTo("", options);
  }

  return {
    goTo,
    goHome,
  };
}
