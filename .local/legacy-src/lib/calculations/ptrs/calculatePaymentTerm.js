export const paymentTermCalculations = [
  {
    name: "Payment Term",
    conditions: [
      {
        condition: "Contract/PO payment terms",
        paymentTerm:
          "Largest possible number of calendar days (regardless of when the invoice was actually issued or received), if applicable.",
        example:
          "'EOM' would have a Payment Term of 31 days, 'End of Next Month' would have a Payment Term of 62 days, etc.)",
      },
      {
        condition: "Invoice payment terms.",
        paymentTerm: "The largest possible number of calendar days.",
      },
      {
        condition: "Neither of the above apply.",
        paymentTerm:
          "The number of calendar days between the Invoice issue date and the Invoice due date..",
      },
    ],
  },
];

/**
 * Calculate the Payment Term value based on the provided data.
 * @param {Object} data - The input data containing contractPoPaymentTerms, invoicePaymentTerms, invoiceIssueDate, and invoiceDueDate.
 * @returns {number} - The calculated Payment Term value in calendar days.
 */
export function calculatePaymentTerm(data) {
  const {
    contractPoPaymentTerms,
    invoicePaymentTerms,
    invoiceIssueDate,
    invoiceDueDate,
  } = data;

  // Check for Contract/PO payment terms
  if (contractPoPaymentTerms) {
    if (contractPoPaymentTerms.toLowerCase() === "eom") {
      return 31; // End of Month
    } else if (contractPoPaymentTerms.toLowerCase() === "end of next month") {
      return 62; // End of Next Month
    } else if (contractPoPaymentTerms.toLowerCase() === "immediate") {
      return 0; // Immediate
    } else if (contractPoPaymentTerms.toLowerCase() === "net 7") {
      return 7; // NET 7
    } else if (contractPoPaymentTerms.toLowerCase() === "net 14") {
      return 14; // NET 14
    } else if (contractPoPaymentTerms.toLowerCase() === "net 30") {
      return 30; // NET 30
    } else if (contractPoPaymentTerms.toLowerCase() === "net 60") {
      return 60; // NET 60
    }
  }

  // Check for Invoice payment terms
  if (invoicePaymentTerms) {
    if (invoicePaymentTerms.toLowerCase() === "eom") {
      return 31; // End of Month
    } else if (invoicePaymentTerms.toLowerCase() === "end of next month") {
      return 62; // End of Next Month
    } else if (invoicePaymentTerms.toLowerCase() === "immediate") {
      return 0; // Immediate
    } else if (invoicePaymentTerms.toLowerCase() === "net 7") {
      return 7; // NET 7
    } else if (invoicePaymentTerms.toLowerCase() === "net 14") {
      return 14; // NET 14
    } else if (invoicePaymentTerms.toLowerCase() === "net 30") {
      return 30; // NET 30
    } else if (invoicePaymentTerms.toLowerCase() === "net 60") {
      return 60; // NET 60
    }
  }

  // Default case: Calculate the number of calendar days between Invoice issue date and Invoice due date
  if (invoiceIssueDate && invoiceDueDate) {
    const issueDate = new Date(invoiceIssueDate);
    const dueDate = new Date(invoiceDueDate);
    const diffDays = (dueDate - issueDate) / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays) + 1; // Use floor instead of ceil because we’re forcibly including the start day
  }

  // Return 99 if no conditions are met
  return 99;
}
