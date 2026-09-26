import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats decimal strings as PKR", () => {
    expect(formatPrice("1299.5")).toMatch(/1,299\.50/);
  });
});
