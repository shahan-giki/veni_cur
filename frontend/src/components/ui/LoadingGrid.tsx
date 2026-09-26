export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
