import { hybridSearch, type RetrieveChunk } from "@portside/rag/retrieve";
import { AnswerResult } from "./answerResult.schema.ts";

const DISTANCE_THRESHOLD = 0.6;
const LIMIT = 5;

export const answerQuestion = async (
  question: string,
): Promise<AnswerResult> => {
  const { chunks, closestDistance } = await hybridSearch(question, LIMIT);
  if (closestDistance !== undefined && closestDistance < DISTANCE_THRESHOLD) {
    return {
      answer: chunks.map((chunk) => chunk.content).join("\n"),
      answered: true,
      citedChunkIds: chunks.map((chunk) => chunk.id),
    };
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
