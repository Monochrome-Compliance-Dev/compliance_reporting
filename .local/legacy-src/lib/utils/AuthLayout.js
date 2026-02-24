import React from "react";
import { Outlet, redirect } from "react-router";
import { userService } from "../features/users/user.service";

export default function AuthLayout() {
  const user = userService.userValue; // Get the current user
  console.log("AuthLayout", user); // Log to check if this component is rendered

  if (!user) {
    console.log("User not authenticated, redirecting to login"); // Log if user is not authenticated
    return redirect("/user/login"); // Redirect to login page if not authenticated
  }
  // If user is authenticated, render the child routes
  return (
    <div>
      <Outlet />
    </div>
  );
}
