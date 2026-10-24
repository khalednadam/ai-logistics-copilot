import express, { type Response } from "express";

const app = express();

app.get("/health", (_req, res: Response) => {
  res.json({ status: "ok" }).status(200);
});

export default app;
