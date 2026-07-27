import { TranslationResult } from "@/lib/translate";

const STATUS: Record<
  string,
  { label: string; text: string; bg: string; border: string }
> = {
  correct: {
    label: "Looks good",
    text: "var(--color-correct)",
    bg: "var(--color-correct-bg)",
    border: "var(--color-correct)",
  },
  weak: {
    label: "Needs review",
    text: "var(--color-weak)",
    bg: "var(--color-weak-bg)",
    border: "var(--color-weak)",
  },
  incorrect: {
    label: "Likely wrong",
    text: "var(--color-incorrect)",
    bg: "var(--color-incorrect-bg)",
    border: "var(--color-incorrect)",
  },
};

function StatusBadge({
  verdict,
}: {
  verdict: "correct" | "weak" | "incorrect";
}) {
  const s = STATUS[verdict];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ color: s.text, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function TranslationCard({ r }: { r: TranslationResult }) {
  const review = r.selfReview;
  const needsAttention =
    !!r.error ||
    review?.needsHumanReview ||
    (r.integrityCheck && !r.integrityCheck.passed);
  const borderColor = r.error
    ? "var(--color-incorrect)"
    : review
      ? STATUS[review.verdict].border
      : "var(--color-rule)";

  return (
    <article
      className={`rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden ${
        needsAttention ? "shadow-sm" : ""
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {r.error ? (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold text-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)]">
              Failed
            </span>
          ) : review ? (
            <StatusBadge verdict={review.verdict} />
          ) : (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold text-[var(--color-ink-soft)] bg-[var(--color-paper)]">
              Translated
            </span>
          )}
          {r.integrityCheck && !r.integrityCheck.passed && (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold text-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)]">
              Broken placeholder
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
          <div className="text-xl font-semibold text-[var(--color-ink)]">{r.source}</div>
        </div>
        <div className="hidden sm:block text-[var(--color-ink-soft)] text-lg font-light" aria-hidden>
          →
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            Spanish
          </div>
          {r.error ? (
            <div className="text-sm text-[var(--color-incorrect)]">{r.error}</div>
          ) : (
            <div className="text-xl font-semibold text-[var(--color-accent)]">
              {r.translation}
            </div>
          )}
        </div>
      </div>

      {!r.error && (
        <div className="px-5 pb-5 space-y-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
              Why this word
            </div>
            <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{r.reasoning}</p>
          </div>

          {review && !review.error && review.verdict !== "correct" && (
            <div className="rounded-lg bg-[var(--color-weak-bg)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-weak)] mb-1">
                Why it was flagged
              </div>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                {review.explanation}
              </p>
            </div>
          )}

          {r.integrityCheck && !r.integrityCheck.passed && (
            <div className="rounded-lg bg-[var(--color-incorrect-bg)] px-3 py-2.5 text-sm text-[var(--color-incorrect)]">
              Placeholder mismatch — missing:{" "}
              {r.integrityCheck.missing.join(", ") || "none"}, extra:{" "}
              {r.integrityCheck.extra.join(", ") || "none"}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function TranslationTable({
  results,
  filter,
}: {
  results: TranslationResult[];
  filter?: "all" | "attention";
}) {
  const shown =
    filter === "attention"
      ? results.filter(
          (r) =>
            r.selfReview?.needsHumanReview ||
            (r.integrityCheck && !r.integrityCheck.passed) ||
            !!r.error
        )
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
        <TranslationCard key={r.key} r={r} />
      ))}
    </div>
  );
}
