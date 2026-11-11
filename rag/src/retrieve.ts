import { asc, cosineDistance, desc, sql } from "drizzle-orm";
import { chunks } from "@portside/db/schema";
import { db } from "@portside/db";
import { embedTexts } from "./embed.ts";

type RetrieveChunk = {
  id: number;
  documentId: string;
  content: string;
};

export const searchByVector = (questionEmbedding: number[], limit: number) => {
  const distance = cosineDistance(chunks.embedding, questionEmbedding);
  return db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      content: chunks.content,
      distance,
    })
    .from(chunks)
    .orderBy(asc(distance))
    .limit(limit);
};

export const searchByKeyword = (question: string, limit: number) => {
  const keywordQuery = sql`to_tsquery('english', replace(plainto_tsquery('english', ${question})::text, ' & ', ' | '))`;
  const rank = sql<number>`ts_rank(${chunks.searchVector}, ${keywordQuery})`;
  return db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      content: chunks.content,
      rank,
    })
    .from(chunks)
    .where(sql`${chunks.searchVector} @@ ${keywordQuery}`)
    .orderBy(desc(rank))
    .limit(limit);
};
export const mergeByRank = (
  vectorResults: RetrieveChunk[],
  keywordResults: RetrieveChunk[],
  limit: number,
) => {
  const scoredChunks = new Map<number, RetrieveChunk & { score: number }>();

  for (const results of [vectorResults, keywordResults]) {
    results.forEach((chunk, index) => {
      const points = 1 / (60 + index + 1);
      const existing = scoredChunks.get(chunk.id);
      if (existing) {
        existing.score += points;
      } else {
        scoredChunks.set(chunk.id, { ...chunk, score: points });
      }
    });
  }
  return [...scoredChunks.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export const hybridSearch = async (question: string, limit: number) => {
  const [questionEmbedding] = await embedTexts([question], "query");
  const vectorResults = await searchByVector(questionEmbedding, limit * 2);
  const keywordResults = await searchByKeyword(question, limit * 2);
  return {
    chunks: mergeByRank(vectorResults, keywordResults, limit),
    closestDistance: vectorResults[0]?.distance,
  };
};
