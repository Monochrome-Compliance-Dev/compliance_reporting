import { useMemo } from "react";
import { useMatches, useNavigate } from "react-router";
import { usePtrsContext } from "../context/PtrsContext";

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

export function usePtrsNavigation() {
  const navigate = useNavigate();
  const matches = useMatches();
  const { ptrsId } = usePtrsContext();

  // Anchor navigation to the PTRS layout route (id: "ptrsRoot") so calls like
  // goTo("xero") always resolve to /app/ptrs/xero, regardless of the current step.
  const ptrsBase = useMemo(() => {
    const m = matches.find((x) => x?.route?.id === "ptrsRoot");

    // React Router exposes `pathnameBase` on matches in modern versions, but some
    // editor type definitions lag. Prefer `pathnameBase` when present, otherwise
    // fall back to `pathname`.
    const base =
      m && typeof m === "object" && "pathnameBase" in m
        ? m.pathnameBase
        : m?.pathname;

    return base || "/app/ptrs";
  }, [matches]);

  function goTo(target, { replace = false, includeId = true } = {}) {
    const { path, query } = splitPathAndQuery(target);

    const qs = new URLSearchParams(query);
    if (includeId && ptrsId && !qs.has("ptrsId")) {
      qs.set("ptrsId", ptrsId);
    }

    const url = joinUrl(ptrsBase, path);
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
