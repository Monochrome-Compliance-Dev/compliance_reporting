// Updated AppRouter.js to align with new /user, /admin, /boss structure
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "../components/layout/Layout";
import RootErrorBoundary from "../components/navigation/RootErrorBoundary";
import Fallback from "../components/common/Fallback";
import LandingPage from "../components/common/LandingPage";
import { protectedRoutes } from "../routes/routeConfig";
import { publicRoutes } from "../routes/publicRoutes";
import ProtectedRoute from "../components/navigation/ProtectedRoute";

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
        ...(isPublicOnlyMode
          ? []
          : protectedRoutes.map(({ requiredRoles, path, children }) => ({
              path,
              Component: () => <ProtectedRoute requiredRoles={requiredRoles} />,
              children,
            }))),
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
