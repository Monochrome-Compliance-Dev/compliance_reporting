import { normaliseFoundationResponse } from "platform/foundation/foundationApi";

describe("normaliseFoundationResponse", () => {
  it("normalises a direct backend response", () => {
    const result = normaliseFoundationResponse({
      success: true,
      foundationId: "foundation-123",
      capability: "foundation",
      message: "Platform foundation executed successfully.",
      actor: {
        id: "user-123",
        role: "Admin",
        customerId: "customer-123",
      },
    });

    expect(result).toEqual({
      success: true,
      foundationId: "foundation-123",
      capability: "foundation",
      message: "Platform foundation executed successfully.",
      actor: {
        id: "user-123",
        role: "Admin",
        customerId: "customer-123",
      },
    });
  });

  it("normalises a wrapped backend response", () => {
    const result = normaliseFoundationResponse({
      data: {
        success: true,
        foundationId: "foundation-456",
        capability: "foundation",
        message: "Wrapped response worked.",
        actor: null,
      },
    });

    expect(result).toEqual({
      success: true,
      foundationId: "foundation-456",
      capability: "foundation",
      message: "Wrapped response worked.",
      actor: null,
    });
  });

  it("applies safe defaults when fields are missing", () => {
    const result = normaliseFoundationResponse({});

    expect(result).toEqual({
      success: false,
      foundationId: null,
      capability: "foundation",
      message: "Platform foundation completed.",
      actor: null,
    });
  });

  it("converts success to a boolean", () => {
    const result = normaliseFoundationResponse({
      success: 1,
      foundationId: "foundation-789",
    });

    expect(result.success).toBe(true);
  });
});
