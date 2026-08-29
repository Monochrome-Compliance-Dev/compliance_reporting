import { renderHook } from "@testing-library/react";
import { useStagePreviewQuery } from "slices/ptrs/hooks/usePtrsQueries";
import useRuleHeaders from "./useRuleHeaders";

jest.mock("slices/ptrs/hooks/usePtrsQueries", () => ({
  useStagePreviewQuery: jest.fn(),
}));

describe("useRuleHeaders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses the shared Stage preview query and prefers its headers", () => {
    useStagePreviewQuery.mockReturnValue({
      data: { headers: ["payer_entity_abn", "payment_amount"] },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useRuleHeaders("ptrs-1", {
        mappings: { amount: { field: "Payment Amount" } },
      }),
    );

    expect(useStagePreviewQuery).toHaveBeenCalledWith("ptrs-1", {
      limit: 1,
      enabled: true,
    });
    expect(result.current).toEqual({
      headers: ["payer_entity_abn", "payment_amount"],
      isLoadingHeaders: false,
    });
  });

  test("falls back to mapped headers while Stage preview is unavailable", () => {
    useStagePreviewQuery.mockReturnValue({ data: null, isLoading: true });

    const { result } = renderHook(() =>
      useRuleHeaders(null, {
        mappings: { amount: { field: "Payment Amount" } },
      }),
    );

    expect(result.current).toEqual({
      headers: ["payment_amount"],
      isLoadingHeaders: true,
    });
  });
});
