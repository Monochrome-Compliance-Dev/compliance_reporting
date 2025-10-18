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

// Cross-tab refresh debounce/lock helpers
let lastRefreshAttempt = 0;
const REFRESH_LOCK_KEY = "auth:refresh-lock";
const REFRESH_LOCK_TTL = 5000; // ms

function tryAcquireRefreshLock() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    const ts = raw ? Number(raw) : 0;
    if (ts && now - ts < REFRESH_LOCK_TTL) return false;
    localStorage.setItem(REFRESH_LOCK_KEY, String(now));
    return true;
  } catch {
    return true; // if storage fails, don't block
  }
}

function releaseRefreshLock() {
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (raw) localStorage.removeItem(REFRESH_LOCK_KEY);
  } catch {}
}

async function safeRefreshToken() {
  const now = Date.now();
  if (now - lastRefreshAttempt < 2000) {
    console.warn("[AuthContext] Skipping rapid duplicate refresh");
    return null;
  }
  lastRefreshAttempt = now;
  return userService.refreshToken();
}

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

      // If session ended while app is running, ask the Layout to navigate to /login
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
          window.dispatchEvent(new Event("auth:go-login"));
        }
      }
    });

    if (!hasRefreshed) {
      hasRefreshed = true;

      if (tryAcquireRefreshLock()) {
        safeRefreshToken()
          .then((refreshedUser) => {
            if (refreshedUser) {
              setUser(refreshedUser);
              setIsSignedIn(true);
            } else {
              setIsSignedIn(false);
            }
          })
          .catch((err) => {
            // Swallow unauthorised/no-session noise on public pages
            const msg = String(err?.message || err || "").toLowerCase();
            if (!msg.includes("unauthorised")) {
              // Log only non-auth errors
              // eslint-disable-next-line no-console
              console.error("Refresh failed:", err);
            }
            setIsSignedIn(false);
          })
          .finally(() => {
            setIsInitialising(false);
            releaseRefreshLock();
          });
      } else {
        // Another tab is refreshing; don’t double-fire
        setIsInitialising(false);
      }
    }

    const onExpired = () => {
      console.info("[AuthContext] auth:expired event fired");
      handleSessionExpired();
    };

    const onResume = () => {
      console.info("[AuthContext] onResume triggered");
      if (!user) return;

      const elapsed = Date.now() - lastActiveRef.current;
      if (elapsed >= LOGOUT_MS) {
        handleSessionExpired();
        return;
      }
      if (elapsed >= WARNING_MS) {
        setShowWarningDialog(true);
      }

      if (!tryAcquireRefreshLock()) return; // another tab just refreshed
      safeRefreshToken().finally(() => {
        resetInactivityTimer();
        releaseRefreshLock();
      });
    };

    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("focus", onResume);

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
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("focus", onResume);
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
    };
  }, [resetInactivityTimer, user, handleSessionExpired]);

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
