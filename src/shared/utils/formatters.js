export function formatIsoDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}
export function formatDateForSQL(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "-";
  return `$${Number(amount).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
