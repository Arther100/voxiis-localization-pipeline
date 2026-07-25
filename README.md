# Voxiis — Localization QA Pipeline

A working prototype of context-aware Spanish translation and objective quality scoring, built with the Claude API for Voxiis's Round 2 (AI Engineer, Agents & Internal Products).

**Live demo:** _(added after deployment)_
**Repo:** https://github.com/Arther100/voxiis-localization-pipeline

---

## What this does

**Part 1 — Translation.** Given 10 English UI strings (each with a key and a short developer comment describing exact context), it produces a Spanish translation for each — using the comment to resolve genuinely ambiguous words like "Open," "Post," and "Due," which have different correct translations depending on where they appear in the product.

**Part 2 — Scoring.** Given 8 existing Spanish translations from a previous, non-AI process, it reviews each one against the same kind of context comment and produces an objective, explained verdict: `correct`, `weak`, or `incorrect`, with a confidence score, an issue category, and a plain-English explanation a non-technical reviewer can trust without reading Spanish themselves.

## Why it's built this way

**The core problem in both parts is the same one.** A short English word like "Due" or "Post" is only meaningful with context — the same word means different things depending on where it's used (a deadline vs. an amount owed; publishing a feed post vs. a physical mail address). Getting this wrong is the most common and costly kind of localization bug, because the output looks completely correct on the surface — it's valid Spanish, just for the wrong sense of the word. So both the translator and the scorer are given the exact same developer context comment and explicitly instructed to resolve ambiguity using it, not the word's most common dictionary sense.

**Structured output, not free text.** Both Claude calls use tool-calling (forced via `tool_choice`) so every response comes back as a strict, typed JSON object. This matters because the whole point of this pipeline, per the task brief, is that a non-technical team should be able to trust it running unattended — a system that occasionally returns unparseable free text isn't trustworthy in that sense, no matter how good the underlying translations are.

**The pipeline scores its own output, not just legacy translations (the main upgrade).** Every fresh Part 1 translation is immediately run back through the *exact same* scoring function used for Part 2's legacy strings (`selfReviewTranslation` in `src/lib/score.ts`, sharing one `runScoringCall` core with the legacy-scoring path). This closes the loop: the system doesn't just judge *other people's* old translations by this bar — it holds its own newly-generated output to the identical standard, and a fresh translation can get flagged for human review exactly like an old one can.

**Confidence-based escalation to a human.** Every scored string (both legacy and self-reviewed) gets a `needsHumanReview` flag, set whenever the verdict isn't a clean "correct," the model's own confidence is below 85%, or (see below) a repeat scoring pass disagrees. This is a direct reflection of Voxiis's own stated approach: some parts of localization are deterministic and a pipeline can nail them every time, other parts are judgment calls where AI and a human should work together — the scoring step is built to know the difference, rather than presenting every AI verdict as unquestionably final.

**A repeat-pass consistency check, not a single-shot verdict.** For Part 2's legacy scoring, every string is scored *twice*, independently, in parallel (no shared state between the two calls). If the two verdicts disagree, `consistentOnRepeat` is `false` and the string is automatically flagged for human review — regardless of how confident either individual pass claimed to be. A system whose entire premise is "objective scoring, not a human's opinion" should be able to demonstrate its own judgment is stable, not just assert a single confidence number and hope it's reliable.

**An independent reference translation, not just an opinion.** For each Part 2 string, the pipeline also runs it through the Part 1 translation logic — independently, without showing that result to the scoring call, to avoid anchoring it. If the reference translation and the existing translation clearly disagree, that's surfaced as an extra signal in the UI, alongside Claude's own explained verdict.

**Deterministic checks where the task doesn't need AI judgment at all.** `src/lib/integrity.ts` checks every fresh translation for placeholder/variable preservation (`{{count}}`, `{0}`, `%s`-style patterns) using plain string matching — no API call. This directly reflects a line from the "About Voxiis" context doc: *"tag integrity, variable preservation... a well-built pipeline can get those right every time."* None of this task's 18 source strings happen to contain placeholders, so this check correctly reports "passed" for all of them here — but it runs on every string regardless, exactly as it would need to in production where some strings do.

**An aggregate summary, not just a list of rows.** The top of the page shows five numbers at a glance — strings translated, how many were flagged on self-review, how many failed integrity checks, how many legacy strings were scored, and how many of those need human attention — so a non-technical reviewer gets the overall health of a batch without reading every row first.

**Every request is independent and error-isolated.** All translation and scoring calls run in parallel via `Promise.all`, but each is wrapped individually — a single failed request (rate limit, network blip, a response that doesn't call the tool) surfaces as a visible, explained error for that one row, and never takes down the rest of the batch or crashes the self-review/consistency passes layered on top of it. No exception is ever silently swallowed.

## Two known issues in the seed data (deliberately, I think) — plus one more the system found on its own

Looking at the Part 2 batch against the context each key implies:

- **`invoice.field.amount_due` → "Vencido"** — "Vencido" means *expired/overdue* (a status), but the field needs to show the *amount of money owed*, not a status word. Flagged `incorrect`, issue type `wrong_sense`.
- **`feed.button.post` → "Correo"** — "Correo" means *mail* (postal/email), but this is a button that *publishes* a post to a team feed — an action, not a piece of correspondence. Flagged `incorrect`, issue type `wrong_part_of_speech`.

The scoring pipeline also independently flagged a third case that wasn't obviously planted:

- **`ticket.button.open` → "Abierto"** — "Abierto" is an adjective/state ("opened"), not the action verb an agent clicks to perform the reopen. The system correctly suggested "Abrir" instead. This is the same *type* of error as the two above (a state/description word substituted for an action word), which suggests the scoring logic generalizes to the error pattern rather than only recognizing two memorized answers.

## Assumptions

- Spanish output is neutral/international rather than tuned to one specific dialect (es-ES vs. es-MX, etc.) — a real production version would likely need a target-locale setting.
- The `getCommentForKey` lookup in `src/lib/data.ts` only has context for the 8 keys that also appear in Part 1's batch (all 8 of them do, in this task's specific data). A production version would need a real product-string database behind this, not a hardcoded lookup.
- Confidence threshold for human-review escalation (85%) is a starting judgment call, not a tuned number — in production this would likely be adjusted based on how the scoring step performs against a larger, human-labeled sample over time.
- The consistency check runs two independent scoring passes per legacy string. This doubles the API calls for Part 2 (16 instead of 8) — a reasonable cost for a 8-string prototype, but at real production scale this would more likely run as periodic spot-checking on a sample, not on every single string every time.
- This prototype scores against the *context comment*, not against a full style guide or brand voice — a real system almost certainly also checks tone, formality, and brand-specific terminology, which this doesn't attempt to model.

## What I'd build next, given more time

- Spot-check consistency (rather than double-scoring every string) at production scale, to control cost as the string count grows into the thousands.
- A real product-string database behind `getCommentForKey`, rather than the current hardcoded lookup that only works because this task's two batches happen to share keys.
- Batching multiple strings into a single Claude call where safe, to reduce API round-trips for very large translation jobs.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Claude API (`@anthropic-ai/sdk`) via tool-calling for structured output. Two API routes (`/api/translate`, `/api/score`) called by a single client page rendering both result sets, an aggregate summary bar, and per-row self-review / consistency indicators.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # add your own ANTHROPIC_API_KEY
npm run dev
```
