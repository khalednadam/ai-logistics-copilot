import { z } from "zod";
import { AppError } from "../errors.ts";

export const ExtractRequest = z.object({
  from: z.string().min(1),
  subject: z.string(),
  body: z.string().min(1),
});
export type ExtractRequest = z.infer<typeof ExtractRequest>;

// TODO: LLM extraction + order lookup. Replace `unknown` with your result type.
export async function extractFromEmail(_email: ExtractRequest): Promise<unknown> {
  throw new AppError(501, "NOT_IMPLEMENTED", "Extraction is not implemented yet");
}
