import { NextResponse } from "next/server";
import { PART1_STRINGS } from "@/lib/data";
import { translateBatch } from "@/lib/translate";
import { selfReviewTranslation } from "@/lib/score";

export const maxDuration = 60;

export async function GET() {
  const translations = await translateBatch(PART1_STRINGS);

  // Second pass: run every fresh translation back through the exact same
  // scoring logic used on the legacy Part 2 translations. This is what
  // closes the loop — the pipeline holds its own output to the identical
  // bar it holds old, non-AI translations to, rather than only checking
  // other people's work.
  const withSelfReview = await Promise.all(
    translations.map(async (t) => {
      if (t.error || !t.translation) {
        // Nothing to self-review if the translation itself failed.
        return t;
      }
      const review = await selfReviewTranslation(
        t.key,
        t.comment,
        t.source,
        t.translation
      );
      return { ...t, selfReview: review };
    })
  );

  return NextResponse.json({ results: withSelfReview });
}
