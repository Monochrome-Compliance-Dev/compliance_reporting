export const findOrReduceSummary = (
  items,
  periodId,
  extractSummary,
  extractPeriodId
) => {
  if (!items || items.length === 0) return {};

  if (!periodId || periodId === "all") {
    // Reduce all summaries into one
    return items.reduce((acc, item) => {
      const summary = extractSummary(item);
      for (const [key, value] of Object.entries(summary)) {
        acc[key] = (acc[key] || 0) + value;
      }
      return acc;
    }, {});
  }

  // Find the summary for a specific period
  const item = items.find((item) => extractPeriodId(item) === periodId);
  return extractSummary(item) || {};
};

// Helpers
export function filterAnalyticsByType(summaries, type = "reportingPeriod") {
  return Array.isArray(summaries)
    ? summaries.filter((s) => s.type === type)
    : [];
}
