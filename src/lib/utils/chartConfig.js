import { getPeriodName } from "./periodUtils";

export const chartConfigs = (reportingPeriods) => ({
  supplier: {
    mapFn: (r) => ({
      period: getPeriodName(r.reportingPeriodId, reportingPeriods),
      lowRisk: r.summary["Low"] || 0,
      mediumRisk: r.summary["Medium"] || 0,
      highRisk: r.summary["High"] || 0,
    }),
    lineKeys: [
      { key: "lowRisk", stroke: "#388e3c", name: "Low Risk" },
      { key: "mediumRisk", stroke: "#f9a825", name: "Medium Risk" },
      { key: "highRisk", stroke: "#d32f2f", name: "High Risk" },
    ],
  },
  training: {
    mapFn: (t) => ({
      period: getPeriodName(t.reportingPeriodId, reportingPeriods),
      completed: t.completed || 0,
      remaining: (t.total || 0) - (t.completed || 0),
    }),
    lineKeys: [
      { key: "completed", stroke: "#388e3c", name: "Completed" },
      { key: "remaining", stroke: "#d32f2f", name: "Remaining" },
    ],
  },
  grievance: {
    mapFn: (g) => ({
      period: getPeriodName(g.reportingPeriodId, reportingPeriods),
      open: g.summary["Open"] || 0,
      closed: g.summary["Closed"] || 0,
      investigating: g.summary["Investigating"] || 0,
    }),
    lineKeys: [
      { key: "open", stroke: "#d32f2f", name: "Open" },
      { key: "investigating", stroke: "#f9a825", name: "Investigating" },
      { key: "closed", stroke: "#388e3c", name: "Closed" },
    ],
  },
});
