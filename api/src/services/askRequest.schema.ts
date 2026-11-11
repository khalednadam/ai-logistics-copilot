import { z } from "zod";

export const AskRequest = z.object({
  question: z.string().trim().min(1).max(500),
});
export type AskRequest = z.infer<typeof AskRequest>;
