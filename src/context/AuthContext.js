import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { userService } from "../services";
import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";

const AuthContext = createContext();

let logoutTimer;
let warningTimer;
let hasRefreshed = false;

export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(null); // null = loading
  const [user, setUser] = useState(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(logoutTimer);
    clearTimeout(warningTimer);

    if (!user) return;

    // Show warning at 14 min
    warningTimer = setTimeout(
      () => {
        setShowWarningDialog(true);
      },
      14 * 60 * 1000
    );

    // Auto logout at 15 min
    logoutTimer = setTimeout(
      () => {
        setShowWarningDialog(false);
        userService.logout();
      },
      15 * 60 * 1000
    );
  }, [user]);

  const handleContinueSession = () => {
    setShowWarningDialog(false);
    resetInactivityTimer();
    userService.refreshToken().catch(() => {
      userService.logout();
    });
  };

  useEffect(() => {
    const subscription = userService.user.subscribe((x) => {
      setUser(x);
      setIsSignedIn(!!x);
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

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = resetInactivityTimer;

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleActivity)
    );

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
          <Button onClick={handleContinueSession}>Yes, I’m still here</Button>
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
