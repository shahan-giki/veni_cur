/** Present backend decimal strings as PKR (display only). */
export function formatPrice(amount: string): string {
  const normalized = amount.trim();
  if (!normalized) return "—";
  const [whole, frac = ""] = normalized.split(".");
  const padded = `${whole}.${frac.padEnd(2, "0").slice(0, 2)}`;
  const num = Number(padded);
  if (Number.isNaN(num)) return normalized;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
