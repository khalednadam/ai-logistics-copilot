import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import app from "../app.ts";
import { errorHandler } from "./errors.ts";
import { validate } from "./validate.ts";

const testApp = express();
testApp.use(express.json());
testApp.post("/echo", validate(z.object({ email: z.string().min(1) })), (req, res) => {
  res.json(req.body);
});
testApp.use(errorHandler);

const servers = [app.listen(0), testApp.listen(0)];
const [appUrl, testUrl] = servers.map((s) => `http://localhost:${(s.address() as AddressInfo).port}`);
afterAll(() => servers.forEach((s) => s.close()));

const post = (url: string, body: string) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });

describe("validate", () => {
  it("passes parsed body through and strips unknown keys", async () => {
    const res = await post(`${testUrl}/echo`, JSON.stringify({ email: "hi", extra: 1 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "hi" });
  });

  it("rejects an invalid body with 400 VALIDATION_ERROR", async () => {
    const res = await post(`${testUrl}/echo`, JSON.stringify({ email: 42 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("email");
  });

  it("turns malformed JSON into 400, not 500", async () => {
    const res = await post(`${appUrl}/health`, "{bad");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("BAD_REQUEST");
  });
});
