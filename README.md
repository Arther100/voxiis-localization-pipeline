# Voxiis — Localization QA Pipeline

A small working prototype of two things: context-aware Spanish translation of ambiguous UI strings, and objective quality scoring of existing translations — built with the Claude API for Voxiis's Round 2 (AI Engineer, Agents & Internal Products).

**Live demo:** _(added after deployment)_
**Repo:** https://github.com/Arther100/voxiis-localization-pipeline

---

## What this does

**Part 1 — Translation.** Given 10 English UI strings (each with a key and a short developer comment describing exact context), it produces a Spanish translation for each — using the comment to resolve genuinely ambiguous words like "Open," "Post," and "Due," which have different correct translations depending on where they appear in the product.

**Part 2 — Scoring.** Given 8 existing Spanish translations from a previous, non-AI process, it reviews each one against the same kind of context comment and produces an objective, explained verdict: `correct`, `weak`, or `incorrect`, with a confidence score, an issue category, and a plain-English explanation a non-technical reviewer can trust without reading Spanish themselves.

## Why it's built this way

**The core problem in both parts is the same one.** A short English word like "Due" or "Post" is only meaningful with context — the same word means different things depending on where it's used (a deadline vs. an amount owed; publishing a feed post vs. a physical mail address). Getting this wrong is the most common and costly kind of localization bug, because the output looks completely correct on the surface — it's valid Spanish, just for the wrong sense of the word. So both the translator and the scorer are given the exact same developer context comment and explicitly instructed to resolve ambiguity using it, not the word's most common dictionary sense.

**Structured output, not free text.** Both Claude calls use tool-calling (forced via `tool_choice`) so every response comes back as a strict, typed JSON object — a translation + one-sentence reasoning for Part 1; a verdict + confidence + issue type + explanation for Part 2. This matters because the whole point of this pipeline, per the task brief, is that a non-technical team should be able to trust it running unattended. A system that occasionally returns unparseable free text isn't trustworthy in that sense, no matter how good the underlying translations are.

**Confidence-based escalation to a human.** Every scored string gets a `needsHumanReview` flag, which is set whenever the verdict isn't a clean "correct," or whenever Claude's own confidence is below 85%. This isn't cosmetic — it's a direct reflection of Voxiis's own stated approach (from the "About Voxiis" doc): some parts of localization are deterministic and a pipeline can nail them every time, other parts are judgment calls where AI and a human should work together. The scoring step is built to know the difference between the two, rather than presenting every AI verdict as final.

**An independent reference translation, not just an opinion.** For each Part 2 string, the pipeline also runs it through the exact same Part 1 translation logic — independently, without showing that result to the scoring call, to avoid anchoring it. If the reference translation and the existing translation clearly disagree, that's surfaced as an extra signal in the UI, alongside (not instead of) Claude's own explained verdict. This uses the system's own translation capability as a cheap, independent sanity check on its scoring capability, rather than treating the two halves of the task as unrelated.

**Every string is processed independently, with real error handling.** All 10 translation requests and all 8 scoring requests run in parallel via `Promise.all`, but each one is wrapped individually — a single failed request (rate limit, network blip, a response that doesn't call the tool) surfaces as a visible, explained error for that one row, and never takes down the rest of the batch. No exception is ever silently swallowed.

## Two known issues in the seed data (deliberately, I think)

Looking at the Part 2 batch against the context each key implies:

- **`invoice.field.amount_due` → "Vencido"** — "Vencido" means *expired/overdue* (a status), but the field needs to show the *amount of money owed*, not a status word. Flagged as `incorrect`, issue type `wrong_sense`.
- **`feed.button.post` → "Correo"** — "Correo" means *mail* (postal/email), but this is a button that *publishes* a post to a team feed — an action, not a piece of correspondence. Flagged as `incorrect`, issue type `wrong_part_of_speech`.

Both are exactly the kind of error that looks fine if you only check "is this valid Spanish" — they only become visible once the actual context comment is taken into account, which is the whole design point of this pipeline.

## Assumptions

- Spanish output is neutral/international rather than tuned to one specific dialect (es-ES vs. es-MX, etc.) — a real production version would likely need a target-locale setting.
- The `getCommentForKey` lookup in `src/lib/data.ts` only has context for the 8 keys that also appear in Part 1's batch (all 8 of them do, in this task's specific data). A production version would need a real product-string database behind this, not a hardcoded lookup.
- Confidence threshold for human-review escalation (85%) is a starting judgment call, not a tuned number — in production this would likely be adjusted based on how the scoring step performs against a larger, human-labeled sample over time.
- This prototype scores against the *context comment*, not against a full style guide or brand voice — Voxiis's real system almost certainly also checks tone, formality, and brand-specific terminology, which this doesn't attempt to model.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Claude API (`@anthropic-ai/sdk`) via tool-calling for structured output. Two API routes (`/api/translate`, `/api/score`) called by a single client page that renders both result sets as tables.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # add your own ANTHROPIC_API_KEY
npm run dev
```
