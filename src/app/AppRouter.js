// Updated AppRouter.js to align with new /user, /admin, /boss structure
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "../components/layouts/Layout";
import RootErrorBoundary from "../components/navigation/RootErrorBoundary";
import Fallback from "../components/common/Fallback";
import LandingPage from "../components/common/LandingPage";
import { protectedRoutes } from "../routes/routeConfig";
import { publicRoutes } from "../routes/publicRoutes";

const isPublicOnlyMode = process.env.REACT_APP_PUBLIC_ONLY === "false";

export default function AppRouter() {
  const router = createBrowserRouter([
    {
      path: "",
      Component: Layout,
      HydrateFallback: Fallback,
      ErrorBoundary: RootErrorBoundary,
      children: [
        { index: true, Component: LandingPage },
        ...publicRoutes,
        ...(isPublicOnlyMode ? [] : protectedRoutes),
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
