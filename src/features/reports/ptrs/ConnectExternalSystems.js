import { useState, useRef } from "react";
import { tcpService, xeroService } from "../../../services";
import {
  Button,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  Paper,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { useReportContext } from "../../../context";
import { userService } from "../../../services";

export default function ConnectExternalSystems({ onUploadComplete }) {
  const { reportDetails } = useReportContext();
  const [alert] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  console.log("reportDetails in ConnectExternalSystems:", reportDetails);

  const handleXeroConnect = async () => {
    setIsLoading(true);
    setProgressMessage("Connecting to Xero...");
    try {
      const data = await xeroService.connect({
        reportId: reportDetails[0]?.id,
        createdBy: userService.userValue.id,
        startDate: reportDetails[0]?.ReportingPeriodStartDate,
        endDate: reportDetails[0]?.ReportingPeriodEndDate,
      });

      const authUrl = data.authUrl;

      if (!authUrl) {
        throw new Error("Authorisation URL not provided by server");
      }

      // Store callbackData before redirect
      const callbackData = {
        clientId: userService.userValue.clientId,
        reportId: reportDetails[0]?.id,
        createdBy: userService.userValue.id,
        startDate: reportDetails[0]?.ReportingPeriodStartDate,
        endDate: reportDetails[0]?.ReportingPeriodEndDate,
      };

      localStorage.setItem("callbackData", JSON.stringify(callbackData));

      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to Xero:", error);
      setProgressMessage("Error occurred while connecting to Xero.");
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgressMessage("Uploading file...");

    if (!(file instanceof File)) {
      console.error("Invalid file instance:", file);
      return;
    }

    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("reportId", reportDetails[0]?.id);
    console.log("Form data prepared for upload:", {
      fileName: file.name,
      reportId: reportDetails[0]?.id,
    });

    try {
      await tcpService.upload(formData, true);
      setProgressMessage("Upload successful.");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error("Upload failed:", error);
      setProgressMessage("Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset the file input
    }
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a provider or upload a CSV extract to get started.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleXeroConnect}
            disabled={isLoading}
            size="large"
            sx={{ minWidth: 180 }}
          >
            {isLoading ? "Processing..." : "Xero"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUploadClick}
            disabled={uploading}
            size="large"
            sx={{ minWidth: 180 }}
          >
            {uploading ? "Uploading..." : "Upload data extract"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Tooltip title="Coming soon">
            <span>
              <Button
                variant="contained"
                color="secondary"
                disabled
                size="large"
                sx={{ minWidth: 180 }}
              >
                MYOB
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Coming soon">
            <span>
              <Button
                variant="contained"
                color="secondary"
                disabled
                size="large"
                sx={{ minWidth: 180 }}
              >
                JDE
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Snackbar
          open={!!progressMessage}
          message={progressMessage}
          autoHideDuration={3000}
          onClose={() => setProgressMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </CardContent>
    </Card>
  );
}
