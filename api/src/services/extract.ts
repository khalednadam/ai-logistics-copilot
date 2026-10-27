import { z } from "zod";
import { AppError } from "../errors.ts";

export const ExtractRequest = z.object({
  from: z.string().min(1),
  subject: z.string(),
  body: z.string().min(1),
});
export type ExtractRequest = z.infer<typeof ExtractRequest>;

// What the LLM must return. Descriptions are sent to the model inside the tool schema.
export const ExtractionResult = z.object({
  orderIds: z
    .array(z.string())
    .describe(
      "Order IDs that literally appear in the email, digits only ('#4412' -> '4412'). Never infer one from a tracking number. Empty array if none.",
    ),
  trackingNumbers: z
    .array(z.string())
    .describe(
      "Carrier tracking numbers exactly as written in the email (e.g. 'PS4417SZGB'). Empty array if none.",
    ),
  intent: z
    .enum([
      "status_inquiry",
      "delay_inquiry",
      "damage_claim",
      "return_request",
      "quote_request",
      "other",
    ])
    .describe(
      "The main thing the sender wants. If there are several, pick the most pressing one.",
    ),
  urgency: z
    .enum(["high", "normal", "low"])
    .describe(
      "high: missed delivery date, angry or escalating tone, or money at stake. low: no time pressure. Otherwise normal.",
    ),
  summary: z
    .string()
    .max(300)
    .describe("One sentence for an ops agent: who wants what, about which order."),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;

// TODO: LLM extraction + order lookup. Replace `unknown` with your result type.
export async function extractFromEmail(
  _email: ExtractRequest,
): Promise<unknown> {
  throw new AppError(
    501,
    "NOT_IMPLEMENTED",
    "Extraction is not implemented yet",
  );
}
