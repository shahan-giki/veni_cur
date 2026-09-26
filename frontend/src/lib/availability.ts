export type AvailabilityLabel = "In Stock" | "Limited Availability" | "Out of Stock";

export function availabilityFromCount(count: number): AvailabilityLabel {
  if (count <= 0) return "Out of Stock";
  if (count <= 5) return "Limited Availability";
  return "In Stock";
}
