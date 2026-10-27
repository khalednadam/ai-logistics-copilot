import type { Request, Response } from "express";
import type { ExtractRequest } from "../services/extract.ts";
import { extractFromEmail } from "../services/extract.ts";

export async function extract(req: Request, res: Response) {
  const result = await extractFromEmail(req.body as ExtractRequest);
  res.status(200).json(result);
}
