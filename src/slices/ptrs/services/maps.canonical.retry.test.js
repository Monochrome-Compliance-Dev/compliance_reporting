import { buildPtrsCanonicalRevision } from "./maps.ptrsApi";

jest.mock("shared/utils", () => ({
  fetchWrapper: jest.requireActual("shared/utils/fetch-wrapper").fetchWrapper,
}));
jest.mock("slices/users/userApi", () => ({ userService: { userValue: null } }));
jest.mock("shared/utils/tenantScope", () => ({
  getScopedCustomerId: () => null,
}));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

test("the real fetch wrapper does not replay a canonical network failure", async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("network lost"));
  await expect(
    buildPtrsCanonicalRevision("ptrs000001", { datasetId: "dataset001" }),
  ).rejects.toThrow("network lost");
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("the real fetch wrapper does not replay a canonical HTTP 500", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify({ message: "build failed" }),
  });
  await expect(
    buildPtrsCanonicalRevision("ptrs000001", { datasetId: "dataset001" }),
  ).rejects.toMatchObject({ status: 500 });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
