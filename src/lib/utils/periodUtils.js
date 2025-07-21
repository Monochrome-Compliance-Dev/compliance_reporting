export const getPeriodName = (periodId, periods) =>
  periods.find((p) => p.id === periodId)?.name || periodId;

export const sortByPeriodName = (a, b) => a.period.localeCompare(b.period);
