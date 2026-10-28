import { z } from "zod";
import { AppError } from "../errors.ts";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractRequest } from "./extractRequest.schema.ts";
import { ExtractionResult } from "./extractionResult.schema.ts";

const anthropic = new Anthropic({ timeout: 60000 });

const prompt = readFileSync(
  join(import.meta.dirname, "../../../prompts/extract.v1.md"),
  "utf-8",
);

// Fail at startup, not on the first request, if the model isn't configured.
if (!process.env.LLM_MODEL) throw new Error("LLM_MODEL is not set");
const model = process.env.LLM_MODEL;

const extractionTool: Anthropic.Tool = {
  name: "record_extraction",
  description: "Record the fields extracted from one merchant email.",
  input_schema: z.toJSONSchema(ExtractionResult) as Anthropic.Tool.InputSchema,
};

export async function extractFromEmail(
  email: ExtractRequest,
): Promise<unknown> {
  const userText = `<email>
From: ${email.from}
Subject: ${email.subject}

${email.body}
</email>`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 500,
    system: prompt,
    messages: [{ role: "user", content: userText }],
    tools: [extractionTool],
    tool_choice: { type: "tool", name: extractionTool.name },
  });

  console.log(JSON.stringify(response.content, null, 2));
  return response.content;
}
