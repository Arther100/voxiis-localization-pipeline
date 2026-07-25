import { TranslationResult } from "@/lib/translate";

export function TranslationTable({ results }: { results: TranslationResult[] }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {results.map((r, i) => (
        <div
          key={r.key}
          className={`grid grid-cols-12 gap-4 px-6 py-5 ${
            i !== results.length - 1 ? "border-b border-[var(--color-rule)]" : ""
          }`}
        >
          <div className="col-span-12 md:col-span-3">
            <div className="font-mono text-[13px] text-[var(--color-ink-soft)] break-all">
              {r.key}
            </div>
            <div className="mt-1 text-sm text-[var(--color-ink-soft)] italic">
              {r.comment}
            </div>
          </div>

          <div className="col-span-6 md:col-span-2 flex items-start">
            <span className="font-serif text-lg">{r.source}</span>
          </div>

          <div className="col-span-6 md:col-span-3 flex items-start">
            {r.error ? (
              <span className="text-sm text-[var(--color-incorrect)]">
                ⚠ {r.error}
              </span>
            ) : (
              <span className="font-serif text-lg font-semibold text-[var(--color-accent)]">
                {r.translation}
              </span>
            )}
          </div>

          <div className="col-span-12 md:col-span-4">
            <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
              {r.reasoning}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
