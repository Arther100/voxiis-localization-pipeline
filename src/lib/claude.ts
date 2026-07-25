import Anthropic from "@anthropic-ai/sdk";

// Single shared client. Reads ANTHROPIC_API_KEY from the environment —
// never hardcoded, so this is safe to commit and safe to deploy.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
