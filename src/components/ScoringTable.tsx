import { ScoringResult, Verdict, IssueType } from "@/lib/score";

const VERDICT_STYLE: Record<Verdict, { label: string; text: string; bg: string }> = {
  correct: {
    label: "Correct",
    text: "var(--color-correct)",
    bg: "var(--color-correct-bg)",
  },
  weak: {
    label: "Weak",
    text: "var(--color-weak)",
    bg: "var(--color-weak-bg)",
  },
  incorrect: {
    label: "Incorrect",
    text: "var(--color-incorrect)",
    bg: "var(--color-incorrect-bg)",
  },
};

const ISSUE_LABEL: Record<IssueType, string> = {
  wrong_sense: "Wrong sense of an ambiguous word",
  wrong_part_of_speech: "Wrong part of speech",
  awkward_unnatural: "Awkward / unnatural phrasing",
  none: "No issue",
};

// Fixed grid template on larger screens for clean alignment; stacks to a
// single column on narrow viewports so nothing overflows or gets clipped.
const ROW_GRID =
  "grid grid-cols-1 lg:grid-cols-[220px_190px_150px_1fr] gap-2 lg:gap-5";

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ color: s.text, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

export function ScoringTable({ results }: { results: ScoringResult[] }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {/* Header row — desktop only; a stacked mobile layout doesn't need
          column labels since content becomes self-describing per row. */}
      <div className="hidden lg:grid grid-cols-[220px_190px_150px_1fr] gap-5 px-6 py-3 bg-[#f7f5f0] border-b border-[var(--color-rule)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        <div>Key &amp; context</div>
        <div>Existing translation</div>
        <div>Verdict</div>
        <div>Explanation</div>
      </div>

      {results.map((r, i) => (
        <div
          key={r.key}
          className={`px-6 py-5 ${
            i !== results.length - 1 ? "border-b border-[var(--color-rule)]" : ""
          } ${r.needsHumanReview ? "bg-[#fffdf9]" : ""}`}
        >
          <div className={ROW_GRID}>
            {/* Column 1: key + context */}
            <div className="min-w-0">
              <div className="font-mono text-[13px] text-[var(--color-ink-soft)] break-all">
                {r.key}
              </div>
              <div className="mt-1 text-sm text-[var(--color-ink-soft)] italic">
                {r.comment}
              </div>
            </div>

            {/* Column 2: existing translation + reference */}
            <div className="min-w-0">
              <div className="text-sm text-[var(--color-ink-soft)]">
                {r.source} →{" "}
                <span className="font-serif text-base text-[var(--color-ink)]">
                  {r.existingTranslation}
                </span>
              </div>
              {r.referenceTranslation &&
                r.referenceTranslation.toLowerCase() !==
                  r.existingTranslation.toLowerCase() && (
                  <div className="mt-1 text-xs text-[var(--color-ink-soft)]">
                    Independent reference:{" "}
                    <span className="font-mono">{r.referenceTranslation}</span>
                  </div>
                )}
            </div>

            {/* Column 3: verdict badge + confidence */}
            <div className="min-w-0">
              <VerdictBadge verdict={r.verdict} />
              <div className="mt-1.5 text-xs text-[var(--color-ink-soft)]">
                {r.confidence}% confidence
              </div>
            </div>

            {/* Column 4: issue type + explanation, flexible remaining width */}
            <div className="min-w-0">
              {r.error ? (
                <span className="text-sm text-[var(--color-incorrect)]">
                  ⚠ {r.error}
                </span>
              ) : (
                <>
                  <div className="text-xs font-medium text-[var(--color-ink-soft)] uppercase tracking-wide">
                    {ISSUE_LABEL[r.issueType]}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{r.explanation}</p>
                </>
              )}
            </div>
          </div>

          {/* Footer row: human-review flag + consistency check result.
              Always rendered (not conditionally hidden) so the consistency
              check's outcome is visible on every row, not just some. */}
          {!r.error && (
            <div className="mt-3 pt-3 border-t border-dashed border-[var(--color-rule)] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {r.needsHumanReview ? (
                <span className="font-medium text-[var(--color-weak)] flex items-center gap-1.5">
                  <span>●</span> Flagged for human review
                </span>
              ) : (
                <span className="text-[var(--color-correct)] flex items-center gap-1.5">
                  <span>●</span> No review needed
                </span>
              )}
              {r.consistentOnRepeat === true && (
                <span className="text-[var(--color-ink-soft)]">
                  ✓ Consistent on independent repeat pass
                </span>
              )}
              {r.consistentOnRepeat === false && (
                <span className="text-[var(--color-incorrect)] font-medium">
                  ⚠ Verdict changed on independent repeat pass
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}