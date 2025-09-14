import { Navigate, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { userService } from "../services";
import { useAlert } from "../context";

export default function RequireFeature({
  feature,
  children,
  fallback = "/dashboard",
}) {
  const { showAlert } = useAlert();
  const location = useLocation();

  // Evaluate access synchronously from the current user snapshot.
  const allowed = userService.hasFeature(feature);

  // Only fire the alert once to avoid re-render loops.
  const alertedRef = useRef(false);
  useEffect(() => {
    if (!allowed && !alertedRef.current) {
      alertedRef.current = true;
      showAlert?.(
        "That module isn’t in your plan. See pricing to upgrade.",
        "info"
      );
    }
  }, [allowed, showAlert]);

  if (allowed) return children;

  // Redirect away without causing state updates during render
  return <Navigate to={fallback} state={{ from: location }} replace />;
}
