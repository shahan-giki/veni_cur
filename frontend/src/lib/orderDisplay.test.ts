import { describe, expect, it } from "vitest";
import {
  formatOrderNumber,
  formatOrderPlacedAt,
  orderStatusTone,
} from "./orderDisplay";

describe("formatOrderNumber", () => {
  it("formats the public Veni order number as VENI-#####", () => {
    expect(formatOrderNumber(1)).toBe("VENI-00001");
    expect(formatOrderNumber(42)).toBe("VENI-00042");
    expect(formatOrderNumber(12345)).toBe("VENI-12345");
  });
});

describe("formatOrderPlacedAt", () => {
  it("splits ISO timestamps into day, date, and time", () => {
    const parts = formatOrderPlacedAt("2026-01-15T14:30:00+05:00", "en-PK");
    expect(parts.day).toMatch(/Thursday/i);
    expect(parts.date).toMatch(/15/);
    expect(parts.date).toMatch(/January/i);
    expect(parts.date).toMatch(/2026/);
    expect(parts.time.length).toBeGreaterThan(3);
  });

  it("returns em dashes for invalid dates", () => {
    expect(formatOrderPlacedAt("not-a-date")).toEqual({
      day: "—",
      date: "—",
      time: "—",
    });
  });
});

describe("orderStatusTone", () => {
  it("maps processing to an emphatic tone", () => {
    expect(orderStatusTone("PROCESSING")).toBe("processing");
    expect(orderStatusTone("PENDING_PAYMENT")).toBe("pending");
  });
});
