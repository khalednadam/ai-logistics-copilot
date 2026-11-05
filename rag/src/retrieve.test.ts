import { describe, expect, it } from "vitest";
import { mergeByRank } from "./retrieve.ts";

const chunkA = { id: 1, documentId: "doc", content: "A" };
const chunkB = { id: 2, documentId: "doc", content: "B" };
const chunkC = { id: 3, documentId: "doc", content: "C" };

describe("mergeByRank", () => {
  it("should merge two arrays of chunks by rank", () => {
    const vectorResults = [chunkA, chunkB];
    const keywordResults = [chunkB, chunkC];
    const merged = mergeByRank(vectorResults, keywordResults, 3);
    expect(merged.map((chunk) => chunk.id)).toEqual([2, 1, 3]);
  });
});