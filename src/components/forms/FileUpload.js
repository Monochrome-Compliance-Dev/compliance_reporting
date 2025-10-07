import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Box, Button, Typography, Link, useTheme, Stack } from "@mui/material";
import { useAlert } from "../../context/AlertContext";

const FileUpload = ({ onFilesSelected }) => {
  const location = useLocation();
  const navigate = useNavigate();
  let userDetails = location.state;
  if (!userDetails) {
    try {
      const stored = localStorage.getItem("userDetails");
      userDetails = stored ? JSON.parse(stored) : {};
    } catch {
      userDetails = {};
    }
  }
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const baseUrl = `${process.env.REACT_APP_API_URL}`;
  const { showAlert } = useAlert();
  const theme = useTheme();

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        my: theme.spacing(4),
        px: theme.spacing(4),
        py: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
    >
      <Typography variant="h5" gutterBottom>
        Upload Source Files
      </Typography>

      {[
        { key: "organisation", label: "Organisation Details" },
        { key: "payments", label: "Payment Records" },
        { key: "invoices", label: "Invoice Records" },
        { key: "suppliers", label: "Supplier Records" },
        { key: "bank", label: "Bank Transactions" },
      ].map(({ key, label }) => (
        <Box
          key={key}
          sx={{
            my: 3,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="subtitle1">File type: {label}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Template:&nbsp;
            <Link
              href={`/templates/${key}-template.csv`}
              download
              underline="hover"
              sx={{
                wordBreak: "break-word",
                fontWeight: 500,
                color: theme.palette.secondary.main,
              }}
            >
              Download
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            File uploaded: {selectedFiles[key]?.name || ""}
          </Typography>
          <Button
            variant="contained"
            component="label"
            color="secondary"
            sx={{ mt: 2 }}
          >
            Upload File
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFiles((prev) => ({ ...prev, [key]: file }));
                  onFilesSelected?.({ ...selectedFiles, [key]: file });
                }
              }}
            />
          </Button>
        </Box>
      ))}

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={
            submitting ||
            Object.keys(selectedFiles).length < 5 ||
            Object.values(selectedFiles).some((f) => !f)
          }
          onClick={async () => {
            setSubmitting(true);
            if (
              !userDetails?.email ||
              !userDetails?.contactName ||
              !userDetails?.businessName ||
              !userDetails?.abn
            ) {
              showAlert(
                "Missing user details. Please return to the previous step.",
                "error"
              );
              setSubmitting(false);
              return;
            }
            try {
              for (const [key, file] of Object.entries(selectedFiles)) {
                if (!file) {
                  console.warn(`Skipping ${key} — no file provided`);
                  continue;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("fileType", key);

                Object.entries(userDetails || {}).forEach(([field, value]) => {
                  formData.append(field, value);
                });
                console.log(`Uploading ${key} file:`, file.name);

                const res = await fetch(`${baseUrl}/unprocessed-submission`, {
                  method: "POST",
                  body: formData,
                });

                if (!res.ok) {
                  throw new Error(`Upload failed for ${key}`);
                }
              }
              showAlert("Files uploaded successfully!", "success");
            } catch (err) {
              showAlert(err.message || "Upload failed", "error");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </Stack>
    </Box>
  );
};

export default FileUpload;
