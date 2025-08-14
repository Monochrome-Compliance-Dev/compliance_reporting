import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import { xeroService } from "../../services";
import { useAlert, usePtrsContext } from "../../context";

export default function XeroSelection() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const error = query.get("error");
  const [searchParams] = useSearchParams();
  const initialOrgs = (() => {
    try {
      const parsed = JSON.parse(
        decodeURIComponent(searchParams.get("organisations"))
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse organisations:", e);
      return [];
    }
  })();
  const [organisations, setOrganisations] = useState(initialOrgs);
  const [selected, setSelected] = useState(
    initialOrgs.map((org) => org.tenantId)
  );
  const [callbackData, setCallbackData] = useState(null);
  const [callbackInfo, setCallbackInfo] = useState(null);
  const [orgToRemove, setOrgToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loadingTenantId, setLoadingTenantId] = useState(null);
  const navigate = useNavigate();
  const { activePtrsId: ptrsId } = usePtrsContext();
  const { showAlert } = useAlert();

  useEffect(() => {
    const stateData = location.state?.callbackData;
    if (stateData) {
      setCallbackData(stateData);
      localStorage.setItem("callbackData", JSON.stringify(stateData));
      console.log("Loaded callbackData from state:", stateData);
    } else {
      const saved = localStorage.getItem("callbackData");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCallbackData(parsed);
          // console.log("Loaded callbackData from localStorage:", parsed);
        } catch (err) {
          console.warn("Failed to parse callbackData from localStorage:", err);
        }
      } else {
        console.warn("No callbackData available in state or localStorage");
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (callbackData) {
      setCallbackInfo(callbackData);
    }
  }, [callbackData]);

  const toggleSelection = (tenantId) => {
    setSelected((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleContinue = async () => {
    const unfetchedTenantIds = organisations
      .filter((org) => selected.includes(org.tenantId) && !org.fetched)
      .map((org) => org.tenantId);

    if (unfetchedTenantIds.length === 0) {
      showAlert("No new organisations selected for extraction.", "info");
      return;
    }
    const startDate = callbackData?.startDate || new Date().toISOString();
    const endDate = callbackData?.endDate || new Date().toISOString();
    console.log("ptrsId:", ptrsId);
    console.log("Unfetched Tenant IDs:", unfetchedTenantIds);
    console.log(
      "payload:",
      // ...callbackData,
      ptrsId,
      unfetchedTenantIds,
      startDate,
      endDate
    );

    try {
      await xeroService.triggerExtraction({
        ...callbackData,
        ptrsId,
        tenantIds: unfetchedTenantIds,
        startDate,
        endDate,
      });
      navigate(`/ptrs/${ptrsId}/progress`);
    } catch (error) {
      console.error("Error starting extract:", error);
      showAlert("Error starting data extraction. Please try again.", "error");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{decodeURIComponent(error)}</Alert>
        </Box>
      )}
      {/* {callbackInfo && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle1">Xero callback received:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(callbackInfo, null, 2)}
          </Typography>
        </Box>
      )} */}
      <Typography variant="h5" gutterBottom>
        Select Xero Organisations
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        {organisations.map((org) => (
          <Box
            key={org.tenantId}
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={selected.includes(org.tenantId)}
                  onChange={() => toggleSelection(org.tenantId)}
                  disabled={org.fetched}
                />
              }
              label={`${org.tenantName || org.orgName || org.tenantId}${org.fetched ? " (Fetched)" : ""}`}
            />
            {process.env.NODE_ENV !== "production" && (
              <Button
                size="small"
                variant="outlined"
                sx={{ ml: 2 }}
                onClick={async () => {
                  const startDate =
                    callbackData?.startDate || new Date().toISOString();
                  const endDate =
                    callbackData?.endDate || new Date().toISOString();
                  setLoadingTenantId(org.tenantId);
                  try {
                    await xeroService.triggerExtraction({
                      ...callbackData,
                      ptrsId,
                      tenantIds: [org.tenantId],
                      startDate,
                      endDate,
                    });
                    console.log("Triggered fetch for tenant:", org.tenantId);
                    setOrganisations((prev) =>
                      prev.map((o) =>
                        o.tenantId === org.tenantId
                          ? { ...o, fetched: true }
                          : o
                      )
                    );
                  } catch (err) {
                    console.error(
                      "Error triggering fetch for",
                      org.tenantId,
                      err
                    );
                    showAlert("Failed to fetch data for this tenant.", "error");
                  } finally {
                    setLoadingTenantId(null);
                  }
                }}
              >
                {loadingTenantId === org.tenantId ? (
                  <CircularProgress size={18} />
                ) : (
                  "Fetch"
                )}
              </Button>
            )}
            {!org.fetched && (
              <Button
                size="small"
                color="error"
                variant="text"
                sx={{ ml: 1 }}
                onClick={() => setOrgToRemove(org)}
              >
                Remove
              </Button>
            )}
          </Box>
        ))}
      </Paper>
      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/ptrs/${ptrsId}/connect`)}
        >
          Connect Another Organisation
        </Button>
        <Button
          variant="contained"
          disabled={selected.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Box>
      <Dialog open={!!orgToRemove} onClose={() => setOrgToRemove(null)}>
        <DialogTitle>Remove Organisation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>
              {orgToRemove?.tenantName ||
                orgToRemove?.orgName ||
                orgToRemove?.tenantId}
            </strong>
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrgToRemove(null)}
            variant="outlined"
            color="inherit"
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsRemoving(true);
              try {
                await xeroService.removeTenant(orgToRemove.tenantId);
                showAlert(
                  `Removed ${orgToRemove.tenantName || orgToRemove.orgName || orgToRemove.tenantId}`,
                  "success"
                );
                setOrganisations((prev) =>
                  prev.filter((o) => o.tenantId !== orgToRemove.tenantId)
                );
                setSelected((prev) =>
                  prev.filter((id) => id !== orgToRemove.tenantId)
                );
              } catch (err) {
                console.error("Failed to remove org from backend:", err);
                showAlert(
                  "Failed to remove organisation. Please try again.",
                  "error"
                );
              } finally {
                setIsRemoving(false);
                setOrgToRemove(null);
              }
            }}
            color="error"
            variant="contained"
            disabled={isRemoving}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
