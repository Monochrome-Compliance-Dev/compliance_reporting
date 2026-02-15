import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useCustomerEntitlements } from "./useCustomerEntitlements";

const AVAILABLE_FEATURES = [
  {
    key: "ptrs",
    label: "PTRS",
    description: "Payment Times Reporting Scheme module",
  },
  {
    key: "pulse",
    label: "Pulse",
    description: "Pulse resource & engagement module",
  },
];

function CustomerEntitlementsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const { entitlementsQuery, saveEntitlements, isSaving } =
    useCustomerEntitlements(customerId);

  const { data, isLoading } = entitlementsQuery;

  const [featureState, setFeatureState] = useState({});

  const customerFromState = location.state && location.state.customer;
  const customerName =
    customerFromState?.businessName || customerFromState?.name || "";

  useEffect(() => {
    if (!Array.isArray(data)) return;
    const next = {};
    data.forEach((e) => {
      if (e.feature) {
        next[e.feature] = true;
      }
    });
    setFeatureState(next);
  }, [data]);

  const handleToggle = (feature) => (event) => {
    const checked = event.target.checked;
    setFeatureState((prev) => ({
      ...prev,
      [feature]: checked,
    }));
  };

  const handleSave = () => {
    const features = AVAILABLE_FEATURES.map((f) => ({
      feature: f.key,
      enabled: !!featureState[f.key],
    }));
    saveEntitlements(features);
  };

  const handleBack = () => {
    navigate("/app/boss/customers");
  };

  if (!customerId) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>
        <Typography variant="body1" color="error">
          Missing customer id in route.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: theme.spacing(2) }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Entitlements{customerName ? ` · ${customerName}` : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enable or disable modules for this customer. Changes take effect
            immediately.
          </Typography>
        </Box>
        <Button variant="text" onClick={handleBack}>
          Back to customers
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 160,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {AVAILABLE_FEATURES.map((feature) => (
                <Box
                  key={feature.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: (t) => `1px solid ${t.palette.divider}`,
                    borderRadius: 1,
                    p: theme.spacing(1.5),
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">{feature.label}</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!featureState[feature.key]}
                        onChange={handleToggle(feature.key)}
                      />
                    }
                    label={featureState[feature.key] ? "Enabled" : "Disabled"}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Box
        sx={{
          mt: theme.spacing(2),
          display: "flex",
          justifyContent: "flex-end",
          gap: theme.spacing(1),
        }}
      >
        <Button onClick={handleBack} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </Box>
    </Box>
  );
}

export default CustomerEntitlementsPage;
