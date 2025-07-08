import { useLocation, Navigate } from "react-router";
import { useAuthContext, useAlert } from "../context";
import Fallback from "../components/common/Fallback";

/**
 * RequireRoles wrapper with fallback + role checks
 * Usage:
 * <RequireRoles allowed={[Role.Admin, Role.Boss]}>
 *    <SomeComponent />
 * </RequireRoles>
 */
export default function RequireRoles({ allowed, children }) {
  const { isSignedIn, user } = useAuthContext();
  const { showAlert } = useAlert();
  const location = useLocation();

  if (isSignedIn === null) {
    return <Fallback message="Checking your session..." />;
  }

  if (!isSignedIn) {
    showAlert("You must be logged in to access this page.", "warning");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed.length && !allowed.includes(user?.role)) {
    showAlert("You do not have permission to view this page.", "error");
    return <Navigate to="/unauthorised" state={{ from: location }} replace />;
  }

  return children;
}
