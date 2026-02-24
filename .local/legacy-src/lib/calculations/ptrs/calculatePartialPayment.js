export const partialPaymentCalculation = [
  {
    name: "Partial Payment",
    conditions: [
      {
        condition: "Single payment amount is less than invoice amount",
        description:
          "If there is a single payment amount and it is less than the invoice amount, it is considered a partial payment.",
      },
      {
        condition:
          "If there are multiple payments, only the payment that discharges the invoice amount is considered to be a complete payment, the other payments are considered partial payments.",
        example:
          "INV-1015 has an invoiceAmount of $20,000 and two payments. The first payment is for $5,000 and the second payment is for $15,000. The first payment is a partial payment, while the second payment discharges the invoice amount and should be recorded as partialPayment = false.",
      },
    ],
  },
];

/**
 * Calculate whether a payment is a partial payment.
 * @param {number} paymentAmount - The amount of the payment.
 * @param {number} invoiceAmount - The total invoice amount.
 * @param {Array<{ amount: number, date: Date, invoiceReferenceNumber: string }>} payments - An array of all payments for the invoice, including their amounts, dates, and invoice references.
 * @returns {{ partialPayment: boolean, invoiceReferenceNumber: string }} - Returns an object containing the partial payment status and the invoice reference number.
 */
export function calculatePartialPayment(
  paymentAmount,
  invoiceAmount,
  payments
) {
  // Group payments by invoiceReferenceNumber
  const groupedPayments = payments.reduce((acc, payment) => {
    const key = payment.invoiceReferenceNumber;
    if (!key) {
      return acc; // Skip payments without a valid invoiceReferenceNumber
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(payment);
    return acc;
  }, {});

  // Process each group of payments
  for (const [invoiceReferenceNumber, invoicePayments] of Object.entries(
    groupedPayments
  )) {
    // Ensure the group has more than one payment before flagging
    if (invoicePayments.length <= 1) {
      // If there is only one payment, check if it is less than the invoice amount
      if (paymentAmount < invoiceAmount) {
        return { partialPayment: true, invoiceReferenceNumber }; // Single payment is partial
      }
      return { partialPayment: false, invoiceReferenceNumber }; // Single payment clears the invoice
    }

    // Sort payments by date in ascending order
    const sortedPayments = invoicePayments.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate the cumulative total of payments
    let cumulativeTotal = 0;
    for (let i = 0; i < sortedPayments.length; i++) {
      cumulativeTotal += sortedPayments[i].amount;

      // If the cumulative total matches the invoice amount
      if (cumulativeTotal === invoiceAmount) {
        // If this is the last payment in the sorted list, it is not partial
        if (
          sortedPayments[i].amount === paymentAmount &&
          i === sortedPayments.length - 1
        ) {
          return { partialPayment: false, invoiceReferenceNumber }; // This payment clears the invoice
        }
        return { partialPayment: true, invoiceReferenceNumber }; // All other payments are partial
      }
    }
  }

  // If no matching invoice amount is found or the record lacks an invoiceReferenceNumber
  if (paymentAmount < invoiceAmount) {
    return { partialPayment: true, invoiceReferenceNumber: null }; // Payment is partial
  }
  return { partialPayment: false, invoiceReferenceNumber: null }; // Payment clears the invoice
}
