import { afterEach, describe, expect, it, vi } from "vitest";
import { embedTexts } from "./embed.ts";

const stubFetch = (responseBody: unknown, status = 200) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(responseBody), { status })),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("embedTexts", () => {
  it("returns one vector per text", async () => {
    stubFetch({ data: [{ embedding: [0.1, 0.2] }] });

    const vectors = await embedTexts(["one"], "query");

    expect(vectors).toEqual([[0.1, 0.2]]);
  });

  it("throws an error if the request fails", async () => {
    stubFetch({ error: "Request failed" }, 500);

    await expect(embedTexts(["one"], "query")).rejects.toThrow("Request failed");
  });

  it("throws an error if the response is not valid", async () => {
    stubFetch({ data: [{ embedding: "not-a-vector" }] });

    await expect(embedTexts(["one"], "query")).rejects.toThrow();
  });

  it("throws an error if the embedding count does not match the texts", async () => {
    stubFetch({ data: [{ embedding: [0.1, 0.2] }] });

    await expect(embedTexts(["one", "two"], "query")).rejects.toThrow(
      "Expected 2 embeddings, got 1",
    );
  });
});
