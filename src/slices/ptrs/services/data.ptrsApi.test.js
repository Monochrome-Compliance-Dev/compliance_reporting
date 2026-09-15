import { fetchWrapper } from "shared/utils";
import { updateDatasetSettings } from "./data.ptrsApi";

jest.mock("shared/utils", () => ({
  fetchWrapper: { patch: jest.fn() },
}));

test("updates governed direct-payment dataset settings", async () => {
  fetchWrapper.patch.mockResolvedValue({
    data: {
      id: "dataset001",
      adapterType: "direct_payment",
      dateFormat: "MDY",
      reportingEntity: {
        id: "snapshot01",
        entityName: "ORONTIDE GROUP PTY LTD",
        abn: "40115288492",
      },
    },
  });

  await expect(
    updateDatasetSettings("ptrs000001", "dataset001", {
      dateFormat: "MDY",
      reportingEntityName: "ORONTIDE GROUP PTY LTD",
      reportingEntityAbn: "40 115 288 492",
    }),
  ).resolves.toMatchObject({
    id: "dataset001",
    dateFormat: "MDY",
    reportingEntity: { entityName: "ORONTIDE GROUP PTY LTD" },
  });

  expect(fetchWrapper.patch).toHaveBeenCalledWith(
    expect.stringMatching(
      /\/v2\/ptrs\/ptrs000001\/datasets\/dataset001\/settings$/,
    ),
    {
      dateFormat: "MDY",
      reportingEntityName: "ORONTIDE GROUP PTY LTD",
      reportingEntityAbn: "40 115 288 492",
      reportingEntityAcn: null,
      reportingEntityArbn: null,
    },
  );
});
