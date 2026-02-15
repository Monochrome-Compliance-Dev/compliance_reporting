import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Paper,
  Typography,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import {
  getXeroOrganisations,
  removeXeroOrganisation,
  selectXeroOrganisations,
  getXeroReadiness,
} from "../services/ptrsXero.api";
import { LoadingSpinner } from "shared/ui";

function safeJsonDecode(value) {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

export default function XeroTenantSelectionPanel() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { ptrsId } = usePtrsContext();
  const { goTo, goHome } = usePtrsNavigation();

  const ptrsIdFromQuery = searchParams.get("ptrsId") || null;
  const effectivePtrsId = ptrsId || ptrsIdFromQuery || null;

  const initialFromQuery = useMemo(() => {
    const orgs = safeJsonDecode(searchParams.get("organisations"));
    return Array.isArray(orgs) ? orgs : [];
  }, [searchParams]);

  const baselineOrgsRef = useRef(initialFromQuery);

  const [organisations, setOrganisations] = useState(initialFromQuery);
  const [selected, setSelected] = useState(
    initialFromQuery.map((o) => o?.tenantId).filter(Boolean),
  );
  const [isLoading, setIsLoading] = useState(false);

  const [orgToRemove, setOrgToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [readiness, setReadiness] = useState(null);
  const [isReadinessLoading, setIsReadinessLoading] = useState(false);

  useEffect(() => {
    baselineOrgsRef.current = initialFromQuery;
  }, [initialFromQuery]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!effectivePtrsId) return;

      // Start with whatever came from the callback redirect (fast UX),
      // but always hydrate from API so we get the real organisation names.
      setIsLoading(true);

      try {
        const resp = await getXeroOrganisations(effectivePtrsId);
        const apiOrgs = Array.isArray(resp?.organisations)
          ? resp.organisations
          : [];

        if (!isMounted) return;

        if (!apiOrgs.length) {
          // If API returns nothing, keep whatever we already had from the query string.
          return;
        }

        // Merge by tenantId so we preserve selection and get the best label fields.
        // Also track whether each org is actually present in the current Xero connection.
        const byId = new Map();
        const apiIds = new Set();

        apiOrgs.forEach((o) => {
          const id = o?.tenantId || o?.tenantID || o?.id;
          if (id) apiIds.add(id);
        });

        // Baseline (query-string) first…
        (baselineOrgsRef.current || []).forEach((o) => {
          const id = o?.tenantId || o?.tenantID || o?.id;
          if (!id) return;
          byId.set(id, { ...o, tenantId: id, fromApi: apiIds.has(id) });
        });

        // …then API values overwrite with authoritative names
        apiOrgs.forEach((o) => {
          const id = o?.tenantId || o?.tenantID || o?.id;
          if (!id) return;
          byId.set(id, {
            ...byId.get(id),
            ...o,
            tenantId: id,
            fromApi: true,
          });
        });

        const merged = Array.from(byId.values());

        setOrganisations(merged);

        // Default selection: if nothing selected yet, select only orgs that are present
        // in the current Xero connection (fromApi === true). This prevents a stale/unknown
        // tenantId from re-selecting itself.
        setSelected((prev) => {
          if (prev?.length) return prev;
          return merged
            .filter((o) => o?.fromApi)
            .map((o) => o?.tenantId)
            .filter(Boolean);
        });
      } catch (err) {
        showAlert(
          err?.message || "Failed to load Xero organisations.",
          "error",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [effectivePtrsId, showAlert]);

  useEffect(() => {
    let isMounted = true;

    async function loadReadiness() {
      if (!effectivePtrsId) {
        setReadiness(null);
        return;
      }
      setIsReadinessLoading(true);
      try {
        const d = await getXeroReadiness(effectivePtrsId);
        if (!isMounted) return;
        setReadiness(d);
      } catch (err) {
        if (!isMounted) return;
        setReadiness({
          connectionValid: false,
          selectedTenantIds: [],
          selectedValid: null,
          missingSelectedTenantIds: [],
          connectionsCount: 0,
          hasAnyToken: false,
          error: { message: err?.message || "Failed to check Xero readiness." },
        });
      } finally {
        if (isMounted) setIsReadinessLoading(false);
      }
    }

    loadReadiness();

    return () => {
      isMounted = false;
    };
  }, [effectivePtrsId]);

  const toggleSelection = (tenantId) => {
    setSelected((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId],
    );
  };

  async function handleContinue() {
    if (readiness && readiness.connectionValid === false) {
      showAlert(
        "Xero connection isn't valid. Go back and reconnect before selecting organisations.",
        "warning",
      );
      return;
    }

    const hasPriorSelection = Boolean(readiness?.selectedTenantIds?.length);

    if (hasPriorSelection && readiness.selectedValid === false) {
      showAlert(
        "Your previously selected organisations no longer match your Xero connection. Please re-select organisations.",
        "warning",
      );
      return;
    }

    if (!effectivePtrsId) {
      showAlert(
        "No PTRS run found. Please create/resume a run first.",
        "error",
      );
      return;
    }

    const tenantIds = selected.filter(Boolean);

    if (!tenantIds.length) {
      showAlert("Select at least one organisation.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      await selectXeroOrganisations(effectivePtrsId, tenantIds);
      showAlert("Organisation selection saved.", "success");
      goTo("xero");
    } catch (err) {
      showAlert(
        err?.message || "Failed to save organisation selection.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box sx={{ p: theme.spacing(2) }}>
      <Typography variant="h5" sx={{ mb: theme.spacing(2) }}>
        Select Xero organisation(s)
      </Typography>

      {isReadinessLoading ? (
        <Alert severity="info" sx={{ mb: theme.spacing(2) }}>
          Checking Xero connection…
        </Alert>
      ) : readiness && readiness.connectionValid === false ? (
        <Alert severity="warning" sx={{ mb: theme.spacing(2) }}>
          Xero connection isn't valid. Go back and reconnect before selecting
          organisations.
        </Alert>
      ) : readiness &&
        readiness?.selectedTenantIds?.length &&
        readiness.selectedValid === false ? (
        <Alert severity="warning" sx={{ mb: theme.spacing(2) }}>
          Your previously selected organisations no longer match your Xero
          connection. Please re-select organisations.
        </Alert>
      ) : null}

      <Paper sx={{ p: theme.spacing(2) }}>
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(2),
            }}
          >
            <LoadingSpinner />
            <Typography variant="body2">Loading…</Typography>
          </Box>
        )}

        {!isLoading && !organisations.length && (
          <Typography variant="body2">
            No organisations available yet. Connect to Xero first.
          </Typography>
        )}

        {!isLoading &&
          organisations.map((org) => {
            const tenantId = org?.tenantId || org?.tenantID || org?.id;
            const name = org?.tenantName || org?.orgName || org?.name || null;
            const label = name || tenantId;

            const fetched = Boolean(org?.fetched);
            const isFromApi = org?.fromApi !== false;

            return (
              <Box
                key={tenantId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: theme.spacing(1),
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected.includes(tenantId)}
                      onChange={() => toggleSelection(tenantId)}
                      disabled={fetched}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body2">
                        {`${label}${fetched ? " (Fetched)" : ""}`}
                      </Typography>
                      {name && tenantId && name !== tenantId && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {tenantId}
                        </Typography>
                      )}
                      {!isFromApi && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Not in current Xero connection
                        </Typography>
                      )}
                    </Box>
                  }
                />

                {!fetched && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    sx={{ ml: theme.spacing(1) }}
                    onClick={() => setOrgToRemove({ ...org, tenantId })}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            );
          })}
      </Paper>

      <Box
        sx={{ display: "flex", gap: theme.spacing(2), mt: theme.spacing(2) }}
      >
        <Button
          variant="outlined"
          onClick={() => {
            if (!effectivePtrsId) {
              goHome({ includeId: false });
              return;
            }
            goTo(`xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`, {
              includeId: false,
            });
          }}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={isLoading || !selected.length}
        >
          Continue
        </Button>
      </Box>

      <Dialog open={Boolean(orgToRemove)} onClose={() => setOrgToRemove(null)}>
        <DialogTitle>Remove organisation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove{" "}
            <strong>
              {orgToRemove?.tenantName ||
                orgToRemove?.orgName ||
                orgToRemove?.name ||
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
              if (!effectivePtrsId || !orgToRemove?.tenantId) return;

              setIsRemoving(true);
              try {
                await removeXeroOrganisation(
                  effectivePtrsId,
                  orgToRemove.tenantId,
                );
                showAlert("Organisation removed.", "success");
                setOrganisations((prev) =>
                  prev.filter(
                    (o) =>
                      (o?.tenantId || o?.tenantID || o?.id) !==
                      orgToRemove.tenantId,
                  ),
                );
                setSelected((prev) =>
                  prev.filter((id) => id !== orgToRemove.tenantId),
                );
              } catch (err) {
                showAlert(
                  err?.message || "Failed to remove organisation.",
                  "error",
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
