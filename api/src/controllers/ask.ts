import type { Request, Response } from "express";
import { answerQuestion } from "../services/answer.ts";
import type { AskRequest } from "../services/askRequest.schema.ts";

export const ask = async (
  req: Request<Record<string, string>, unknown, AskRequest>,
  res: Response,
) => {
  const answer = await answerQuestion(req.body.question);
  res.status(200).json({ result: answer });
};
