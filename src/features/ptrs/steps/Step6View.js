import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { tcpService } from "../../../../services";

export default function Step6View({ reportStatus, setStepData }) {
  const [missingFlags, setMissingFlags] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isAlreadySubmitted = reportStatus === "Submitted";

  useEffect(() => {
    tcpService.getIncompleteSmallBusinessFlags().then((hasMissing) => {
      setMissingFlags(hasMissing);
    });
  }, []);

  const handleSubmit = () => {
    tcpService.submitFinalReport().then(() => {
      setSubmitted(true);
      setStepData((prev) => ({ ...prev, step6: { readyToSubmit: true } }));
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await tcpService.downloadSummaryReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "summary_report.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Step 6: Summary & Submission
      </Typography>

      {submitted || isAlreadySubmitted ? (
        <>
          {isAlreadySubmitted && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This report has already been submitted.
            </Alert>
          )}
          <Alert severity="success">Report successfully submitted!</Alert>
        </>
      ) : (
        <>
          {missingFlags && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some records are missing Small Business (isSb) flags. Please
              complete SBI processing before submitting.
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            Review completed. Click submit when ready to finalise and lodge your
            report.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={missingFlags || isAlreadySubmitted}
            onClick={handleSubmit}
          >
            Submit Report
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleDownload}
            sx={{ mt: 2 }}
            disabled={missingFlags || isAlreadySubmitted}
          >
            Download Summary Report
          </Button>
        </>
      )}
    </Box>
  );
}
