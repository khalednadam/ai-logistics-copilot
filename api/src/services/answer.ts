import { hybridSearch, type RetrieveChunk } from "@portside/rag/retrieve";
import { AnswerResult } from "./answerResult.schema.ts";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";
import { anthropic, model } from "../llm/client.ts";
import { logLlmCall } from "../llm/logLlmCall.ts";
import { AppError } from "../errors.ts";

const DISTANCE_THRESHOLD = 0.6;
const LIMIT = 5;

const PROMPT_VERSION = "v1";

const prompt = readFileSync(
  join(import.meta.dirname, `../../../prompts/answer.${PROMPT_VERSION}.md`),
  "utf-8",
);

type ParseOutcome =
  | { ok: true; data: AnswerResult }
  | { ok: false; reason: string; toolUseBlock?: Anthropic.ToolUseBlock };

export const parseResponse = (
  response: Anthropic.Message,
  chunkIds: number[],
): ParseOutcome => {
  if (response.stop_reason === "max_tokens") {
    return { ok: false, reason: "response hit max_tokens" };
  }
  const toolUseBlock = response.content.find(
    (contentBlock): contentBlock is Anthropic.ToolUseBlock =>
      contentBlock.type === "tool_use" && contentBlock.name === answerTool.name,
  );
  if (!toolUseBlock) {
    return { ok: false, reason: "no tool_use block" };
  }

  const result = AnswerResult.safeParse(toolUseBlock.input);
  if (!result.success) {
    return {
      ok: false,
      reason: z.prettifyError(result.error),
      toolUseBlock,
    };
  }
  const badIds = result.data.citedChunkIds.filter(
    (chunkId) => !chunkIds.includes(chunkId),
  );
  if (badIds.length > 0) {
    return {
      ok: false,
      reason: `wrong chunks are included in the answer: ${badIds.join(", ")}`,
      toolUseBlock,
    };
  }
  if (result.data.answered && result.data.citedChunkIds.length === 0) {
    return {
      ok: false,
      reason: "answer provided but no chunks cited",
      toolUseBlock,
    };
  }
  return { ok: true, data: result.data };
};

const answerTool: Anthropic.Tool = {
  name: "record_answer",
  description:
    "Record the answer to a policy question, using only the provided chunks, with the ids of the chunks used.",
  input_schema: z.toJSONSchema(AnswerResult) as Anthropic.Tool.InputSchema,
};

export const answerQuestion = async (
  question: string,
): Promise<AnswerResult> => {
  const { chunks, closestDistance } = await hybridSearch(question, LIMIT);
  if (closestDistance !== undefined && closestDistance < DISTANCE_THRESHOLD) {
    const sharedRequestParams = {
      model,
      max_tokens: 1024,
      system: prompt,
      tools: [answerTool],
      tool_choice: { type: "tool" as const, name: answerTool.name },
    };
    const firstMessages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserMessage(question, chunks) },
    ];
    const retrievedChunkIds = chunks.map((chunk) => chunk.id);
    let startedAt: number = Date.now();
    const firstResponse = await anthropic.messages.create({
      ...sharedRequestParams,
      messages: firstMessages,
    });
    logLlmCall(firstResponse, Date.now() - startedAt, "answer", PROMPT_VERSION);

    const firstOutcome = parseResponse(firstResponse, retrievedChunkIds);
    if (firstOutcome.ok) {
      return firstOutcome.data;
    }

    if (firstOutcome.toolUseBlock) {
      const secondMessages: Anthropic.MessageParam[] = [
        ...firstMessages,
        { role: "assistant", content: firstResponse.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: firstOutcome.toolUseBlock.id,
              is_error: true,
              content: [
                {
                  type: "text",
                  text: `Your answer was rejected. Fix these problems and call record_answer again:\n${firstOutcome.reason}`,
                },
              ],
            },
          ],
        },
      ];
      startedAt = Date.now();
      const secondResponse = await anthropic.messages.create({
        ...sharedRequestParams,
        messages: secondMessages,
      });
      logLlmCall(
        secondResponse,
        Date.now() - startedAt,
        "answer",
        PROMPT_VERSION,
      );
      const secondOutcome = parseResponse(secondResponse, retrievedChunkIds);
      if (secondOutcome.ok) {
        return secondOutcome.data;
      }
      throw new AppError(502, "ANSWER_FAILED", secondOutcome.reason);
    } else {
      throw new AppError(502, "ANSWER_FAILED", firstOutcome.reason);
    }
  }

  return {
    answer: "I don't know. The policy docs don't cover this.",
    answered: false,
    citedChunkIds: [],
  };
};

export const buildUserMessage = (
  question: string,
  chunks: RetrieveChunk[],
): string => {
  const chunkBlocks = chunks
    .map(
      (chunk) =>
        `<chunk id="${chunk.id}" document="${chunk.documentId}">\n${chunk.content}\n</chunk>`,
    )
    .join("\n");
  return `<chunks>\n${chunkBlocks}\n</chunks>\n<question>${question}</question>`;
};
