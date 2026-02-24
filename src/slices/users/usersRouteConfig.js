// New World users route config (mounted under /app/boss/users)
// We will progressively replace v1 components with v2 screens.

import UsersPage from "./components/UsersPage";
import CreateUser from "./components/CreateUser";

const usersRoutes = [
  {
    id: "usersRoot",
    children: [
      // /app/boss/users
      { index: true, Component: UsersPage },

      // /app/boss/users/create
      { path: "create", Component: CreateUser },

      // Future:
      // { path: ":userId", Component: UserDetailsPage },
      // { path: ":userId/edit", Component: EditUserPage },
    ],
  },
];

export default usersRoutes;
