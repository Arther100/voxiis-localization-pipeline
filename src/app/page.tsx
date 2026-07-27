"use client";

import { useEffect, useState } from "react";
import { TranslationTable } from "@/components/TranslationTable";
import { ScoringTable } from "@/components/ScoringTable";
import { TableSkeleton } from "@/components/Skeleton";
import { SummaryBar } from "@/components/SummaryBar";
import type { TranslationResult, ScoringResult } from "@/lib/types";

type Section = "translate" | "score";
type Filter = "all" | "attention";

export default function Home() {
  const [translations, setTranslations] = useState<TranslationResult[] | null>(
    null
  );
  const [scores, setScores] = useState<ScoringResult[] | null>(null);
  const [translationError, setTranslationError] = useState(false);
  const [scoreError, setScoreError] = useState(false);
  const [section, setSection] = useState<Section>("translate");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json())
      .then((data) => setTranslations(data.results))
      .catch(() => setTranslationError(true));

    fetch("/api/score")
      .then((r) => r.json())
      .then((data) => setScores(data.results))
      .catch(() => setScoreError(true));
  }, []);

  const scoreFlagged = scores?.filter((s) => s.needsHumanReview).length ?? 0;
  const selfFlagged =
    translations?.filter((t) => t.selfReview?.needsHumanReview).length ?? 0;
  const integrityFailed =
    translations?.filter((t) => t.integrityCheck && !t.integrityCheck.passed)
      .length ?? 0;

  const translateAttention =
    translations?.filter(
      (t) =>
        t.selfReview?.needsHumanReview ||
        (t.integrityCheck && !t.integrityCheck.passed) ||
        !!t.error
    ).length ?? 0;

  const ready = translations !== null && scores !== null;

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-[var(--color-rule)]">
        <div className="max-w-3xl mx-auto px-5 py-10 md:py-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3">
            Voxiis · Localization QA
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
            English → Spanish, checked for mistakes
          </h1>
          <p className="mt-3 text-[var(--color-ink-soft)] max-w-xl leading-relaxed text-[15px]">
            Each short UI word can mean different things. We translate using the
            real product context, then score whether the Spanish still matches
            that meaning — so you can spot wrong translations without speaking
            Spanish.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <LegendDot color="var(--color-correct)" label="Looks good" />
            <LegendDot color="var(--color-weak)" label="Needs a human look" />
            <LegendDot color="var(--color-incorrect)" label="Likely wrong" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 pt-8">
        {ready ? (
          <SummaryBar
            totalTranslations={translations!.length}
            selfFlagged={selfFlagged}
            integrityFailed={integrityFailed}
            totalScored={scores!.length}
            scoreFlagged={scoreFlagged}
          />
        ) : (
          <div className="mb-10 h-36 rounded-2xl bg-white border border-[var(--color-rule)] animate-pulse" />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="inline-flex rounded-xl bg-white border border-[var(--color-rule)] p-1">
            <TabButton
              active={section === "translate"}
              onClick={() => {
                setSection("translate");
                setFilter("all");
              }}
              label="New translations"
              count={translations?.length}
              badge={translateAttention || undefined}
            />
            <TabButton
              active={section === "score"}
              onClick={() => {
                setSection("score");
                setFilter("all");
              }}
              label="Review old ones"
              count={scores?.length}
              badge={scoreFlagged || undefined}
            />
          </div>

          <div className="inline-flex rounded-xl bg-white border border-[var(--color-rule)] p-1 self-start">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="Show all"
            />
            <FilterButton
              active={filter === "attention"}
              onClick={() => setFilter("attention")}
              label="Only problems"
            />
          </div>
        </div>

        <p className="text-sm text-[var(--color-ink-soft)] mb-5">
          {section === "translate"
            ? "Fresh translations from English, with a second AI pass checking its own work."
            : "Existing Spanish translations scored for whether they still match the intended meaning."}
        </p>
      </div>

      <section className="max-w-3xl mx-auto px-5 pb-20">
        {section === "translate" ? (
          translationError ? (
            <ErrorNotice message="Could not load translations. Check that ANTHROPIC_API_KEY is set." />
          ) : translations ? (
            <TranslationTable results={translations} filter={filter} />
          ) : (
            <TableSkeleton rows={4} />
          )
        ) : scoreError ? (
          <ErrorNotice message="Could not load scores. Check that ANTHROPIC_API_KEY is set." />
        ) : scores ? (
          <ScoringTable results={scores} filter={filter} />
        ) : (
          <TableSkeleton rows={4} />
        )}
      </section>

      <footer className="border-t border-[var(--color-rule)] py-8">
        <div className="max-w-3xl mx-auto px-5 text-sm text-[var(--color-ink-soft)]">
          Built for Voxiis — Localization QA prototype
        </div>
      </footer>
    </main>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-paper)] border border-[var(--color-rule)] px-2.5 py-1 text-[var(--color-ink-soft)]">
      <span
        className="size-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span className={`ml-1.5 ${active ? "opacity-70" : "opacity-60"}`}>
          {count}
        </span>
      )}
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`ml-1.5 inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            active
              ? "bg-[var(--color-weak)] text-white"
              : "bg-[var(--color-weak-bg)] text-[var(--color-weak)]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="border border-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)] rounded-2xl px-5 py-4 text-sm text-[var(--color-incorrect)]">
      {message}
    </div>
  );
}
