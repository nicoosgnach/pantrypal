import { anthropic } from "@ai-sdk/anthropic";

export const FAST_MODEL_ID = process.env.ANTHROPIC_FAST_MODEL ?? "claude-haiku-5-5";
export const STRONG_MODEL_ID = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

export const fastModel = anthropic(FAST_MODEL_ID);
export const strongModel = anthropic(STRONG_MODEL_ID);
