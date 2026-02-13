// AppRouter.js
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "shared/layouts/Layout";
import RootErrorBoundary from "shared/navigation/RootErrorBoundary";
import { protectedRoutes, publicRoutes } from "./routes";
import { queryClient } from "shared/utils";
import Fallback from "shared/components/Fallback";
import { LandingPage } from "slices/public/static";

const router = createBrowserRouter([
  {
    path: "",
    Component: Layout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: LandingPage },
      ...publicRoutes,
      ...protectedRoutes,
    ],
  },
]);

export default function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} fallbackElement={<Fallback />} />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
