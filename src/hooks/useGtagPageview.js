// src/hooks/useGtagPageview.js
import { useEffect } from "react";
import { useLocation } from "react-router";

export default function useGtagPageview() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", "AW-17266555248", {
        page_path: location.pathname,
      });
    } else {
      console.warn("gtag is not defined");
    }
  }, [location]);
}
