export function calculateFinalMetrics(dataset) {
  // Define the SBTCP dataset by filtering the input dataset
  const sbtcpDataset = dataset.filter(
    (record) =>
      record.isSb &&
      !record.isPartial &&
      !record.excludedTcp &&
      record.isTcp &&
      !record.partialPayment &&
      !record.excludedTcp &&
      record.isSb
  );
  console.log("SBTCP Dataset:", sbtcpDataset);

  // Ensure the dataset is not empty and contains valid paymentTerm values
  const paymentTerms = sbtcpDataset
    .map((record) => Number(record.paymentTerm)) // Normalize to numbers
    .filter((term) => !isNaN(term)); // Exclude invalid numbers

  if (paymentTerms.length === 0) {
    console.warn("No valid payment terms found in the SBTCP dataset.");
    return {
      mostCommonPaymentTerm: null,
      rangeMin: null,
      rangeMax: null,
      expectedMostCommonPaymentTerm: null,
      expectedRangeMin: null,
      expectedRangeMax: null,
      averagePaymentTime: null,
      medianPaymentTime: null,
      percentile80: null,
      percentile95: null,
      paidWithinTermsPercent: null,
      paidWithin30DaysPercent: null,
      paid31To60DaysPercent: null,
      paidOver60DaysPercent: null,
    };
  }

  // Calculate the most common payment term (statistical mode)
  const mostCommonPaymentTerm = calculateMode(paymentTerms);

  // Group by payerEntityName and calculate the mode for each group
  const groupedModes = {};
  sbtcpDataset.forEach((record) => {
    const payer = record.payerEntityName;
    if (!groupedModes[payer]) groupedModes[payer] = [];
    groupedModes[payer].push(Number(record.paymentTerm));
  });

  const entityModes = Object.values(groupedModes).map((terms) =>
    calculateMode(terms.filter((term) => !isNaN(term)))
  );

  // Calculate the range (minimum and maximum) of the most common payment terms
  const rangeMin = Math.min(...entityModes);
  const rangeMax = Math.max(...entityModes);

  // Use current period metrics for next period's estimates
  const expectedMostCommonPaymentTerm = mostCommonPaymentTerm;
  const expectedRangeMin = rangeMin;
  const expectedRangeMax = rangeMax;

  // Ensure the dataset is not empty and contains valid paymentTime values
  const paymentTimes = sbtcpDataset
    .map((record) => Number(record.paymentTime)) // Normalize to numbers
    .filter((time) => !isNaN(time)); // Exclude invalid numbers

  if (paymentTimes.length === 0) {
    console.warn("No valid payment times found in the SBTCP dataset.");
    return {
      mostCommonPaymentTerm,
      rangeMin,
      rangeMax,
      expectedMostCommonPaymentTerm,
      expectedRangeMin,
      expectedRangeMax,
      averagePaymentTime: null,
      medianPaymentTime: null,
      percentile80: null,
      percentile95: null,
      paidWithinTermsPercent: null,
      paidWithin30DaysPercent: null,
      paid31To60DaysPercent: null,
      paidOver60DaysPercent: null,
    };
  }

  // Calculate average payment time
  const averagePaymentTime =
    paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length;

  // Calculate median payment time
  const medianPaymentTime = calculateMedian(paymentTimes);

  // Calculate 80th and 95th percentiles
  const percentile80 = calculatePercentile(paymentTimes, 0.8);
  const percentile95 = calculatePercentile(paymentTimes, 0.95);

  // Calculate percentages for payment time categories
  const totalPayments = sbtcpDataset.length;
  const paidWithinTermsPercent =
    (sbtcpDataset.filter((record) => record.paymentTime <= record.paymentTerm)
      .length /
      totalPayments) *
    100;
  const paidWithin30DaysPercent =
    (sbtcpDataset.filter((record) => record.paymentTime <= 30).length /
      totalPayments) *
    100;
  const paid31To60DaysPercent =
    (sbtcpDataset.filter(
      (record) => record.paymentTime > 30 && record.paymentTime <= 60
    ).length /
      totalPayments) *
    100;
  const paidOver60DaysPercent =
    (sbtcpDataset.filter((record) => record.paymentTime > 60).length /
      totalPayments) *
    100;

  return {
    mostCommonPaymentTerm,
    rangeMin,
    rangeMax,
    expectedMostCommonPaymentTerm,
    expectedRangeMin,
    expectedRangeMax,
    averagePaymentTime,
    medianPaymentTime,
    percentile80,
    percentile95,
    paidWithinTermsPercent,
    paidWithin30DaysPercent,
    paid31To60DaysPercent,
    paidOver60DaysPercent,
  };
}

// Helper function to calculate the mode of an array
function calculateMode(arr) {
  const frequency = {};
  let maxFreq = 0;
  let mode = null;

  for (const value of arr) {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  }

  return mode;
}

// Helper function to calculate the median of an array
function calculateMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Helper function to calculate a percentile of an array
function calculatePercentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[index];
}
