import type { Request, Response } from "express";
import type { ExtractRequest } from "../services/extractRequest.schema.ts";
import { extractFromEmail } from "../services/extract.ts";

export const extract = async (req: Request, res: Response) => {
  const result = await extractFromEmail(req.body as ExtractRequest);
  res.status(200).json(result);
};
