import { useLocation, Navigate } from "react-router";
import { useAuthContext } from "../context";
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
  const location = useLocation();

  if (isSignedIn === null) {
    return <Fallback message="Checking your session..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed.length && !allowed.includes(user?.role)) {
    return <Navigate to="/unauthorised" state={{ from: location }} replace />;
  }

  return children;
}
