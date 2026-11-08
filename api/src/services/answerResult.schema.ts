import { z } from "zod";

export const AnswerResult = z.object({
  answered: z
    .boolean()
    .describe(
      "true only if the chunks contain the answer. false if they don't, even if you know the answer from elsewhere.",
    ),
  answer: z
    .string()
    .describe(
      "The answer, using only facts from the chunks, in 1-3 sentences. If answered is false, say briefly that the policy docs don't cover this.",
    ),
  citedChunkIds: z
    .array(z.number().int())
    .describe(
      "The id of every chunk the answer uses, taken from the chunk tags. Empty if answered is false.",
    ),
});
export type AnswerResult = z.infer<typeof AnswerResult>;
