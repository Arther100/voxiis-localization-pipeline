export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--color-rule)] bg-white px-5 py-5 animate-pulse"
        >
          <div className="flex justify-between mb-4">
            <div className="h-6 w-24 rounded-full bg-[var(--color-rule)]" />
            <div className="h-4 w-32 rounded bg-[var(--color-rule)] opacity-60" />
          </div>
          <div className="h-3 w-64 max-w-full rounded bg-[var(--color-rule)] opacity-50 mb-4" />
          <div className="h-20 rounded-xl bg-[var(--color-paper)]" />
        </div>
      ))}
    </div>
  );
}
