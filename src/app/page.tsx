"use client";

import { useEffect, useState } from "react";
import { TranslationTable } from "@/components/TranslationTable";
import { ScoringTable } from "@/components/ScoringTable";
import { TableSkeleton } from "@/components/Skeleton";
import type { TranslationResult, ScoringResult } from "@/lib/types";

export default function Home() {
  const [translations, setTranslations] = useState<TranslationResult[] | null>(
    null
  );
  const [scores, setScores] = useState<ScoringResult[] | null>(null);
  const [translationError, setTranslationError] = useState(false);
  const [scoreError, setScoreError] = useState(false);

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

  const flaggedCount = scores?.filter((s) => s.needsHumanReview).length ?? 0;

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--color-rule)] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-3">
            Localization QA Prototype — Round 2
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight max-w-2xl">
            Translate with context.
            <br />
            Score without guessing.
          </h1>
          <p className="mt-4 text-[var(--color-ink-soft)] max-w-xl leading-relaxed">
            Ten UI strings translated into Spanish using their real product
            context, and eight existing translations reviewed against an
            objective, explained scoring scheme — both built on the same
            underlying logic, so a short English word never gets the wrong
            sense twice.
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-2xl font-semibold">
            Part 1 — Context-aware translation
          </h2>
          <span className="text-sm text-[var(--color-ink-soft)]">
            10 strings
          </span>
        </div>
        {translationError ? (
          <ErrorNotice message="Could not load translations. Check that ANTHROPIC_API_KEY is set." />
        ) : translations ? (
          <TranslationTable results={translations} />
        ) : (
          <TableSkeleton rows={10} />
        )}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-serif text-2xl font-semibold">
            Part 2 — Quality scoring
          </h2>
          <span className="text-sm text-[var(--color-ink-soft)]">
            8 strings
          </span>
        </div>
        {scores && (
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            {flaggedCount} of {scores.length} flagged for human review.
          </p>
        )}
        {scoreError ? (
          <ErrorNotice message="Could not load scores. Check that ANTHROPIC_API_KEY is set." />
        ) : scores ? (
          <ScoringTable results={scores} />
        ) : (
          <TableSkeleton rows={8} />
        )}
      </section>

      <footer className="border-t border-[var(--color-rule)] py-8">
        <div className="max-w-5xl mx-auto px-6 text-sm text-[var(--color-ink-soft)]">
          Built for Voxiis, Round 2 — AI Engineer (Agents & Internal Products).
        </div>
      </footer>
    </main>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="border border-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)] rounded-lg px-5 py-4 text-sm text-[var(--color-incorrect)]">
      {message}
    </div>
  );
}
