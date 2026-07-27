import { ScoringResult, Verdict, IssueType } from "@/lib/score";

const VERDICT: Record<
  Verdict,
  { label: string; text: string; bg: string; border: string }
> = {
  correct: {
    label: "Correct",
    text: "var(--color-correct)",
    bg: "var(--color-correct-bg)",
    border: "var(--color-correct)",
  },
  weak: {
    label: "Weak — needs review",
    text: "var(--color-weak)",
    bg: "var(--color-weak-bg)",
    border: "var(--color-weak)",
  },
  incorrect: {
    label: "Incorrect",
    text: "var(--color-incorrect)",
    bg: "var(--color-incorrect-bg)",
    border: "var(--color-incorrect)",
  },
};

const ISSUE_LABEL: Record<IssueType, string> = {
  wrong_sense: "Wrong meaning of an ambiguous word",
  wrong_part_of_speech: "Wrong word type (e.g. noun vs verb)",
  awkward_unnatural: "Awkward or unnatural phrasing",
  none: "No issue found",
};

function ScoreCard({ r }: { r: ScoringResult }) {
  const style = r.error
    ? {
        label: "Failed",
        text: "var(--color-incorrect)",
        bg: "var(--color-incorrect-bg)",
        border: "var(--color-incorrect)",
      }
    : VERDICT[r.verdict];

  return (
    <article
      className={`rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden ${
        r.needsHumanReview ? "shadow-sm" : ""
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: style.border }}
    >
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ color: style.text, background: style.bg }}
          >
            {style.label}
          </span>
          {!r.error && (
            <span className="text-xs text-[var(--color-ink-soft)]">
              {r.confidence}% sure
            </span>
          )}
        </div>
        <code className="text-[11px] text-[var(--color-ink-soft)] font-mono truncate max-w-[200px]">
          {r.key}
        </code>
      </div>

      <div className="px-5 pb-2">
        <p className="text-xs text-[var(--color-ink-soft)]">
          <span className="font-semibold text-[var(--color-ink)]">Where it&apos;s used: </span>
          {r.comment}
        </p>
      </div>

      <div className="mx-5 mb-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center rounded-xl bg-[var(--color-paper)] px-4 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
            English
          </div>
          <div className="text-xl font-semibold">{r.source}</div>
        </div>
        <div className="hidden sm:block text-[var(--color-ink-soft)] text-lg font-light" aria-hidden>
          →
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
            Existing Spanish
          </div>
          <div className="text-xl font-semibold">{r.existingTranslation}</div>
        </div>
      </div>

      {!r.error &&
        r.referenceTranslation &&
        r.referenceTranslation.toLowerCase() !==
          r.existingTranslation.toLowerCase() && (
          <div className="mx-5 mb-4 rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-1">
              Suggested better translation
            </div>
            <div className="text-lg font-semibold text-[var(--color-accent)]">
              {r.referenceTranslation}
            </div>
          </div>
        )}

      <div className="px-5 pb-5 space-y-3">
        {r.error ? (
          <p className="text-sm text-[var(--color-incorrect)]">{r.error}</p>
        ) : (
          <>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                What&apos;s wrong
              </div>
              <div className="text-sm font-medium text-[var(--color-ink)]">
                {ISSUE_LABEL[r.issueType]}
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                {r.explanation}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {r.needsHumanReview ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-weak-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-weak)]">
                  Ask a human to check this
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-correct-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-correct)]">
                  No human review needed
                </span>
              )}
              {r.consistentOnRepeat === true && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)]">
                  Same answer on re-check
                </span>
              )}
              {r.consistentOnRepeat === false && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-incorrect-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-incorrect)]">
                  Answer changed on re-check
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function ScoringTable({
  results,
  filter,
}: {
  results: ScoringResult[];
  filter?: "all" | "attention";
}) {
  const shown =
    filter === "attention"
      ? results.filter((r) => r.needsHumanReview || !!r.error)
      : results;

  if (shown.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-rule)] bg-white px-6 py-10 text-center text-sm text-[var(--color-ink-soft)]">
        Nothing in this filter — all clear.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {shown.map((r) => (
        <ScoreCard key={r.key} r={r} />
      ))}
    </div>
  );
}
