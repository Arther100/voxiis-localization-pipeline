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

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{ color: s.text, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

export function ScoringTable({ results }: { results: ScoringResult[] }) {
  return (
    <div className="border border-[var(--color-rule)] rounded-lg overflow-hidden bg-white">
      {results.map((r, i) => (
        <div
          key={r.key}
          className={`px-6 py-5 ${
            i !== results.length - 1 ? "border-b border-[var(--color-rule)]" : ""
          } ${r.needsHumanReview ? "bg-[#fffdf9]" : ""}`}
        >
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-12 md:col-span-3">
              <div className="font-mono text-[13px] text-[var(--color-ink-soft)] break-all">
                {r.key}
              </div>
              <div className="mt-1 text-sm text-[var(--color-ink-soft)] italic">
                {r.comment}
              </div>
            </div>

            <div className="col-span-12 md:col-span-3">
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

            <div className="col-span-6 md:col-span-2">
              <VerdictBadge verdict={r.verdict} />
              <div className="mt-1.5 text-xs text-[var(--color-ink-soft)]">
                {r.confidence}% confidence
              </div>
            </div>

            <div className="col-span-6 md:col-span-4">
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

          {r.needsHumanReview && !r.error && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-weak)]">
              <span>●</span> Flagged for human review
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
