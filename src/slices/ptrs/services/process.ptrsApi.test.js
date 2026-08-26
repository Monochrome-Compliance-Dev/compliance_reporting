import { fetchWrapper } from "shared/utils";
import { runPtrsTransformations } from "./process.ptrsApi";

jest.mock("shared/utils", () => ({
  fetchWrapper: { post: jest.fn() },
}));

describe("runPtrsTransformations", () => {
  test("calls the single orchestration endpoint and normalises its summary", async () => {
    fetchWrapper.post.mockResolvedValue({
      data: {
        status: "success",
        data: {
          ptrsId: "ptrs000001",
          profileId: "profile001",
          tookMs: 250,
          counts: { sourceStageRows: 1786, derivedPaymentObservations: 1063 },
          steps: { validation: { status: "PASSED" } },
        },
      },
    });

    const result = await runPtrsTransformations("ptrs000001", {
      profileId: "profile001",
    });

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/v2\/ptrs\/ptrs000001\/process$/),
      { profileId: "profile001" },
    );
    expect(result).toEqual(
      expect.objectContaining({
        ptrsId: "ptrs000001",
        tookMs: 250,
        counts: expect.objectContaining({ derivedPaymentObservations: 1063 }),
      }),
    );
  });
});
