interface SummaryBarProps {
  totalTranslations: number;
  selfFlagged: number;
  integrityFailed: number;
  totalScored: number;
  scoreFlagged: number;
}

function Stat({
  value,
  label,
  hint,
  tone = "neutral",
}: {
  value: number | string;
  label: string;
  hint: string;
  tone?: "warn" | "bad" | "good" | "neutral";
}) {
  const styles = {
    good: "border-l-[var(--color-correct)] bg-[var(--color-correct-bg)]",
    warn: "border-l-[var(--color-weak)] bg-[var(--color-weak-bg)]",
    bad: "border-l-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)]",
    neutral: "border-l-[var(--color-accent)] bg-white",
  }[tone];

  const valueColor = {
    good: "text-[var(--color-correct)]",
    warn: "text-[var(--color-weak)]",
    bad: "text-[var(--color-incorrect)]",
    neutral: "text-[var(--color-ink)]",
  }[tone];

  return (
    <div className={`rounded-xl border border-[var(--color-rule)] border-l-4 px-4 py-4 ${styles}`}>
      <div className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{label}</div>
      <div className="mt-0.5 text-xs text-[var(--color-ink-soft)] leading-snug">{hint}</div>
    </div>
  );
}

export function SummaryBar({
  totalTranslations,
  selfFlagged,
  integrityFailed,
  totalScored,
  scoreFlagged,
}: SummaryBarProps) {
  const allClear =
    selfFlagged === 0 && integrityFailed === 0 && scoreFlagged === 0;

  return (
    <div className="mb-10">
      {allClear ? (
        <div className="mb-4 rounded-xl border border-[var(--color-correct)] bg-[var(--color-correct-bg)] px-4 py-3 text-sm font-medium text-[var(--color-correct)]">
          Everything looks good — nothing needs a human review right now.
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-[var(--color-weak)] bg-[var(--color-weak-bg)] px-4 py-3 text-sm font-medium text-[var(--color-weak)]">
          Some items need a human look. Scroll to the yellow or red cards below.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat
          value={totalTranslations}
          label="New translations"
          hint="Fresh English → Spanish"
          tone="neutral"
        />
        <Stat
          value={selfFlagged}
          label="Need a second look"
          hint="AI flagged its own work"
          tone={selfFlagged > 0 ? "warn" : "good"}
        />
        <Stat
          value={integrityFailed}
          label="Broken placeholders"
          hint="Missing {variables} etc."
          tone={integrityFailed > 0 ? "bad" : "good"}
        />
        <Stat
          value={totalScored}
          label="Old translations checked"
          hint="Existing Spanish reviewed"
          tone="neutral"
        />
        <Stat
          value={scoreFlagged}
          label="Need human review"
          hint="From the old set"
          tone={scoreFlagged > 0 ? "warn" : "good"}
        />
      </div>
    </div>
  );
}
