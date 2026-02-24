import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import { tcpService } from "../../services";
import { Download, Upload, OpenInNew } from "@mui/icons-material";
import { useAlert } from "../../context/AlertContext";

export default function Step3({ ptrsId, ptrsStatus }) {
  const { showAlert } = useAlert();
  const isLocked = ptrsStatus === "Submitted";
  const params = useParams();
  const effectivePtrsId =
    ptrsId ||
    params?.ptrsId ||
    (typeof window !== "undefined" &&
      window.localStorage.getItem("activePtrsId")) ||
    (typeof window !== "undefined" &&
      window.sessionStorage.getItem("activePtrsId")) ||
    null;

  useEffect(() => {
    if (isLocked) {
      showAlert(
        "This report has already been submitted and cannot be edited.",
        "info"
      );
    }
  }, [isLocked, showAlert]);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [downloadedFile, setDownloadedFile] = useState(false);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownload = async () => {
    if (!effectivePtrsId) {
      showAlert(
        "No PTRS ID available. Please reopen this PTRS from the console and try again.",
        "warning"
      );
      return;
    }
    try {
      const raw = await tcpService.downloadSbiExport(effectivePtrsId);

      // Normalise to a Blob regardless of what the service returns
      let blob;
      if (raw instanceof Blob) {
        blob = raw;
      } else if (raw && raw.data instanceof Blob) {
        blob = raw.data;
      } else if (raw && raw.data) {
        // axios-style: data may be ArrayBuffer or string
        blob = new Blob([raw.data], { type: "text/csv;charset=utf-8" });
      } else if (raw instanceof ArrayBuffer) {
        blob = new Blob([raw], { type: "text/csv;charset=utf-8" });
      } else if (typeof raw === "string") {
        blob = new Blob([raw], { type: "text/csv;charset=utf-8" });
      } else {
        // last resort: stringify
        blob = new Blob([JSON.stringify(raw ?? {})], {
          type: "text/csv;charset=utf-8",
        });
      }

      const url = URL.createObjectURL(blob);
      const today = new Date();
      const dateString = today.toISOString().split("T")[0];
      const fileName = `sbi_export_${effectivePtrsId || "ptrs"}_${dateString}.csv`;
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadedFile(true);
      showAlert("SBI export started.", "info");
    } catch (err) {
      console.error("SBI export failed", err);
      showAlert("Failed to export SBI ABNs.", "error");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      showAlert("Please upload a file.", "warning");
      return;
    }
    if (!effectivePtrsId) {
      showAlert(
        "No PTRS ID available. Please reopen this PTRS from the console and try again.",
        "warning"
      );
      return;
    }
    try {
      setIsImporting(true);
      showAlert("Importing SBI results...", "info");
      const resp = await tcpService.sbiImport(effectivePtrsId, uploadedFile);
      const data = resp?.data || resp; // tolerate either shape
      const total = data?.totalRows ?? data?.total ?? 0;
      const smallBiz = data?.smallBusinessRows ?? data?.matched ?? 0;
      const updated = data?.updated ?? smallBiz;
      showAlert(
        `SBI results imported. Total rows: ${total}. Small-business rows: ${smallBiz}. Updated: ${updated}.`,
        "success"
      );
    } catch (error) {
      console.error("Error importing SBI CSV:", error);
      showAlert("Failed to import SBI results.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Step 3: Upload Comparison File
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 3 }}>
        In this step, you need to download the TCP dataset and upload it to the
        SBI tool on the regulator's portal. The SBI tool will compare the ABNs
        in the dataset to the list of business ABNs that the regulator has
        judged to not be small businesses. After running the comparison, upload
        the resulting CSV file here to exclude the relevant TCP records from the
        rest of the process.
      </Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Download TCP Dataset
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              startIcon={<Download />}
              disabled={isLocked}
            >
              Download TCP Dataset
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                window.open("https://portal.paymenttimes.gov.au/", "_blank")
              }
              disabled={!downloadedFile || isLocked}
              endIcon={<OpenInNew />}
            >
              PTRS Portal
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Upload Comparison File
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<Upload />}
              disabled={isLocked}
              onClick={() => setIsPickingFile(true)}
            >
              Upload SBI File
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => {
                  handleFileUpload(e);
                  setIsPickingFile(false);
                }}
                disabled={isLocked}
              />
            </Button>
            {uploadedFile && (
              <Typography variant="body2">{uploadedFile.name}</Typography>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              disabled={
                !uploadedFile || isLocked || isPickingFile || isImporting
              }
            >
              {isImporting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
          {isImporting && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Processing SBI file… this can take a moment for large datasets.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Paper>
  );
}
