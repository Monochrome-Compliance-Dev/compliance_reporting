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
        });
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

      userService.refreshToken().finally(() => {
        // whether refresh succeeded or not, reschedule based on now
        resetInactivityTimer();
      });
    };

    const onVisibilityChange = () => {
      console.info(
        `[AuthContext] visibilitychange: ${document.visibilityState}`
      );
      if (document.visibilityState === "visible") onResume();
    };

    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onVisibilityChange);

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
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
