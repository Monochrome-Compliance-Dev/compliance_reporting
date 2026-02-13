import ReactDOM from "react-dom/client";
import AppRouter from "./app/AppRouter";
import { HelmetProvider } from "react-helmet-async";

import { AlertProvider, AuthProvider } from "context/";
import GlobalPrintStyles from "./shared/theme/GlobalPrintStyles";

startApp();

function startApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <HelmetProvider>
      <AlertProvider>
        <AuthProvider>
          <GlobalPrintStyles />
          <AppRouter />
        </AuthProvider>
      </AlertProvider>
    </HelmetProvider>,
  );
}
