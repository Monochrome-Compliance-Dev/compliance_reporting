import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { userService } from "services";
import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";
import { useAlert } from "./AlertContext";

const AuthContext = createContext();

let logoutTimer;
let warningTimer;
let hasRefreshed = false;
const WARNING_MS = 14 * 60 * 1000;
const LOGOUT_MS = 15 * 60 * 1000;

export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(null); // null = loading
  const [user, setUser] = useState(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const lastActiveRef = useRef(Date.now());

  const { showAlert } = useAlert();

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(logoutTimer);
    clearTimeout(warningTimer);

    if (!user) return;

    const now = Date.now();
    const elapsed = now - lastActiveRef.current;
    const warnIn = Math.max(WARNING_MS - elapsed, 0);
    const logoutIn = Math.max(LOGOUT_MS - elapsed, 0);

    // If limits already exceeded while tab was hidden/asleep, act immediately
    if (logoutIn === 0) {
      setShowWarningDialog(false);
      userService.logout();
      return;
    }

    if (warnIn === 0) {
      setShowWarningDialog(true);
    } else {
      warningTimer = setTimeout(() => setShowWarningDialog(true), warnIn);
    }

    logoutTimer = setTimeout(() => {
      setShowWarningDialog(false);
      userService.logout();
    }, logoutIn);
  }, [user]);

  const handleContinueSession = () => {
    setShowWarningDialog(false);
    resetInactivityTimer();
    userService.refreshToken().catch(() => {
      userService.logout();
    });
  };

  const handleEndSession = () => {
    setShowWarningDialog(false);
    userService.logout();
  };

  const handleSessionExpired = useCallback(() => {
    setShowWarningDialog(false);
    showAlert("Your session expired. Please sign in again.", "info");
    userService.logout();
  }, [showAlert]);

  useEffect(() => {
    const subscription = userService.user.subscribe((x) => {
      setUser(x);
      setIsSignedIn(!!x);
      if (!x) {
        const path = window.location.pathname;
        const isAuthPage =
          path === "/login" ||
          path.startsWith("/verify") ||
          path.startsWith("/reset-password");
        if (!isAuthPage) {
          try {
            localStorage.setItem("lastVisitedPath", path);
          } catch {}
        }
      }
    });

    if (!hasRefreshed) {
      hasRefreshed = true;
      userService
        .refreshToken()
        .then((refreshedUser) => {
          if (refreshedUser) {
            setUser(refreshedUser);
            setIsSignedIn(true);
          } else {
            setIsSignedIn(false);
          }
        })
        .catch((err) => {
          const msg = String(err?.message || err || "").toLowerCase();
          if (!msg.includes("unauthorised")) {
            console.error("Refresh failed:", err);
          }
          setIsSignedIn(false);
        })
        .finally(() => {
          setIsInitialising(false);
        });
    }

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      resetInactivityTimer();
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleActivity)
    );

    lastActiveRef.current = Date.now();
    resetInactivityTimer();

    return () => {
      subscription.unsubscribe();
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
    };
  }, [resetInactivityTimer]);

  if (isInitialising) return null;

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, user, setUser }}>
      {children}
      <Dialog open={showWarningDialog}>
        <DialogTitle>Are you still there?</DialogTitle>
        <DialogActions>
          <Button variant="contained" onClick={handleContinueSession}>
            Yes, I’m still here
          </Button>
          <Button variant="outlined" onClick={handleEndSession}>
            No, log me out
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
