import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors.ts";

export const validate = (schema: z.ZodType) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, "VALIDATION_ERROR", z.prettifyError(result.error)));
      return;
    }
    req.body = result.data;
    next();
  };
