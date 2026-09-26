import { availabilityFromCount, type AvailabilityLabel } from "../../lib/availability";

type Props = {
  inventoryCount: number;
};

const classMap: Record<AvailabilityLabel, string> = {
  "In Stock": "availability availability--in",
  "Limited Availability": "availability availability--limited",
  "Out of Stock": "availability availability--out",
};

export function AvailabilityBadge({ inventoryCount }: Props) {
  const label = availabilityFromCount(inventoryCount);
  return (
    <p className={classMap[label]} aria-live="polite">
      {label}
    </p>
  );
}
