// AppRouter.js
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "../components/layouts/Layout";
import RootErrorBoundary from "../components/navigation/RootErrorBoundary";
import Fallback from "../components/common/Fallback";
import LandingPage from "../components/static/LandingPage";
import { protectedRoutes } from "../routes/routeConfig";
import { publicRoutes } from "../routes/publicRoutes";
import AppV2 from "../v2/app/AppV2";

const isPublicOnlyMode =
  String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function AppRouter() {
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
        ...(isPublicOnlyMode ? [] : protectedRoutes),
      ],
    },
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
