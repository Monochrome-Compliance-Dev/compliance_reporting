import { userService } from "slices/users/userApi";

export const identityApi = {
  login: userService.login,
  logout: userService.logout,
  refreshToken: userService.refreshToken,

  getCurrentUser() {
    return userService.userValue;
  },

  subscribeToCurrentUser(callback) {
    return userService.user.subscribe(callback);
  },
};
