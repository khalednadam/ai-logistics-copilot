import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ timeout: 60000 });

if (!process.env.LLM_MODEL) throw new Error("LLM_MODEL is not set");
export const model = process.env.LLM_MODEL;
