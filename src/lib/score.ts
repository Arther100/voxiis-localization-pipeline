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
  error?: string;
}

const SCORE_TOOL = {
  name: "submit_score",
  description:
    "Submit an objective quality assessment for one existing translation.",
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

const SYSTEM_PROMPT = `You are a senior Spanish localization quality reviewer for a B2B software product. You are given a UI string key, the English source text, a developer comment describing the exact context the string is used in, and an existing Spanish translation that was produced by a previous, non-AI process.

Your job is to objectively assess whether the existing translation correctly conveys the SPECIFIC meaning implied by the context comment — not just whether it is grammatically valid Spanish in general.

Be especially alert to short, ambiguous English words (like "Due", "Post", "Open") where a translation can be perfectly valid Spanish for a DIFFERENT sense of the word than the one actually intended here. This is the most common and costly type of localization error, because it looks correct on the surface.

Use the tool provided to submit a structured verdict, confidence score, issue category, and a plain-English explanation a non-technical reviewer can trust without needing to read Spanish themselves.`;

export async function scoreTranslation(
  input: ScoringInput
): Promise<ScoringResult> {
  const comment = getCommentForKey(input.key);

  try {
    // Run the score request and our own independent reference translation
    // in parallel. The reference translation is not shown to the scoring
    // call (to avoid anchoring bias) — it's an independent second signal
    // surfaced alongside Claude's verdict, not fed into it.
    const [response, reference] = await Promise.all([
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        tools: [SCORE_TOOL],
        tool_choice: { type: "tool", name: "submit_score" },
        messages: [
          {
            role: "user",
            content: `Key: ${input.key}
Developer context comment: ${comment}
Source English string: "${input.source}"
Existing Spanish translation: "${input.existingTranslation}"

Assess whether this existing translation correctly conveys the intended meaning given the context.`,
          },
        ],
      }),
      translateString({ key: input.key, comment, source: input.source }),
    ]);

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
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
        error: "Claude did not return a structured score for this string.",
      };
    }

    const args = toolUse.input as {
      verdict: Verdict;
      confidence: number;
      issueType: IssueType;
      explanation: string;
    };

    // Escalation rule: anything not cleanly "correct", or anything the
    // model itself is not confident about, gets flagged for a human to
    // look at rather than silently trusting the AI's verdict as final.
    // This mirrors Voxiis's own stated philosophy — deterministic parts
    // handled automatically, judgment calls routed to a human.
    const needsHumanReview =
      args.verdict !== "correct" || args.confidence < 85;

    return {
      key: input.key,
      source: input.source,
      existingTranslation: input.existingTranslation,
      comment,
      verdict: args.verdict,
      confidence: args.confidence,
      issueType: args.issueType,
      explanation: args.explanation,
      referenceTranslation: reference.translation || undefined,
      needsHumanReview,
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
