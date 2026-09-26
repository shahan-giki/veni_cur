import { describe, expect, it } from "vitest";
import { formatPaymentStatus } from "./paymentDisplay";

describe("formatPaymentStatus", () => {
  it("maps known statuses", () => {
    expect(formatPaymentStatus("PENDING")).toBe("Payment is being verified");
    expect(formatPaymentStatus("REJECTED")).toBe("Payment proof rejected");
  });

  it("handles empty values", () => {
    expect(formatPaymentStatus(null)).toBe("—");
  });
});
