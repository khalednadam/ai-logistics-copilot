import { z } from "zod";
import { AppError } from "../errors.ts";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractRequest } from "./extractRequest.schema.ts";
import { ExtractionResult } from "./extractionResult.schema.ts";

const anthropic = new Anthropic({ timeout: 60000 });

const prompt = readFileSync(
  join(import.meta.dirname, "../../../prompts/extract.v2.md"),
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

type ParseOutcome =
  | { ok: true; data: ExtractionResult }
  | { ok: false; reason: string; toolUseBlock?: Anthropic.ToolUseBlock };

export const parseResponse = (response: Anthropic.Message): ParseOutcome => {
  if (response.stop_reason === "max_tokens") {
    return { ok: false, reason: "response hit max_tokens" };
  }
  const toolUseBlock = response.content.find(
    (contentBlock): contentBlock is Anthropic.ToolUseBlock =>
      contentBlock.type === "tool_use" &&
      contentBlock.name === extractionTool.name,
  );
  if (!toolUseBlock) return { ok: false, reason: "no tool_use block" };

  const result = ExtractionResult.safeParse(toolUseBlock.input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, reason: z.prettifyError(result.error), toolUseBlock };
};

export const extractFromEmail = async (
  email: ExtractRequest,
): Promise<ExtractionResult> => {
  const userText = `<email>
From: ${email.from}
Subject: ${email.subject}

${email.body}
</email>`;

  const sharedRequestParams = {
    model,
    max_tokens: 500,
    system: prompt,
    tools: [extractionTool],
    tool_choice: { type: "tool" as const, name: extractionTool.name },
  };
  const firstMessages: Anthropic.MessageParam[] = [
    { role: "user", content: userText },
  ];

  const firstResponse = await anthropic.messages.create({
    ...sharedRequestParams,
    messages: firstMessages,
  });
  const firstOutcome = parseResponse(firstResponse);
  if (firstOutcome.ok) return firstOutcome.data;

  if (!firstOutcome.toolUseBlock) {
    throw new AppError(502, "EXTRACTION_FAILED", firstOutcome.reason);
  }

  const secondResponse = await anthropic.messages.create({
    ...sharedRequestParams,
    messages: [
      ...firstMessages,
      { role: "assistant", content: firstResponse.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: firstOutcome.toolUseBlock.id,
            is_error: true,
            content: `Invalid extraction, fix these and call the tool again:\n${firstOutcome.reason}`,
          },
        ],
      },
    ],
  });
  const secondOutcome = parseResponse(secondResponse);
  if (secondOutcome.ok) return secondOutcome.data;
  throw new AppError(502, "EXTRACTION_FAILED", secondOutcome.reason);
};
