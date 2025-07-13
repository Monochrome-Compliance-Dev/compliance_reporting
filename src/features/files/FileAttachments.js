import { useState, useEffect, useRef } from "react";
import { socket } from "../../services";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fileService } from "../../services/file/file";
import { useAlert } from "../../context/";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function FileAttachments({
  indicatorId,
  metricId,
  isLocked,
  basePath,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const { showAlert } = useAlert();
  const fileInputRef = useRef();

  useEffect(() => {
    if (!indicatorId && !metricId) return;

    const loadFiles = async () => {
      try {
        const fetchedFiles = await fileService.getFiles({
          indicatorId,
          metricId,
        });
        setFiles(Array.isArray(fetchedFiles) ? fetchedFiles : []);
      } catch (error) {
        console.error("Failed to load attached files:", error);
        setFiles([]); // defensive fallback
        showAlert("Failed to load attached files", "error");
      }
    };

    loadFiles();
  }, [indicatorId, metricId, showAlert]);

  // Real-time file upload and scan status via websocket
  useEffect(() => {
    const handleSocketUpdate = (message) => {
      console.log("🔄 Socket event:", message);
      const { type, stage, payload } = message;

      if (type !== "fileUpload") return; // only handle file uploads

      switch (stage) {
        case "scanStarted":
          // File scan has begun
          setLoading(true);
          setScanMessage("Scanning file...");
          break;
        case "scanProgress":
          // Update progress
          setScanMessage(`Scan progress: ${payload.progress}%`);
          break;
        case "scanComplete":
          // Scan finished successfully
          setLoading(false);
          setScanMessage("");
          showAlert(`File scan completed: ${payload.result}`, "success");
          (async () => {
            const fetchedFiles = await fileService.getFiles({
              indicatorId,
              metricId,
            });
            setFiles(Array.isArray(fetchedFiles) ? fetchedFiles : []);
          })();
          break;
        case "scanFailed":
          // Scan failed
          setLoading(false);
          setScanMessage("");
          showAlert(`File scan failed: ${payload.message}`, "error");
          break;
        default:
          console.log("⚠️ Unhandled stage:", stage);
      }
    };

    // Listen on the agreed event type
    socket.on("statusUpdate", handleSocketUpdate);

    return () => {
      socket.off("statusUpdate", handleSocketUpdate);
    };
  }, [indicatorId, metricId, showAlert]);

  const handleDelete = async (id) => {
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      showAlert("File deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete file:", error);
      showAlert("Failed to delete file", "error");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      await fileService.uploadFile({
        file,
        category: basePath.replace("/uploads/", ""),
        indicatorId,
        metricId,
      });
      showAlert("File uploaded successfully", "success");

      const fetchedFiles = await fileService.getFiles({
        indicatorId,
        metricId,
      });
      setFiles(Array.isArray(fetchedFiles) ? fetchedFiles : []);
    } catch (error) {
      console.error("Failed to upload file:", error);
      showAlert("Failed to upload file", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={3}>
      <Typography variant="h6">Attached Files</Typography>
      {!isLocked && (
        <Box mt={1} mb={2}>
          <Button
            variant="contained"
            onClick={() => fileInputRef.current.click()}
          >
            Upload File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Box>
      )}
      {loading && (
        <LoadingSpinner
          message={scanMessage || "Loading compliance magic..."}
        />
      )}
      {files.length === 0 ? (
        <Typography>No files attached yet.</Typography>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                !isLocked && (
                  <IconButton edge="end" onClick={() => handleDelete(file.id)}>
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={file.filename}
                secondary={`${(file.fileSize / 1024).toFixed(1)} KB`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
