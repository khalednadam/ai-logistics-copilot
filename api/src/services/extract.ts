import { z } from "zod";
import { AppError } from "../errors.ts";
import { readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractRequest } from "./extractRequest.schema.ts";
import { ExtractionResult } from "./extractionResult.schema.ts";

const PROMPT_VERSION = "v2";

const anthropic = new Anthropic({ timeout: 60000 });

const prompt = readFileSync(
  join(import.meta.dirname, `../../../prompts/extract.${PROMPT_VERSION}.md`),
  "utf-8",
);

if (!process.env.LLM_MODEL) throw new Error("LLM_MODEL is not set");
const model = process.env.LLM_MODEL;

const INPUT_PRICE_PER_MILLION = 0.1;
const OUTPUT_PRICE_PER_MILLION = 0.5;

const logLlmCall = (response: Anthropic.Message, latencyMs: number) => {
  const { input_tokens, output_tokens } = response.usage;
  const estimatedCostUsd =
    (input_tokens * INPUT_PRICE_PER_MILLION +
      output_tokens * OUTPUT_PRICE_PER_MILLION) /
    1_000_000;
  console.log(
    JSON.stringify({
      event: "llm_call",
      model: response.model,
      promptVersion: `extract.${PROMPT_VERSION}`,
      inputTokens: input_tokens,
      outputTokens: output_tokens,
      latencyMs,
      estimatedCostUsd,
    }),
  );
};

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

  const firstStartedAt = Date.now();
  const firstResponse = await anthropic.messages.create({
    ...sharedRequestParams,
    messages: firstMessages,
  });
  logLlmCall(firstResponse, Date.now() - firstStartedAt);
  const firstOutcome = parseResponse(firstResponse);
  if (firstOutcome.ok) return firstOutcome.data;

  if (!firstOutcome.toolUseBlock) {
    throw new AppError(502, "EXTRACTION_FAILED", firstOutcome.reason);
  }

  const secondStartedAt = Date.now();
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
  logLlmCall(secondResponse, Date.now() - secondStartedAt);
  const secondOutcome = parseResponse(secondResponse);
  if (secondOutcome.ok) return secondOutcome.data;
  throw new AppError(502, "EXTRACTION_FAILED", secondOutcome.reason);
};
