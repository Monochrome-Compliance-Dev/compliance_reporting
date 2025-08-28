import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  TablePagination,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router";
import { getRowHighlightColor } from "../../../lib/utils/";
import { calculatePaymentTime } from "../../../lib/calculations/ptrs";

export default function Step4({
  savedRecords = [],
  tcpDataset = [],
  onNext,
  onBack,
  reportId,
  reportStatus,
  setStepData,
}) {
  React.useEffect(() => {
    if (reportStatus !== "Submitted" && setStepData) {
      setStepData((prev) => ({ ...prev, step4: { sbiUploaded: true } }));
    }
  }, [reportStatus, setStepData]);
  const navigate = useNavigate();
  // Use savedRecords or tcpDataset as appropriate for the dataset
  const dataset =
    tcpDataset && tcpDataset.length > 0 ? tcpDataset : savedRecords;
  const [records, setRecords] = useState(
    dataset.map((record) => ({
      ...record,
      paymentTime: calculatePaymentTime(record), // Add calculated paymentTime field
    }))
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isLocked = reportStatus === "Submitted";

  const handleSearch = (event) => {
    const lowerCaseSearchTerm = event.target.value.toLowerCase();
    setSearchTerm(lowerCaseSearchTerm);

    setRecords(
      tcpDataset
        .map((record) => ({
          ...record,
          paymentTime: calculatePaymentTime(record),
        }))
        .filter((record) =>
          Object.values(record)
            .join(" ")
            .toLowerCase()
            .includes(lowerCaseSearchTerm)
        )
    );
  };

  const displayedRecords = useMemo(
    () => records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [records, page, rowsPerPage]
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const MemoizedTableRow = React.memo(({ record }) => (
    <TableRow
      key={record.id}
      sx={{
        backgroundColor: getRowHighlightColor(record, {}),
      }}
    >
      <TableCell>{record.payerEntityName || "-"}</TableCell>
      <TableCell>{record.payerEntityAbn || "-"}</TableCell>
      <TableCell>{record.payerEntityAcnArbn || "-"}</TableCell>
      <TableCell>{record.payeeEntityName || "-"}</TableCell>
      <TableCell>{record.payeeEntityAbn || "-"}</TableCell>
      <TableCell>{record.payeeEntityAcnArbn || "-"}</TableCell>
      <TableCell>{record.paymentAmount || "-"}</TableCell>
      <TableCell>{record.description || "-"}</TableCell>
      <TableCell>{record.supplyDate || "-"}</TableCell>
      <TableCell>{record.paymentDate || "-"}</TableCell>
      <TableCell>{record.contractPoReferenceNumber || "-"}</TableCell>
      <TableCell>{record.contractPoPaymentTerms || "-"}</TableCell>
      <TableCell>{record.noticeForPaymentIssueDate || "-"}</TableCell>
      <TableCell>{record.noticeForPaymentTerms || "-"}</TableCell>
      <TableCell>{record.invoiceReferenceNumber || "-"}</TableCell>
      <TableCell>{record.invoiceIssueDate || "-"}</TableCell>
      <TableCell>{record.invoiceReceiptDate || "-"}</TableCell>
      <TableCell>{record.invoiceAmount || "-"}</TableCell>
      <TableCell>{record.invoicePaymentTerms || "-"}</TableCell>
      <TableCell>{record.invoiceDueDate || "-"}</TableCell>
      <TableCell>{record.peppolEnabled ? "Yes" : "No"}</TableCell>
      <TableCell>{record.rcti ? "Yes" : "No"}</TableCell>
      <TableCell>{record.creditCardPayment ? "Yes" : "No"}</TableCell>
      <TableCell>{record.creditCardNumber || "-"}</TableCell>
      <TableCell>{record.partialPayment ? "Yes" : "No"}</TableCell>
      <TableCell>{record.paymentTerm || "-"}</TableCell>
      <TableCell>{record.excludedTcp ? "Yes" : "No"}</TableCell>
      <TableCell>{record.notes || "-"}</TableCell>
      <TableCell>{record.isSb ? "Yes" : "No"}</TableCell>
      <TableCell>{record.paymentTime ?? "-"}</TableCell>
    </TableRow>
  ));

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Step 4: Review and Update TCP Records
      </Typography>
      {isLocked && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This report has already been submitted and cannot be edited.
        </Alert>
      )}
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearch}
        sx={{ marginBottom: 2 }}
        disabled={isLocked}
      />
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "Payer Entity Name",
                "Payer Entity ABN",
                "Payer Entity ACN/ARBN",
                "Payee Entity Name",
                "Payee Entity ABN",
                "Payee Entity ACN/ARBN",
                "Payment Amount",
                "Description",
                "Supply Date",
                "Payment Date",
                "Contract PO Reference Number",
                "Contract PO Payment Terms",
                "Notice for Payment Issue Date",
                "Notice for Payment Terms",
                "Invoice Reference Number",
                "Invoice Issue Date",
                "Invoice Receipt Date",
                "Invoice Amount",
                "Invoice Payment Terms",
                "Invoice Due Date",
                "Peppol eInvoice Enabled",
                "RCTI",
                "Credit Card Payment",
                "Credit Card Number",
                "Partial Payment",
                "Payment Term",
                "Excluded TCP",
                "Notes",
                "Is Small Business",
                "Payment Time",
              ].map((label, index) => (
                <TableCell key={index}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRecords.map((record) => (
              <MemoizedTableRow key={record.id} record={record} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={records.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            if (onNext) {
              onNext();
            } else {
              navigate(`/reports/ptrs/step5/${reportId}`);
            }
          }}
          disabled={isLocked}
        >
          Next: Step 5
        </Button>
      </Box>
    </Box>
  );
}
