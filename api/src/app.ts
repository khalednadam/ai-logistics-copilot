import express, { type Response } from "express";
import { errorHandler, notFound } from "./middleware/errors.ts";

const app = express();

app.use(express.json());

app.get("/health", (_req, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
