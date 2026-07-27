import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "./claude";
import { TranslationInput } from "./data";
import { checkIntegrity, IntegrityCheckResult } from "./integrity";

export interface TranslationResult {
  key: string;
  source: string;
  comment: string;
  translation: string;
  reasoning: string;
  integrityCheck?: IntegrityCheckResult;
  selfReview?: {
    verdict: "correct" | "weak" | "incorrect";
    confidence: number;
    issueType: string;
    explanation: string;
    needsHumanReview: boolean;
    error?: string;
  };
  error?: string;
}


const TRANSLATE_TOOL = {
  name: "submit_translation",
  description:
    "Submit the Spanish translation for a single UI string, along with brief reasoning for the word choice.",
  input_schema: {
    type: "object" as const,
    properties: {
      translation: {
        type: "string" as const,
        description: "The Spanish translation of the source string.",
      },
      reasoning: {
        type: "string" as const,
        description:
          "One short sentence explaining why this specific Spanish word/phrase was chosen given the context, especially for ambiguous source words.",
      },
    },
    required: ["translation", "reasoning"],
  },
};

const SYSTEM_PROMPT = `You are a professional Spanish (es-ES/es-LATAM neutral) localization translator working on a B2B software product's UI strings.

CRITICAL RULE: Many English UI strings are short and genuinely ambiguous out of context (e.g. "Open", "Post", "Due", "Close"). You are always given a developer comment describing exactly where and how the string is used in the product. You MUST translate based on that SPECIFIC contextual meaning, not the most common or generic dictionary sense of the English word.

For example:
- "Post" as a verb on a "publish to a feed" button should NOT be translated the same way as "Post" meaning physical/postal mail — these are unrelated meanings that happen to share an English word.
- "Due" meaning a date/deadline is a different concept from "Due" meaning an amount of money owed — these require different Spanish words.

Always use the tool provided to submit your answer in the required structured format. Keep translations natural, concise, and appropriate for a professional software product UI (short button/label text, not a full sentence, unless the context requires it).`;

export async function translateString(
  input: TranslationInput
): Promise<TranslationResult> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      tools: [TRANSLATE_TOOL],
      tool_choice: { type: "tool", name: "submit_translation" },
      messages: [
        {
          role: "user",
          content: `Key: ${input.key}
Developer context comment: ${input.comment}
Source English string: "${input.source}"

Translate this string into Spanish, using the developer context to resolve any ambiguity.`,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
     
      return {
        key: input.key,
        source: input.source,
        comment: input.comment,
        translation: "",
        reasoning: "",
        error: "Claude did not return a structured translation for this string.",
      };
    }

    const args = toolUse.input as { translation: string; reasoning: string };
    const integrityCheck = checkIntegrity(input.source, args.translation);

    return {
      key: input.key,
      source: input.source,
      comment: input.comment,
      translation: args.translation,
      reasoning: args.reasoning,
      integrityCheck,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Translation failed for key "${input.key}":`, message);
    return {
      key: input.key,
      source: input.source,
      comment: input.comment,
      translation: "",
      reasoning: "",
      error: `Translation request failed: ${message}`,
    };
  }
}

export async function translateBatch(
  inputs: TranslationInput[]
): Promise<TranslationResult[]> {
  const results = await Promise.all(inputs.map((input) => translateString(input)));
  return results;
}
