import { useState } from "react";
import CollapsibleTable from "./CollapsibleTable";
import { useTheme } from "@mui/material/styles";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { tcpService, userService } from "../../../services";
import { calculatePartialPayment } from "../../../lib/calculations/ptrs"; // Import the function
import {
  formatDateForMySQL,
  getRowHighlightColor,
  inputValidationRules,
} from "../../../lib/utils";

const calculatePartialPaymentsForBatch = (records) => {
  // Group payments by invoiceReferenceNumber
  const groupedPayments = records.reduce((acc, record) => {
    const key = record.invoiceReferenceNumber;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({
      amount: record.paymentAmount,
      date: record.paymentDate,
      id: record.id,
      invoiceReferenceNumber: record.invoiceReferenceNumber,
    });
    return acc;
  }, {});

  // Calculate partialPayment for each record
  return records.map((record) => {
    const payments = groupedPayments[record.invoiceReferenceNumber] || [];

    // Call calculatePartialPayment for each record
    const { partialPayment, invoiceReferenceNumber } = calculatePartialPayment(
      record.paymentAmount,
      record.invoiceAmount,
      payments
    );

    return {
      ...record,
      partialPayment,
      invoiceReferenceNumber,
    };
  });
};

export default function Step2({
  savedRecords = [],
  onNext,
  onBack,
  reportId,
  reportStatus,
}) {
  const isLocked = reportStatus === "Submitted";
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  // console.log("Saved records:", savedRecords);
  const [filteredRecords, setFilteredRecords] = useState(
    savedRecords.filter((record) => record.isTcp) // Filter records with isTcp = true
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [changedRows, setChangedRows] = useState(() =>
    savedRecords.reduce((acc, record) => {
      acc[record.id] = false; // Initialize rows as unchanged
      return acc;
    }, {})
  );

  const [fields, setFields] = useState(() =>
    savedRecords.reduce((acc, record) => {
      if (record.isTcp) {
        acc[record.id] = {
          peppolEnabled: record.peppolEnabled || false,
          rcti: record.rcti || false,
          creditCardPayment: record.creditCardPayment || false,
          creditCardNumber: record.creditCardNumber || "",
          partialPayment: record.partialPayment || false,
          paymentTerm: record.paymentTerm || 0,
          notes: record.notes || "",
          excludedTcp: record.excludedTcp || false, // Add excludedTcp field
        };
      }
      return acc;
    }, {})
  );

  const [validationErrors, setValidationErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPartialPaymentsOnly, setShowPartialPaymentsOnly] = useState(false);

  const validateCreditCardNumber = (id) => {
    const isCreditCardPayment = fields[id]?.creditCardPayment || false;
    const creditCardNumber = fields[id]?.creditCardNumber || "";
    if (isCreditCardPayment) {
      if (!creditCardNumber.trim()) {
        return "Credit card number is required when credit card payment is selected.";
      }
      if (!/^\d{16}$/.test(creditCardNumber)) {
        return "Credit card number must be exactly 16 digits.";
      }
    }
    return "";
  };

  const saveChangedRows = async () => {
    // Utility to get only updated fields
    function getUpdatedFields(original, current) {
      const updates = {};
      for (const key in current) {
        const currentVal = current[key];
        const originalVal = original[key];

        const isDifferent =
          currentVal !== undefined &&
          currentVal !== originalVal &&
          !(
            typeof currentVal === "string" &&
            typeof originalVal === "string" &&
            currentVal.trim() === originalVal?.trim()
          );

        if (isDifferent) {
          updates[key] = currentVal;
        }
      }
      return updates;
    }

    const rowsToSave = filteredRecords.filter(
      (record) => changedRows[record.id] === "unsaved"
    );

    const errors = {};
    rowsToSave.forEach((record) => {
      const error = validateCreditCardNumber(record.id);
      if (error) {
        errors[record.id] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setAlert({
        type: "error",
        message: "Please fix validation errors before saving.",
      });
      return;
    }

    if (rowsToSave.length > 0) {
      const updatedRecords = rowsToSave.map((record) => {
        const { createdAt, updatedAt, ...cleanRecord } = record;
        const original = savedRecords.find((r) => r.id === record.id) || {};

        const patch = getUpdatedFields(original, {
          ...cleanRecord,
          paymentDate: formatDateForMySQL(record.paymentDate),
          supplyDate: formatDateForMySQL(record.supplyDate),
          invoiceIssueDate: formatDateForMySQL(record.invoiceIssueDate),
          invoiceReceiptDate: formatDateForMySQL(record.invoiceReceiptDate),
          invoiceDueDate: formatDateForMySQL(record.invoiceDueDate),
          noticeForPaymentIssueDate: formatDateForMySQL(
            record.noticeForPaymentIssueDate
          ),
          tcpExclusionComment:
            typeof record.tcpExclusionComment === "string" &&
            record.tcpExclusionComment.trim() === ""
              ? null
              : record.tcpExclusionComment,
          ...fields[record.id],
        });

        return {
          id: record.id,
          ...patch,
          updatedBy: userService.userValue.id,
        };
      });

      try {
        console.log("Saving updated records:", updatedRecords);
        const results = await Promise.all(
          updatedRecords.map((record) =>
            tcpService.patchRecord(record.id, record)
          )
        );
        setAlert({
          type: "success",
          message: "Changed records saved successfully.",
        });
        setChangedRows((prev) =>
          rowsToSave.reduce(
            (acc, row) => {
              acc[row.id] = "saved"; // Mark saved rows as successfully saved
              return acc;
            },
            { ...prev }
          )
        );
        setFields((prev) =>
          rowsToSave.reduce(
            (acc, row) => {
              acc[row.id] = {
                ...prev[row.id],
                updatedAt: new Date().toISOString(), // Update the updatedAt timestamp
              };
              return acc;
            },
            { ...prev }
          )
        );
        setValidationErrors({});
      } catch (error) {
        console.error("Error saving changed records:", error);
        setChangedRows((prev) =>
          rowsToSave.reduce(
            (acc, row) => {
              acc[row.id] = "error"; // Mark rows with save errors
              return acc;
            },
            { ...prev }
          )
        );
        setAlert({
          type: "error",
          message: "An error occurred while saving changed records.",
        });
      }
    }
  };

  const handleFieldChange = (id, field, value) => {
    setFields((prev) => {
      const updatedFields = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      };

      // Apply validation based on inputValidationRules
      const validationRule = inputValidationRules[field];
      if (validationRule) {
        const fieldName = validationRule.headerName || field; // Use headerName if available
        if (validationRule.type === "number" && isNaN(value)) {
          setAlert({
            type: "error",
            message: `${fieldName} must be a number.`,
          });
          return prev; // Reject invalid input
        }
        if (
          validationRule.type === "integer" &&
          (!Number.isInteger(+value) ||
            value < validationRule.min ||
            value > validationRule.max)
        ) {
          setAlert({
            type: "error",
            message: `${fieldName} must be an integer between ${validationRule.min} and ${validationRule.max}.`,
          });
          return prev; // Reject invalid input
        }
        if (validationRule.pattern && !validationRule.pattern.test(value)) {
          setAlert({
            type: "error",
            message: `${fieldName} contains invalid characters.`,
          });
          return prev; // Reject invalid input
        }
      }

      // Automatically set creditCardPayment to true if creditCardNumber has a value
      if (field === "creditCardNumber") {
        updatedFields[id].creditCardPayment = value.trim() ? true : false;
      }

      // Ensure paymentTerm is a positive integer with a maximum of three digits
      if (field === "paymentTerm") {
        const sanitizedValue = Math.max(
          0,
          Math.min(999, parseInt(value, 10) || 0)
        );
        updatedFields[id].paymentTerm = sanitizedValue;
      }

      // Check if the field value has changed compared to the original record
      const originalRecord = savedRecords.find((record) => record.id === id);
      const originalValue = originalRecord?.[field];
      const originalCreditCardNumber = originalRecord?.creditCardNumber || "";
      const originalCreditCardPayment =
        originalRecord?.creditCardPayment || false;

      const isCreditCardNumberChanged =
        field === "creditCardNumber" &&
        (value !== originalCreditCardNumber ||
          updatedFields[id].creditCardPayment !== originalCreditCardPayment);

      const isChanged = isCreditCardNumberChanged || value !== originalValue;

      setChangedRows((prev) => ({
        ...prev,
        [id]: isChanged ? "unsaved" : false, // Mark as unsaved if changed, otherwise reset
      }));

      return updatedFields;
    });
  };

  const handleSearch = (event) => {
    const lowerCaseSearchTerm = event.target.value.toLowerCase();
    setSearchTerm(lowerCaseSearchTerm);
    setFilteredRecords(
      savedRecords
        .filter((record) => record.isTcp) // Ensure only isTcp = true records are filtered
        .filter((record) =>
          Object.values(record)
            .join(" ")
            .toLowerCase()
            .includes(lowerCaseSearchTerm)
        )
    );
  };

  const togglePartialPaymentsFilter = () => {
    setShowPartialPaymentsOnly((prev) => !prev);
  };

  const filteredRecordsToDisplay = showPartialPaymentsOnly
    ? (() => {
        // Identify all invoiceReferenceNumbers with at least one partial payment
        const invoicesWithPartialPayments = new Set(
          filteredRecords
            .filter((record) => record.partialPayment)
            .map((record) => record.invoiceReferenceNumber)
        );

        // Include all payments associated with those invoices
        const relevantRecords = filteredRecords.filter((record) =>
          invoicesWithPartialPayments.has(record.invoiceReferenceNumber)
        );

        // Sort by invoiceReferenceNumber and then paymentDate
        return relevantRecords.sort((a, b) => {
          if (a.invoiceReferenceNumber === b.invoiceReferenceNumber) {
            return new Date(a.paymentDate) - new Date(b.paymentDate);
          }
          return a.invoiceReferenceNumber.localeCompare(
            b.invoiceReferenceNumber
          );
        });
      })()
    : filteredRecords;

  const displayedRecords = filteredRecordsToDisplay.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = async (event, newPage) => {
    await saveChangedRows();
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ padding: 2 }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      {isLocked && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This report has already been submitted and cannot be edited.
        </Alert>
      )}
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Step 2: Capture Additional Details
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={togglePartialPaymentsFilter}
        sx={{ marginBottom: 2 }}
        disabled={isLocked}
      >
        {showPartialPaymentsOnly
          ? "Show All Payments"
          : "Show Partial Payments Only"}
      </Button>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearch}
        sx={{ marginBottom: 2 }}
        disabled={isLocked}
      />
      <CollapsibleTable
        records={displayedRecords}
        fields={fields}
        setFields={setFields}
        changedRows={changedRows}
        setChangedRows={setChangedRows}
        validationErrors={validationErrors}
        handleFieldChange={handleFieldChange}
        getRowHighlightColor={getRowHighlightColor}
        isLocked={isLocked}
        theme={theme}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={saveChangedRows}
          sx={{ marginRight: 2 }}
          disabled={isLocked}
        >
          Save All Changes
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={async () => {
            await saveChangedRows();
            if (onNext) {
              onNext();
            } else {
              navigate(`/reports/ptrs/step3/${reportId}`);
            }
          }}
          disabled={isLocked}
        >
          Next: Step 3
        </Button>
      </Box>
    </Box>
  );
}
