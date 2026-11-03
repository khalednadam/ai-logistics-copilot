import { z } from "zod";

const apiKey = process.env.EMBEDDING_API_KEY;
const EMBEDDING_MODEL = "voyage-4";

const EmbeddingResponse = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
    }),
  ),
});

export const embedTexts = async (
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> => {
  if (!apiKey) throw new Error("EMBEDDING_API_KEY is not set");

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Voyage request failed with ${response.status}: ${await response.text()}`,
    );
  }

  const responseBody = EmbeddingResponse.parse(await response.json());

  if (responseBody.data.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, got ${responseBody.data.length}`,
    );
  }

  return responseBody.data.map((item) => item.embedding);
};
