// src/hooks/useGtagPageview.js
import { useEffect } from "react";
import { useLocation } from "react-router";

export default function useGtagPageview() {
  const location = useLocation();

  useEffect(() => {
    const gtagFn = typeof window !== "undefined" ? window.gtag : undefined;
    if (typeof gtagFn !== "function") return;

    gtagFn("config", "AW-17266555248", {
      page_path: location.pathname,
    });
  }, [location.pathname]);
}
