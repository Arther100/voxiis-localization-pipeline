import { TranslationResult } from "@/lib/translate";

const VERDICT_COLOR: Record<string, { text: string; bg: string }> = {
  correct: { text: "var(--color-correct)", bg: "var(--color-correct-bg)" },
  weak: { text: "var(--color-weak)", bg: "var(--color-weak-bg)" },
  incorrect: { text: "var(--color-incorrect)", bg: "var(--color-incorrect-bg)" },
};

function SelfReviewBadge({ review }: { review: NonNullable<TranslationResult["selfReview"]> }) {
  if (review.error) {
    return (
      <span className="text-xs text-[var(--color-incorrect)]">
        ⚠ Self-review failed
      </span>
    );
  }
  const c = VERDICT_COLOR[review.verdict];
  return (
    <div className="mt-2 flex items-start gap-2">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0"
        style={{ color: c.text, background: c.bg }}
      >
        Self-review: {review.verdict} ({review.confidence}%)
      </span>
    </div>
  );
}

export function TranslationTable({ results }: { results: TranslationResult[] }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {results.map((r, i) => (
        <div
          key={r.key}
          className={`px-6 py-5 ${
            i !== results.length - 1 ? "border-b border-[var(--color-rule)]" : ""
          } ${r.selfReview?.needsHumanReview ? "bg-[#fffdf9]" : ""}`}
        >
          <div className="grid grid-cols-12 gap-4">
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

            <div className="col-span-6 md:col-span-3">
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

            <div className="col-span-12 md:col-span-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                {r.reasoning}
              </p>
              {r.selfReview && <SelfReviewBadge review={r.selfReview} />}
              {r.selfReview && r.selfReview.verdict !== "correct" && !r.selfReview.error && (
                <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                  {r.selfReview.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
