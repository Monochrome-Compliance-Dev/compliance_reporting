import { userService } from "./user.service";
import { fetchWrapper } from "../../utils/fetch-wrapper";

jest.mock("../../_helpers/fetch-wrapper");
jest.mock("../../_config/config", () => ({
  apiUrl: "http://localhost:4001",
}));

describe("userService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should login successfully and update userSubject", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      jwtToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjg1MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", // Valid Base64-encoded JWT
    };
    fetchWrapper.post.mockResolvedValue(mockUser);

    const result = await userService.login({
      email: "test@example.com",
      password: "password",
    });

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4001/users/authenticate",
      { email: "test@example.com", password: "password" }
    );
    expect(result).toEqual(mockUser);
    expect(userService.userValue).toEqual(mockUser);
  });

  it("should handle login failure", async () => {
    fetchWrapper.post.mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      userService.login({
        email: "test@example.com",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid credentials");
  });

  it("should logout and clear userSubject", () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      jwtToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjg1MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    };
    userService._userSubject.next(mockUser); // Set the user value directly
    fetchWrapper.post.mockResolvedValue({});

    userService.logout();

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4001/users/revoke-token",
      mockUser
    );
    expect(userService.userValue).toBeNull();
  });

  it("should refresh token successfully", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      jwtToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjg1MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", // Valid Base64-encoded JWT
    };
    fetchWrapper.post.mockResolvedValue(mockUser);

    const result = await userService.refreshToken();

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4001/users/refresh-token",
      {}
    );
    expect(result).toEqual(mockUser);
    expect(userService.userValue).toEqual(mockUser);
  });
});
