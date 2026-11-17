import express from "express";
import { errorHandler, notFound } from "./middleware/errors.ts";
import extractRouter from "./routes/extract.ts";
import healthRouter from "./routes/health.ts";
import askRouter from "./routes/ask.ts";

const app = express();

app.use(express.json());

app.use(healthRouter);
app.use(extractRouter);
app.use(askRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
