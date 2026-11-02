import { describe, expect, it } from "vitest";
import { chunkDocument } from "./chunk.ts";

const sampleMarkdown = `# Sample Policy

Intro text that should be dropped.

## First section

First body.

## Second section

Second body.
`;

describe("chunkDocument", () => {
  it("returns the title and one chunk per section", () => {
    const result = chunkDocument(sampleMarkdown);
    expect(result.title).toBe("Sample Policy");
    expect(result.chunks[0].chunkIndex).toBe(0);
    expect(result.chunks[1].chunkIndex).toBe(1);
    expect(result.chunks).toHaveLength(2);
  });

  it("puts the title and section text in each chunk", () => {
    const result = chunkDocument(sampleMarkdown);
    expect(result.chunks[0].content).toBe(
      "Sample Policy\nFirst section\n\nFirst body.",
    );
    expect(result.chunks[0].content).not.contain("Intro text");
  });

  it("throws an error if no title is found", () => {
    expect(() => chunkDocument("## Only a section")).toThrow();
  });
});
