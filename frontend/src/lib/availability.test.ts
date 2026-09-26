import { describe, expect, it } from "vitest";
import { availabilityFromCount } from "./availability";

describe("availabilityFromCount", () => {
  it("returns Out of Stock at zero", () => {
    expect(availabilityFromCount(0)).toBe("Out of Stock");
  });
  it("returns Limited for low counts", () => {
    expect(availabilityFromCount(3)).toBe("Limited Availability");
  });
  it("returns In Stock for healthy counts", () => {
    expect(availabilityFromCount(10)).toBe("In Stock");
  });
});
