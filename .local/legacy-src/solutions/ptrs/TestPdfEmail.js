import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
// import { handlePdf } from "../../lib/utils";
import { downloadFile, handlePdf, sendSummaryByEmail } from "../../lib/utils";

export default function TestPdfEmail() {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");
  const [blob, setBlob] = useState(null);

  const answers = {
    charity: "No",
    section7: "Yes",
    connectionToAustralia: [
      "Incorporated in Australia",
      "Carries on business in Australia",
      "Central management and control in Australia",
      "Majority voting power controlled by Australian shareholders",
    ],
    controlled: "No",
    cce: "Yes",
    revenue: "Yes",
    contactDetails: {
      name: "Jane Doe",
      email: "darryllrobinson@icloud.com",
      phone: "0400000000",
    },
    entityDetails: {
      entityName: "Example Pty Ltd",
      abn: "12345678901",
    },
  };

  const flowQuestions = [
    { key: "charity", question: "Is the entity a registered charity?" },
    {
      key: "section7",
      question: "Has the entity been assessed under Section 7?",
    },
    {
      key: "connectionToAustralia",
      question: "What is the entity's connection to Australia?",
    },
    {
      key: "controlled",
      question: "Is the entity controlled by another reporting entity?",
    },
    { key: "cce", question: "Is the entity a CCE?" },
    { key: "revenue", question: "Does the entity have revenue over A$100M?" },
    {
      key: "contactDetails",
      question: "Contact Details",
      fields: [
        { name: "name", label: "Contact Name" },
        { name: "email", label: "Contact Email" },
        { name: "phone", label: "Contact Phone" },
      ],
    },
    {
      key: "entityDetails",
      question: "Entity Details",
      fields: [
        { name: "entityName", label: "Entity Name" },
        { name: "abn", label: "ABN" },
      ],
    },
  ];

  const handleCreatePdf = async () => {
    setLoading(true);
    setError("");
    setDownloadUrl(null);
    setBlob(null);
    try {
      const recordId = "TEST-12345";
      const pdfBlob = await handlePdf(recordId, answers, flowQuestions);
      if (!(pdfBlob instanceof Blob)) {
        throw new Error("Invalid PDF blob generated");
      }
      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);
      setBlob(pdfBlob);
      // No upload logic, just prepare for download
      window.open(url, "_blank");
    } catch (err) {
      setError(err.message || "Failed to create PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    await downloadFile(downloadUrl, "test.pdf");
    await sendSummaryByEmail({
      pdfBlob: blob,
      recordId: "TEST-12345",
      contactData: answers.contactDetails,
    });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Test PDF Create & Download
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Click the button below to generate and download a test PDF.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreatePdf}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Create PDF"}
        </Button>
        {downloadUrl && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDownload}
            >
              Download PDF
            </Button>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
