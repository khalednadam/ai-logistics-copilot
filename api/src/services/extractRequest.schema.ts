import { z } from "zod";

export const ExtractRequest = z.object({
  from: z.string().min(1),
  subject: z.string(),
  body: z.string().min(1),
});
export type ExtractRequest = z.infer<typeof ExtractRequest>;
