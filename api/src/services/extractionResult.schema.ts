import { z } from "zod";

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
      "What the sender is asking for. If several, pick the first in this order: delay_inquiry, damage_claim, status_inquiry, quote_request, return_request, other.",
    ),
  urgency: z
    .enum(["high", "normal", "low"])
    .describe(
      "Urgency as the email states it. high: sender mentions a missed date, money at stake, or an urgent or escalating tone. low: no time pressure. Otherwise normal.",
    ),
  summary: z
    .string()
    .max(300)
    .describe(
      "One sentence for an ops agent: who wants what, about which order.",
    ),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;
