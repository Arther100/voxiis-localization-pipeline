import { TranslationResult } from "@/lib/translate";

const VERDICT_COLOR: Record<string, { text: string; bg: string }> = {
  correct: { text: "var(--color-correct)", bg: "var(--color-correct-bg)" },
  weak: { text: "var(--color-weak)", bg: "var(--color-weak-bg)" },
  incorrect: { text: "var(--color-incorrect)", bg: "var(--color-incorrect-bg)" },
};

// Fixed grid template on larger screens for clean alignment; stacks to a
// single column on narrow viewports so nothing overflows or gets clipped.
const ROW_GRID =
  "grid grid-cols-1 lg:grid-cols-[220px_90px_160px_1fr] gap-2 lg:gap-5";

function SelfReviewBadge({
  review,
}: {
  review: NonNullable<TranslationResult["selfReview"]>;
}) {
  if (review.error) {
    return (
      <span className="text-xs text-[var(--color-incorrect)]">
        ⚠ Self-review failed
      </span>
    );
  }
  const c = VERDICT_COLOR[review.verdict];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ color: c.text, background: c.bg }}
    >
      Self-review: {review.verdict} ({review.confidence}%)
    </span>
  );
}

export function TranslationTable({ results }: { results: TranslationResult[] }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {/* Header row — desktop only; a stacked mobile layout doesn't need
          column labels since content becomes self-describing per row. */}
      <div className="hidden lg:grid grid-cols-[220px_90px_160px_1fr] gap-5 px-6 py-3 bg-[#f7f5f0] border-b border-[var(--color-rule)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        <div>Key &amp; context</div>
        <div>Source</div>
        <div>Translation</div>
        <div>Reasoning &amp; self-review</div>
      </div>

      {results.map((r, i) => (
        <div
          key={r.key}
          className={`px-6 py-5 ${
            i !== results.length - 1 ? "border-b border-[var(--color-rule)]" : ""
          } ${r.selfReview?.needsHumanReview ? "bg-[#fffdf9]" : ""}`}
        >
          <div className={ROW_GRID}>
            {/* Column 1: key + context, fixed width */}
            <div className="min-w-0">
              <div className="font-mono text-[13px] text-[var(--color-ink-soft)] break-all">
                {r.key}
              </div>
              <div className="mt-1 text-sm text-[var(--color-ink-soft)] italic">
                {r.comment}
              </div>
            </div>

            {/* Column 2: source word, fixed width */}
            <div className="min-w-0">
              <span className="font-serif text-lg">{r.source}</span>
            </div>

            {/* Column 3: translation + integrity warning, fixed width */}
            <div className="min-w-0">
              {r.error ? (
                <span className="text-sm text-[var(--color-incorrect)]">
                  ⚠ {r.error}
                </span>
              ) : (
                <>
                  <span className="font-serif text-lg font-semibold text-[var(--color-accent)]">
                    {r.translation}
                  </span>
                  {r.integrityCheck && !r.integrityCheck.passed && (
                    <div className="mt-1 text-xs text-[var(--color-incorrect)]">
                      ⚠ Placeholder mismatch — missing:{" "}
                      {r.integrityCheck.missing.join(", ") || "none"}, extra:{" "}
                      {r.integrityCheck.extra.join(", ") || "none"}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Column 4: reasoning + self-review, flexible remaining width */}
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                {r.reasoning}
              </p>
              {r.selfReview && (
                <div className="mt-2">
                  <SelfReviewBadge review={r.selfReview} />
                  {r.selfReview.verdict !== "correct" && !r.selfReview.error && (
                    <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                      {r.selfReview.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}