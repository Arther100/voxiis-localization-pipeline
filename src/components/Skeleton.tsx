export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`px-6 py-5 animate-pulse ${
            i !== rows - 1 ? "border-b border-[var(--color-rule)]" : ""
          }`}
        >
          <div className="h-3 w-40 bg-[var(--color-rule)] rounded mb-2" />
          <div className="h-3 w-64 bg-[var(--color-rule)] rounded opacity-60" />
        </div>
      ))}
    </div>
  );
}
