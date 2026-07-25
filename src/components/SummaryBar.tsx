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
  tone,
}: {
  value: number | string;
  label: string;
  tone?: "warn" | "bad" | "neutral";
}) {
  const color =
    tone === "bad"
      ? "var(--color-incorrect)"
      : tone === "warn"
      ? "var(--color-weak)"
      : "var(--color-ink)";

  return (
    <div className="flex flex-col">
      <span className="font-serif text-3xl font-semibold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs text-[var(--color-ink-soft)] mt-1">{label}</span>
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
  return (
    <div className="border border-[var(--color-rule)] rounded-lg bg-white px-6 py-6 mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
        <Stat value={totalTranslations} label="Strings translated" />
        <Stat
          value={selfFlagged}
          label="Fresh translations flagged on self-review"
          tone={selfFlagged > 0 ? "warn" : "neutral"}
        />
        <Stat
          value={integrityFailed}
          label="Placeholder / variable integrity failures"
          tone={integrityFailed > 0 ? "bad" : "neutral"}
        />
        <Stat value={totalScored} label="Legacy translations scored" />
        <Stat
          value={`${scoreFlagged} / ${totalScored}`}
          label="Legacy translations needing human review"
          tone={scoreFlagged > 0 ? "warn" : "neutral"}
        />
      </div>
    </div>
  );
}