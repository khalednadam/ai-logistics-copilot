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

export const parseResponse = (response: Anthropic.Message): AnswerResult => {
  if (response.stop_reason === "max_tokens") {
    throw new AppError(502, "ANSWER_FAILED", "response hit max_tokens");
  }
  const toolUseBlock = response.content.find(
    (contentBlock): contentBlock is Anthropic.ToolUseBlock =>
      contentBlock.type === "tool_use" && contentBlock.name === answerTool.name,
  );
  if (!toolUseBlock)
    throw new AppError(502, "ANSWER_FAILED", "no tool_use block");

  const result = AnswerResult.safeParse(toolUseBlock.input);
  if (result.success) return result.data;
  throw new AppError(502, "ANSWER_FAILED", z.prettifyError(result.error));
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
    const startedAt = Date.now();
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: prompt,
      tools: [answerTool],
      tool_choice: { type: "tool" as const, name: answerTool.name },
      messages: [{ role: "user", content: buildUserMessage(question, chunks) }],
    });
    logLlmCall(response, Date.now() - startedAt, "answer", PROMPT_VERSION);
    const result = parseResponse(response);
    const badIds = result.citedChunkIds.filter(chunkId => !chunks.some(chunk => chunk.id === chunkId));
    if (badIds.length > 0) {
      throw new AppError(502, "ANSWER_FAILED", `wrong chunks are included in the answer: ${badIds.join(", ")}`);
    }
    if (result.answered && result.citedChunkIds.length === 0) {
      throw new AppError(502, "ANSWER_FAILED", "answer provided but no chunks cited");
    }
    return result;
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
