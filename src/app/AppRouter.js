// AppRouter.js
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "lib/utils/queryClient";
import Layout from "components/layouts/Layout";
import RootErrorBoundary from "components/navigation/RootErrorBoundary";
import Fallback from "components/common/Fallback";
import LandingPage from "components/static/LandingPage";
import { protectedRoutes } from "routes/routeConfig";
import { publicRoutes } from "routes/publicRoutes";
import AppV2 from "v2/app/AppV2";
import { useAuthContext } from "context";

const isPublicOnlyMode =
  String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

export default function AppRouter() {
  const { isSignedIn } = useAuthContext();
  // console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
  const router = createBrowserRouter([
    {
      path: "",
      Component: Layout,
      HydrateFallback: Fallback,
      ErrorBoundary: RootErrorBoundary,
      children: [
        { index: true, Component: LandingPage },
        { path: "v2/*", Component: AppV2 },
        ...publicRoutes,
        ...(isPublicOnlyMode || isSignedIn !== true ? [] : protectedRoutes),
      ],
    },
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
