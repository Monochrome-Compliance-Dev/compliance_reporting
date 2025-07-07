import ReactDOM from "react-dom/client";
import AppRouter from "./app/AppRouter";
import { HelmetProvider } from "react-helmet-async";

import { AlertProvider, AuthProvider, ReportProvider } from "./context/";
// import { userService } from "./services";
// import { redirect } from "react-router";

// Sentry logging
// TODO: Uncomment and configure Sentry
// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";

// // Optional: import.meta.env.MODE for Vite, process.env.NODE_ENV for others
// Sentry.init({
//   dsn: "https://your-public-key@o123456.ingest.sentry.io/project-id", // Replace this with your real DSN
//   integrations: [new BrowserTracing()],
//   tracesSampleRate: 1.0,
//   environment: process.env.NODE_ENV || "development",
// });

// if (process.env.REACT_APP_GOOGLE_API_KEY) {
//   const script = document.createElement("script");
//   script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&libraries=places`;
//   script.async = true;
//   script.defer = true;
//   document.head.appendChild(script);
// }

startApp();

function startApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <HelmetProvider>
      <AuthProvider>
        <AlertProvider>
          <ReportProvider>
            <AppRouter />
          </ReportProvider>
        </AlertProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
