import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "./claude";
import { ScoringInput, getCommentForKey } from "./data";
import { translateString } from "./translate";

export type Verdict = "correct" | "weak" | "incorrect";
export type IssueType =
  | "wrong_sense"
  | "wrong_part_of_speech"
  | "awkward_unnatural"
  | "none";

interface RawVerdict {
  verdict: Verdict;
  confidence: number;
  issueType: IssueType;
  explanation: string;
}

export interface ScoringResult {
  key: string;
  source: string;
  existingTranslation: string;
  comment: string;
  verdict: Verdict;
  confidence: number;
  issueType: IssueType;
  explanation: string;
  referenceTranslation?: string; // what our own Part 1 pipeline would produce
  needsHumanReview: boolean;
  consistentOnRepeat?: boolean; // did a second, independent scoring pass agree?
  error?: string;
}

const SCORE_TOOL = {
  name: "submit_score",
  description:
    "Submit an objective quality assessment for one Spanish translation.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string" as const,
        enum: ["correct", "weak", "incorrect"],
        description:
          "'correct' = matches the intended contextual meaning naturally. 'weak' = technically defensible but not the best choice for this context. 'incorrect' = does not convey the intended meaning at all.",
      },
      confidence: {
        type: "number" as const,
        description:
          "Your confidence in this verdict, from 0 to 100. Lower confidence should be used when the string is genuinely borderline or you are uncertain of regional Spanish variation.",
      },
      issueType: {
        type: "string" as const,
        enum: ["wrong_sense", "wrong_part_of_speech", "awkward_unnatural", "none"],
        description:
          "'wrong_sense' = right word family but wrong meaning of an ambiguous term (e.g. 'expired' vs 'amount owed'). 'wrong_part_of_speech' = e.g. a noun used where the UI needs a verb/action, or vice versa. 'awkward_unnatural' = grammatically valid but a native speaker wouldn't phrase it this way in a UI. 'none' = no issue, use only with verdict 'correct'.",
      },
      explanation: {
        type: "string" as const,
        description:
          "One or two plain-English sentences a non-technical reviewer can read and trust, explaining the verdict without requiring them to know Spanish.",
      },
    },
    required: ["verdict", "confidence", "issueType", "explanation"],
  },
};

const SYSTEM_PROMPT = `You are a senior Spanish localization quality reviewer for a B2B software product. You are given a UI string key, the English source text, a developer comment describing the exact context the string is used in, and a Spanish translation to review — it may come from a previous non-AI process, or it may be a fresh AI-generated translation being double-checked. Review it the same way regardless of its origin.

Your job is to objectively assess whether the translation correctly conveys the SPECIFIC meaning implied by the context comment — not just whether it is grammatically valid Spanish in general.

Be especially alert to short, ambiguous English words (like "Due", "Post", "Open") where a translation can be perfectly valid Spanish for a DIFFERENT sense of the word than the one actually intended here. This is the most common and costly type of localization error, because it looks correct on the surface.

Use the tool provided to submit a structured verdict, confidence score, issue category, and a plain-English explanation a non-technical reviewer can trust without needing to read Spanish themselves.`;

