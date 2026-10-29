import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors.ts";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof Error && "status" in err && typeof err.status === "number" && "expose" in err && err.expose) {
    res.status(err.status).json({ error: { code: "BAD_REQUEST", message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
};
