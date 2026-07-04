import { useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useAlert } from "context";
import { identityApi } from "platform/identity/identityApi";
import { executePlatformFoundation } from "platform/foundation/foundationApi";

export default function PlatformFoundationPage() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [lastFoundation, setLastFoundation] = useState(null);
  const currentUser = identityApi.getCurrentUser();

  const handleTestFoundation = async () => {
    try {
      const result = await executePlatformFoundation();
      setLastFoundation(result);
      showAlert(result.message, result.success ? "success" : "error");
    } catch (error) {
      const message = error?.message || "Platform foundation failed.";

      setLastFoundation({
        success: false,
        foundationId: null,
        capability: "foundation",
        message,
        actor: null,
      });

      showAlert(message, "error");
    }
  };

  const displayName =
    currentUser?.firstName ||
    currentUser?.email ||
    currentUser?.username ||
    "Unknown user";

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Platform Foundation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stage 1 validates the new capability-oriented platform skeleton
            beside the existing implementation.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="Identity" color="primary" variant="outlined" />
              <Typography variant="body1">
                Current user: {displayName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="Security" color="primary" variant="outlined" />
              <Typography variant="body1">
                Existing authentication context is being reused as the Stage 1
                reference implementation.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="Audit" color="primary" variant="outlined" />
              <Typography variant="body1">
                Audit validation will be added once the backend foundation
                endpoint is wired.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="Foundations" color="primary" variant="outlined" />
              <Typography variant="body1">
                Local foundation adapter is ready for backend replacement.
              </Typography>
            </Stack>

            <Box>
              <Button variant="contained" onClick={handleTestFoundation}>
                Test platform foundation
              </Button>
            </Box>

            {lastFoundation && (
              <Paper
                variant="outlined"
                sx={{ p: 2, backgroundColor: theme.palette.background.paper }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Last foundation
                </Typography>
                <Typography variant="body2">
                  Foundation ID: {lastFoundation.foundationId}
                </Typography>
                <Typography variant="body2">
                  Success: {String(lastFoundation.success)}
                </Typography>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
