import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Button,
} from "@mui/material";

const AbnCandidateOption = ({ abnData, onApply }) => {
  const theme = useTheme();
  const { abn, name, confidence, comment } = abnData;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        backgroundColor: theme.palette.grey[100],
        p: theme.spacing(1),
        borderRadius: 1,
        mt: 1,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontWeight: 500,
          fontSize: "0.85em",
          color: theme.palette.primary.main,
        }}
      >
        Suggested ABN:
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: "0.9em",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          color: "red",
        }}
      >
        <Box sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          {abn}
        </Box>
        <Box sx={{ fontStyle: "italic", color: theme.palette.primary.main }}>
          ({name})
        </Box>
        {confidence && (
          <Box sx={{ color: theme.palette.success.main }}>{confidence}</Box>
        )}
      </Typography>
      {comment && (
        <Typography
          sx={{
            fontSize: "0.8em",
            color: theme.palette.primary.main,
          }}
        >
          Comment: {comment}
        </Typography>
      )}
      <Button
        variant="contained"
        sx={{ fontSize: "0.85em", px: 2, mt: 0.5 }}
        onClick={onApply}
      >
        Apply
      </Button>
    </Box>
  );
};

const PayeesMissingAbnTable = ({
  payeesMissingAbn,
  abnSuggestions,
  onAbnSearch,
  onAbnFix,
}) => {
  const theme = useTheme();
  if (!payeesMissingAbn || Object.keys(payeesMissingAbn).length === 0)
    return null;

  const handleApplyAbn = (payeeName, abnData) => {
    onAbnFix(payeeName, abnData.abn);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Payees Missing ABNs</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Payee Name</TableCell>
              <TableCell>Fix ABN</TableCell>
              <TableCell># Records</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(payeesMissingAbn)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([payeeName, rows]) => {
                const suggestion = abnSuggestions[payeeName];
                const candidates =
                  Array.isArray(suggestion?.candidates) &&
                  suggestion.candidates.length > 0
                    ? suggestion.candidates.map((entry) => ({
                        abn: entry["Suggested ABN"] || entry.abn,
                        name: entry["Name"] || entry.name,
                        confidence:
                          entry["Confidence Level"] || entry.confidence,
                        comment: entry["Comments"] || entry.comment,
                      }))
                    : [];
                return (
                  <TableRow key={payeeName}>
                    <TableCell>
                      {payeeName}{" "}
                      <Button
                        variant="outlined"
                        sx={{ ml: 1, fontSize: "0.9em", py: "2px", px: "8px" }}
                        disabled={suggestion?.loading}
                        onClick={() => onAbnSearch(payeeName)}
                      >
                        {suggestion?.loading ? "Searching..." : "Search ABN"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        placeholder="Enter valid ABN"
                        onBlur={(e) =>
                          onAbnFix(payeeName, e.target.value.trim())
                        }
                        style={{ width: "100%" }}
                      />
                      {suggestion?.loading ? (
                        <div
                          style={{
                            fontSize: "0.9em",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          Searching for ABN...
                        </div>
                      ) : suggestion?.candidates?.length === 0 ? (
                        <div
                          style={{
                            fontSize: "0.9em",
                            color: theme.palette.text.disabled,
                          }}
                        >
                          No ABN matches found
                        </div>
                      ) : null}
                      {suggestion?.candidates?.length > 0 &&
                        candidates.map((abnData, index) => (
                          <AbnCandidateOption
                            key={index}
                            abnData={abnData}
                            onApply={() => handleApplyAbn(payeeName, abnData)}
                          />
                        ))}
                      {suggestion?.error && (
                        <Typography
                          sx={{
                            color: theme.palette.error.main,
                            fontSize: "0.9em",
                          }}
                        >
                          {suggestion.error}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{rows.length}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PayeesMissingAbnTable;
