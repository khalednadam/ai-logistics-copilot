import type { Request, Response } from "express";
import type { ExtractRequest } from "../services/extractRequest.schema.ts";
import { extractFromEmail } from "../services/extract.ts";
import { lookupOrders } from "../services/lookupOrders.ts";

export const extract = async (req: Request, res: Response) => {
  const extraction = await extractFromEmail(req.body as ExtractRequest);
  const orders = await lookupOrders(extraction.orderIds, extraction.trackingNumbers);
  res.status(200).json({ extraction, orders });
};