// Shared core: takes a key/source/comment/translation and returns a raw
// verdict. Both the "score an existing legacy translation" path (Part 2)
// and the "double-check our own fresh translation" path (Part 1 self-review)
// call this same function, so the two can never silently drift into
// different quality bars over time.
async function runScoringCall(
  key: string,
  comment: string,
  source: string,
  translation: string
): Promise<RawVerdict | { error: string }> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    tools: [SCORE_TOOL],
    tool_choice: { type: "tool", name: "submit_score" },
    messages: [
      {
        role: "user",
        content: `Key: ${key}
Developer context comment: ${comment}
Source English string: "${source}"
Spanish translation to review: "${translation}"

Assess whether this translation correctly conveys the intended meaning given the context.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    return { error: "Claude did not return a structured score for this string." };
  }

  return toolUse.input as RawVerdict;
}

export async function scoreTranslation(
  input: ScoringInput
): Promise<ScoringResult> {
  const comment = getCommentForKey(input.key);

  try {
    // Three things run in parallel:
    // 1. The primary scoring call (the verdict we actually report)
    // 2. An independent reference translation (does OUR pipeline agree
    //    on what the translation should be, as a second signal)
    // 3. A SECOND, independent scoring call — same inputs, fresh call,
    //    no shared state — purely to check whether Claude's verdict is
    //    consistent with itself on repeat, rather than a one-off draw.
    //    A system whose entire premise is "objective, not a human's
    //    opinion" should be able to show its own judgment is stable.
    const [result, reference, repeatResult] = await Promise.all([
      runScoringCall(input.key, comment, input.source, input.existingTranslation),
      translateString({ key: input.key, comment, source: input.source }),
      runScoringCall(input.key, comment, input.source, input.existingTranslation),
    ]);

    if ("error" in result) {
      return {
        key: input.key,
        source: input.source,
        existingTranslation: input.existingTranslation,
        comment,
        verdict: "weak",
        confidence: 0,
        issueType: "none",
        explanation: "",
        needsHumanReview: true,
        error: result.error,
      };
    }

    const consistentOnRepeat =
      "error" in repeatResult ? undefined : repeatResult.verdict === result.verdict;

    // Escalation rule: anything not cleanly "correct", anything the model
    // itself is not confident about, OR anything that flips verdict on a
    // repeat call, gets flagged for a human to look at rather than
    // silently trusting a single AI pass as final. This mirrors Voxiis's
    // own stated philosophy — deterministic parts handled automatically,
    // judgment calls (and anything unstable) routed to a human.
    const needsHumanReview =
      result.verdict !== "correct" ||
      result.confidence < 85 ||
      consistentOnRepeat === false;

    return {
      key: input.key,
      source: input.source,
      existingTranslation: input.existingTranslation,
      comment,
      verdict: result.verdict,
      confidence: result.confidence,
      issueType: result.issueType,
      explanation: result.explanation,
      referenceTranslation: reference.translation || undefined,
      needsHumanReview,
      consistentOnRepeat,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Scoring failed for key "${input.key}":`, message);
    return {
      key: input.key,
      source: input.source,
      existingTranslation: input.existingTranslation,
      comment,
      verdict: "weak",
      confidence: 0,
      issueType: "none",
      explanation: "",
      needsHumanReview: true,
      error: `Scoring request failed: ${message}`,
    };
  }
}

export async function scoreBatch(
  inputs: ScoringInput[]
): Promise<ScoringResult[]> {
  const results = await Promise.all(inputs.map((input) => scoreTranslation(input)));
  return results;
}

// --- Self-review path for Part 1 ---
// Runs a fresh translation back through the exact same scoring core used
// for legacy translations. This closes the loop: the pipeline doesn't just
// judge OTHER people's old translations by this bar, it holds its own
// freshly-generated output to the identical standard.

export interface SelfReview {
  verdict: Verdict;
  confidence: number;
  issueType: IssueType;
  explanation: string;
  needsHumanReview: boolean;
  error?: string;
}

export async function selfReviewTranslation(
  key: string,
  comment: string,
  source: string,
  translation: string
): Promise<SelfReview> {
  try {
    const result = await runScoringCall(key, comment, source, translation);

    if ("error" in result) {
      return {
        verdict: "weak",
        confidence: 0,
        issueType: "none",
        explanation: "",
        needsHumanReview: true,
        error: result.error,
      };
    }

    return {
      verdict: result.verdict,
      confidence: result.confidence,
      issueType: result.issueType,
      explanation: result.explanation,
      needsHumanReview: result.verdict !== "correct" || result.confidence < 85,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Self-review failed for key "${key}":`, message);
    return {
      verdict: "weak",
      confidence: 0,
      issueType: "none",
      explanation: "",
      needsHumanReview: true,
      error: `Self-review request failed: ${message}`,
    };
  }
}
