import { normaliseInteractionResponse } from "platform/interactions/interactionsApi";

describe("normaliseInteractionResponse", () => {
  it("normalises a direct backend response", () => {
    const result = normaliseInteractionResponse({
      success: true,
      interactionId: "interaction-123",
      capability: "interactions",
      message: "Platform interaction executed successfully.",
      actor: {
        id: "user-123",
        role: "Admin",
        customerId: "customer-123",
      },
    });

    expect(result).toEqual({
      success: true,
      interactionId: "interaction-123",
      capability: "interactions",
      message: "Platform interaction executed successfully.",
      actor: {
        id: "user-123",
        role: "Admin",
        customerId: "customer-123",
      },
    });
  });

  it("normalises a wrapped backend response", () => {
    const result = normaliseInteractionResponse({
      data: {
        success: true,
        interactionId: "interaction-456",
        capability: "interactions",
        message: "Wrapped response worked.",
        actor: null,
      },
    });

    expect(result).toEqual({
      success: true,
      interactionId: "interaction-456",
      capability: "interactions",
      message: "Wrapped response worked.",
      actor: null,
    });
  });

  it("applies safe defaults when fields are missing", () => {
    const result = normaliseInteractionResponse({});

    expect(result).toEqual({
      success: false,
      interactionId: null,
      capability: "interactions",
      message: "Platform interaction completed.",
      actor: null,
    });
  });

  it("converts success to a boolean", () => {
    const result = normaliseInteractionResponse({
      success: 1,
      interactionId: "interaction-789",
    });

    expect(result.success).toBe(true);
  });
});
