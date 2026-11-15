import type Anthropic from "@anthropic-ai/sdk";

const INPUT_PRICE_PER_MILLION = 0.1;
const OUTPUT_PRICE_PER_MILLION = 0.5;

export const logLlmCall = (
  response: Anthropic.Message,
  latencyMs: number,
  promptName: string,
  promptVersion: string,
) => {
  const { input_tokens, output_tokens } = response.usage;
  const estimatedCostUsd =
    (input_tokens * INPUT_PRICE_PER_MILLION +
      output_tokens * OUTPUT_PRICE_PER_MILLION) /
    1_000_000;
  console.log(
    JSON.stringify({
      event: "llm_call",
      model: response.model,
      promptName,
      promptVersion,
      inputTokens: input_tokens,
      outputTokens: output_tokens,
      latencyMs,
      estimatedCostUsd,
    }),
  );
};
