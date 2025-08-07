import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router"; // react-router, not react-router-dom
import { Typography, Container, Box, LinearProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { xeroService } from "../../services/xero/xero";

export const XeroConnectSuccess = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { reportId } = useParams();

  const timerRef = useRef(null);
  const startedRef = useRef(false);
  const scrollRef = useRef(null);

  const [progressMessage, setProgressMessage] = useState("");
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressHistory, setProgressHistory] = useState([]);
  const [missingInvoices, setMissingInvoices] = useState([]);
  const [progressData, setProgressData] = useState({
    current: 0,
    total: 0,
    eta: null,
  });
  const [retryCountdown, setRetryCountdown] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let unsubscribe = null;
    try {
      unsubscribe = xeroService.subscribeToProgressUpdates((data) => {
        // console.log("Progress update received:", data);
        const { message, current, total, eta, retryDelay, status } = data;
        const isError = status === "error";
        const isWarning = status === "warn";

        if (!startedRef.current) {
          startedRef.current = true;
          const now = Date.now();
          setStartTime(now);
          setElapsedSeconds(0);
          timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
          }, 1000);
          // Note: The cleanup for this timer should be handled in useEffect return, but here we can't return from inside callback
          // So we store timer id in ref or ignore cleanup for simplicity
        }

        if (retryDelay) {
          let seconds = retryDelay;
          setRetryCountdown(seconds);
          const countdownInterval = setInterval(() => {
            seconds--;
            setRetryCountdown(seconds);
            if (seconds <= 0) {
              clearInterval(countdownInterval);
              setRetryCountdown(null);
            }
          }, 1000);
        }

        if (!/Xero API request/.test(message)) {
          setProgressHistory((prev) => [
            ...prev,
            isError
              ? `[ERROR] ${message}`
              : isWarning
                ? `[WARN] ${message}`
                : `[INFO] ${message}`,
          ]);
        }

        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        setProgressMessage(message || "");
        setProgressOpen(true);
        setProgressData({
          current: current || 0,
          total: total || 0,
          eta: eta || null,
        });
      });
    } catch (err) {
      console.error("Failed to subscribe to progress updates:", err);
    }

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [startTime]);

  useEffect(() => {
    if (
      progressMessage === "Transformed TCP records saved successfully" &&
      reportId
    ) {
      const timeout = setTimeout(() => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setProgressMessage(
          "✅ Extraction complete. You can now return to the report."
        );
        setProgressOpen(true);
        // navigate(`/reports/ptrs/${reportId}`);
      }, 2000); // optional delay to allow user to see the success message
      return () => clearTimeout(timeout);
    }
  }, [progressMessage, reportId, navigate]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        marginTop: theme.spacing(8),
        textAlign: "center",
        position: "relative",
      }}
    >
      {progressOpen && (
        <>
          <Typography
            variant="h6"
            gutterBottom
            color={
              progressMessage.includes("[ERROR]") ? "error" : "textPrimary"
            }
          >
            {progressMessage}
          </Typography>
          <Box mt={4}>
            <Typography variant="h6">
              Progress: {progressData.current} of {progressData.total}
              {progressData.eta && <> – ETA: {progressData.eta}</>}
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                padding: 1,
                backgroundColor: "background.paper",
                minHeight: 10,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={
                  progressData.total > 0
                    ? (progressData.current / progressData.total) * 100
                    : 0
                }
                sx={{
                  height: 10,
                  borderRadius: 1,
                  backgroundColor: theme.palette.divider,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "background.paper",
                  },
                }}
              />
            </Box>
            {progressData.total > 0 && (
              <Typography variant="body2" mt={1}>
                {progressData.current} of {progressData.total}
              </Typography>
            )}

            <Typography variant="body2" mt={1}>
              Elapsed time: {elapsedSeconds}s
            </Typography>

            {progressData.total > 0 &&
              elapsedSeconds > 0 &&
              progressData.current > 0 && (
                <Typography variant="body2" mt={1}>
                  ETA: ~
                  {Math.round(
                    (progressData.total - progressData.current) /
                      (progressData.current / elapsedSeconds)
                  )}
                  s
                </Typography>
              )}

            {retryCountdown !== null && !isNaN(retryCountdown) && (
              <Typography variant="body2" color="info.main" mt={1}>
                Retrying in {retryCountdown}s...
              </Typography>
            )}
          </Box>
          <Box
            mt={2}
            sx={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: 1,
              borderRadius: 1,
              whiteSpace: "pre-wrap",
              overflowY: "auto",
              maxHeight: 150,
              fontFamily: "monospace",
              fontSize: 12,
              border: "1px solid #444",
              textAlign: "left",
            }}
            ref={scrollRef}
          >
            {progressHistory.join("\n")}
          </Box>
        </>
      )}
      {missingInvoices.length > 0 && (
        <Box
          mt={4}
          sx={{
            fontFamily: "monospace",
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            padding: 2,
            borderRadius: 1,
            whiteSpace: "pre-wrap",
            overflowY: "auto",
            maxHeight: "300px",
            boxShadow: 2,
            border: "1px solid #333",
            textAlign: "left",
          }}
        >
          {`⚠️  Some invoices could not be retrieved:\n\n${missingInvoices
            .map((inv, i) => `  ${i + 1}. ID: ${inv.invoiceId} — ${inv.reason}`)
            .join("\n")}`}
        </Box>
      )}
    </Container>
  );
};

export default XeroConnectSuccess;
