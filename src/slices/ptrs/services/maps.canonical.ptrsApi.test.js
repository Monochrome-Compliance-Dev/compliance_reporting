import { fetchWrapper } from "shared/utils";
import { buildPtrsCanonicalRevision } from "./maps.ptrsApi";

jest.mock("shared/utils", () => ({ fetchWrapper: { post: jest.fn() } }));

test.each([
  ["building", false],
  ["succeeded", true],
])(
  "normalises %s readiness and opts out of POST replay",
  async (status, ready) => {
    fetchWrapper.post.mockResolvedValue({
      status: "success",
      data: { revision: { id: "revision01", status }, reused: true },
    });
    await expect(
      buildPtrsCanonicalRevision("ptrs000001", {
        profileId: "profile001",
        datasetId: "dataset001",
      }),
    ).resolves.toMatchObject({ ready, reused: true });
    expect(fetchWrapper.post).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/ptrs000001\/datasets\/dataset001\/canonical-revisions\?profileId=profile001$/,
      ),
      { profileId: "profile001" },
      { retry: 0 },
    );
  },
);

test("rejects malformed or non-ready terminal revision responses", async () => {
  for (const data of [
    {},
    { revision: { id: "revision01", status: "failed" } },
  ]) {
    fetchWrapper.post.mockResolvedValue({ status: "success", data });
    await expect(
      buildPtrsCanonicalRevision("ptrs000001", { datasetId: "dataset001" }),
    ).rejects.toThrow("Invalid canonical materialisation response");
  }
});
