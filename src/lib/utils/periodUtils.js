export const getPeriodName = (periodId, periods) =>
  periods.find((p) => p.id === periodId)?.name || periodId;

export const sortByPeriodName = (a, b) => a.period.localeCompare(b.period);

export const isWithinRange = (date, start, end) => {
  const target = new Date(date);
  return target >= new Date(start) && target <= new Date(end);
};
