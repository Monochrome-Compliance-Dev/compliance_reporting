const isProd = process.env.NODE_ENV === "production";

export const log = (...args) => {
  if (!isProd) console.log(...args);
};

export const warn = (...args) => {
  if (!isProd) console.warn(...args);
};

export const error = (...args) => {
  // Always send to console in dev; in prod, send to remote logging service if needed
  console.error(...args);

  // Optionally: send to backend or monitoring service like Sentry
  // fetch("/log-client-error", { method: "POST", body: JSON.stringify({ args }) });
};
