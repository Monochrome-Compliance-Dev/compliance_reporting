// Tiny utility to turn computed insights into plain-English summaries (no prefix).
// Input matches computeInsights() output used by PulseMaximiserWidget.

export function generateAiSummaries(insights) {
  if (!insights || !insights.totals) return [];

  const { estimation, burnout, teamTrend } = insights;
  const parts = [];

  // 1) Estimation drift
  if (estimation) {
    const over = Number.isFinite(estimation.overrunPct)
      ? Math.round(estimation.overrunPct)
      : null;
    const mape = Number.isFinite(estimation.mape)
      ? Math.round(estimation.mape)
      : null;
    if (over !== null && mape !== null) {
      parts.push(`${over}% of tasks overran plan; average error ~${mape}%.`);
    } else if (over !== null) {
      parts.push(`${over}% of tasks overran plan.`);
    }
  }

  // 2) Burnout indicator
  if (burnout && Array.isArray(burnout.flags)) {
    const uniquePeople = Array.from(
      new Set(burnout.flags.map((f) => f.person))
    );
    if (uniquePeople.length > 0) {
      const preview = uniquePeople.slice(0, 3).join(", ");
      const more =
        uniquePeople.length > 3 ? ` +${uniquePeople.length - 3} more` : "";
      parts.push(`Sustained overwork flagged for ${preview}${more}.`);
    } else {
      parts.push("No sustained overwork detected in this sample.");
    }
  }

  // 3) Team trend driver
  if (Array.isArray(teamTrend) && teamTrend.length) {
    const top = [...teamTrend].sort((a, b) => b.avgOverrun - a.avgOverrun)[0];
    if (top && Number.isFinite(top.avgOverrun)) {
      const trend =
        top.avgOverrun > 0
          ? `+${top.avgOverrun.toFixed(1)}h`
          : `${top.avgOverrun.toFixed(1)}h`;
      parts.push(
        `Biggest delivery drift in ${top.team} (${trend} avg overrun).`
      );
    }
  }

  return parts.slice(0, 3);
}
