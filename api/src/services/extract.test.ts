import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { parseResponse } from "./extract.ts";

// parseResponse only reads content and stop_reason, so the cast skips the other required fields.
const makeMessage = (
  content: Anthropic.ContentBlock[],
  stopReason: Anthropic.StopReason = "tool_use",
) => ({ content, stop_reason: stopReason }) as Anthropic.Message;

const makeToolUseBlock = (input: unknown) =>
  ({
    type: "tool_use",
    id: "toolu_test",
    name: "record_extraction",
    input,
  }) as Anthropic.ToolUseBlock;

// Passes the schema as-is; each test breaks one field so a failure points at that field.
const validInput = {
  orderIds: ["4412"],
  trackingNumbers: [],
  intent: "delay_inquiry",
  urgency: "high",
  summary: "Merchant asks why order 4412 is late.",
};

describe("parseResponse", () => {
  it("returns ok:false with the toolUseBlock when intent is invalid", () => {
    const toolUseBlock = makeToolUseBlock({ ...validInput, intent: "banana" });

    const outcome = parseResponse(makeMessage([toolUseBlock]));

    expect(outcome).toMatchObject({
      ok: false,
      toolUseBlock: { id: "toolu_test" },
    });
    if (outcome.ok) throw new Error("expected ok:false");
    expect(outcome.reason).toContain("intent");
  });

  it("returns ok:false without a toolUseBlock on max_tokens", () => {
    const toolUseBlock = makeToolUseBlock(validInput);

    const outcome = parseResponse(makeMessage([toolUseBlock], "max_tokens"));

    expect(outcome).toMatchObject({
      ok: false,
      reason: "response hit max_tokens",
    });
    if (outcome.ok) throw new Error("expected ok:false");
    expect(outcome.toolUseBlock).toBeUndefined();
  });

  it("returns ok:true with the parsed data for a valid extraction", () => {
    const toolUseBlock = makeToolUseBlock(validInput);

    const outcome = parseResponse(makeMessage([toolUseBlock]));

    expect(outcome).toEqual({
      ok: true,
      data: validInput,
    });
  });
});
