import { useReportContext } from "../../context";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CreateReport from "../reports/ptrs/CreateReport";
import ConnectExternalSystems from "../reports/ptrs/ConnectExternalSystems";
import DataUploadReview from "../reports/ptrs/DataUploadReview";
import { tcpService } from "../../services/";

export default function DataConsole() {
  const theme = useTheme();
  const { reportDetails, setReportDetails, refreshReports } =
    useReportContext();
  const [uploadResults, setUploadResults] = useState(null);

  // 1. On mount: try to load reportDetails or refresh from DB
  useEffect(() => {
    if (reportDetails) return;

    const stored = localStorage.getItem("activeReportDetails");
    if (stored && stored !== "undefined") {
      try {
        setReportDetails(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored reportDetails:", e);
        refreshReports();
      }
    } else {
      refreshReports();
    }
  }, [reportDetails, setReportDetails, refreshReports]);

  // 2. When reportDetails is set, fetch TCP data
  useEffect(() => {
    if (!reportDetails?.id) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        const [valid, errors] = await Promise.all([
          tcpService.getAllByReportId(reportDetails.id),
          tcpService.getErrorsByReportId(reportDetails.id),
        ]);
        if (!cancelled) {
          setUploadResults({
            validRecordsPreview: valid || [],
            errors: errors || [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load TCP datasets:", err);
        }
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [reportDetails?.id]);

  return (
    <>
      <Box
        sx={{
          padding: theme.spacing(4),
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Typography variant="h4" gutterBottom>
          PTRS Data Console
        </Typography>
        <Typography variant="body1" gutterBottom>
          Start by creating a report container, then prepare your dataset for
          import.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Paper
          elevation={3}
          sx={{ padding: theme.spacing(3), marginBottom: theme.spacing(4) }}
        >
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Create Report Container
          </Typography>
          <CreateReport
            reportDetails={reportDetails}
            onSuccess={(newReport) => {
              refreshReports();
              setReportDetails((prev) =>
                prev?.id === newReport.id ? prev : newReport
              );
            }}
            onUpdate={(updatedReport) => {
              refreshReports();
              setReportDetails((prev) =>
                prev?.id === updatedReport.id ? prev : updatedReport
              );
            }}
            onDelete={() => {
              refreshReports();
              setReportDetails(null);
              localStorage.removeItem("activeReportDetails");
            }}
          />
        </Paper>

        {reportDetails && (
          <Paper elevation={3} sx={{ padding: theme.spacing(3) }}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Ingest, validate and enrich datasets linked to your created
              report.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <ConnectExternalSystems
                reportDetails={reportDetails}
                onUploadComplete={(results) => setUploadResults(results)}
              />
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Imported Datasets
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Below is a placeholder for datasets you’ve uploaded or fetched.
              </Typography>
              <Paper sx={{ mt: 2, padding: 2, textAlign: "center" }}>
                {uploadResults ? (
                  <DataUploadReview
                    errors={uploadResults.errors}
                    validRecordsPreview={uploadResults.validRecordsPreview}
                    onErrorsUpdated={(newErrors) =>
                      setUploadResults((prev) => ({
                        ...prev,
                        errors: newErrors,
                      }))
                    }
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No datasets available yet.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
}
