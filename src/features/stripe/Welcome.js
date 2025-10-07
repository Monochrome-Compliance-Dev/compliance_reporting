// /src/features/stripe/Welcome.js
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router"; // not react-router-dom
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useAlert } from "../../context/";
import { billingService } from "../../services";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Welcome() {
  const query = useQuery();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const sessionId = query.get("session_id");

    async function run() {
      try {
        if (!sessionId) {
          // No session id? This could be a manual visit; keep it graceful.
          setSummary({ status: "unknown" });
          setLoading(false);
          return;
        }
        const res = await billingService.verifySession(sessionId);
        if (!isMounted) return;
        setSummary(res);
      } catch (err) {
        showAlert(
          err?.message || "Could not verify your checkout session.",
          "error"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [query, showAlert]);

  const handleGoToApp = () => {
    navigate("/pulse-solution"); // or wherever your post-onboarding entry point is
  };

  const handleManageBilling = async () => {
    try {
      const returnUrl = `${window.location.origin}/welcome`;
      const portal = await billingService.createPortalSession({ returnUrl });
      const url = portal?.url ?? portal?.data?.url;
      if (!url) {
        showAlert("Could not start the billing portal.", "error");
        return;
      }
      window.location.assign(url);
    } catch (e) {
      showAlert(e?.message || "Could not start the billing portal.", "error");
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
      px={2}
    >
      <Paper sx={{ p: 4, maxWidth: 560, width: "100%" }} elevation={3}>
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <CircularProgress />
            <Typography variant="h6">Finalising your subscription…</Typography>
            <Typography variant="body2">This only takes a moment.</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h4" gutterBottom>
              Welcome aboard 🎉
            </Typography>
            {summary?.status && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Checkout status: <strong>{summary.status}</strong>
              </Typography>
            )}
            {summary?.subscription_status && (
              <Typography variant="body2" sx={{ mb: 3 }}>
                Subscription status:{" "}
                <strong>{summary.subscription_status}</strong>
              </Typography>
            )}
            {!summary?.subscription_status && (
              <Typography variant="body2" sx={{ mb: 3 }}>
                We’re waiting for confirmation from Stripe. You can continue —
                your workspace will unlock as soon as the payment is confirmed.
              </Typography>
            )}

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button variant="contained" onClick={handleGoToApp}>
                Go to app
              </Button>
              <Button variant="outlined" onClick={handleManageBilling}>
                Manage billing
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
