import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, Button, LinearProgress } from "@mui/material";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import { useTheme } from "@mui/material/styles";
import { uploadCsv, getRunSample } from "../services/data.ptrsApi";

export default function UploadPanel() {
  const theme = useTheme();
  const [params] = useSearchParams();
  const ptrsId = params.get("ptrsId");
  const { showAlert } = useAlert();

  const [file, setFile] = useState(null);
  const [lastSample, setLastSample] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [liveUploadStatus, setLiveUploadStatus] = useState(null);

  const onFileChange = (e) => setFile(e.target.files?.[0] || null);

  const uploadStatus = useMemo(() => {
    const s = liveUploadStatus?.status;
    return typeof s === "string" ? s.toUpperCase() : "";
  }, [liveUploadStatus]);

  const rowsInserted = Number(liveUploadStatus?.rowsInserted || 0);
  const totalRows = Number(liveUploadStatus?.totalRows || 0);
  const progressPct =
    totalRows > 0
      ? Math.min(100, Math.round((rowsInserted / totalRows) * 100))
      : 0;
  const uploadError = liveUploadStatus?.error || null;
  const updatedAt = liveUploadStatus?.updatedAt || null;

  useEffect(() => {
    if (!ptrsId) return;

    const socketBaseUrl =
      process.env.REACT_APP_SOCKET_URL ||
      (process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
        : "http://localhost:4000");

    const socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const onStatus = (payload) => {
      if (!payload || payload.ptrsId !== ptrsId) return;
      setLiveUploadStatus(payload);
    };

    socket.on("connect", () => {
      socket.emit("ptrs:join", { ptrsId });
    });

    socket.on("ptrs:csvUploadStatus", onStatus);

    return () => {
      try {
        socket.emit("ptrs:leave", { ptrsId });
      } catch (_) {}
      socket.off("ptrs:csvUploadStatus", onStatus);
      socket.disconnect();
    };
  }, [ptrsId]);

  const onUpload = async () => {
    if (!ptrsId) return showAlert("Missing ptrsId in URL", "error");
    if (!file) return showAlert("Choose a CSV first", "info");
    try {
      setIsUploading(true);
      setLiveUploadStatus({
        ptrsId,
        status: "uploading",
        rowsInserted: 0,
        error: null,
      });
      setLastSample(null);
      const res = await uploadCsv(ptrsId, file);
      const inserted =
        res?.data?.rowsInserted ?? res?.rowsInserted ?? rowsInserted ?? 0;
      showAlert(`Ingested ${inserted} rows`, "success");
      // Fetch a small sample to confirm rows landed
      const sampleRes = await getRunSample(ptrsId, {
        datasetId: res?.id,
        limit: 10,
        offset: 0,
      });
      setLastSample(sampleRes || null);
    } catch (e) {
      setLiveUploadStatus((prev) => ({
        ptrsId,
        status: "failed",
        rowsInserted: Number(prev?.rowsInserted || 0),
        error: e?.message || "Upload failed",
      }));
      showAlert(e?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload CSV
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Typography variant="body2" color="text.secondary">
          PTRS ID: {ptrsId || <em>none</em>}
        </Typography>

        <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={!ptrsId || isUploading}
        >
          {isUploading ? "Uploading…" : "Start ingest"}
        </Button>

        {liveUploadStatus && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              {uploadStatus === "FAILED"
                ? uploadError || "Upload failed"
                : uploadStatus === "COMPLETE"
                  ? "Upload complete"
                  : "Uploading CSV..."}
            </Typography>

            {updatedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Last update: {new Date(updatedAt).toLocaleTimeString("en-AU")}
              </Typography>
            )}

            <LinearProgress
              variant={
                totalRows > 0
                  ? "determinate"
                  : uploadStatus === "COMPLETE"
                    ? "determinate"
                    : "indeterminate"
              }
              value={
                totalRows > 0
                  ? progressPct
                  : uploadStatus === "COMPLETE"
                    ? 100
                    : 0
              }
              sx={{ height: 10, borderRadius: 1, mb: 1 }}
            />

            <Typography variant="body2" color="text.secondary">
              Rows inserted: {rowsInserted.toLocaleString("en-AU")}
              {totalRows > 0 ? ` / ${totalRows.toLocaleString("en-AU")}` : ""}
              {totalRows > 0 ? ` (${progressPct}%)` : ""}
            </Typography>
          </Box>
        )}

        {lastSample && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Sample rows received: {lastSample?.rows?.length || 0} • total
              staged ~ {lastSample?.total ?? 0}
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1,
                bgcolor: theme.palette.action.hover,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(lastSample, null, 2)}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
