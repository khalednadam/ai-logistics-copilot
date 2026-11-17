import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { AskRequest } from "../services/askRequest.schema.ts";
import { ask } from "../controllers/ask.ts";

const router = Router();
router.post("/ask", validate(AskRequest), ask);
export default router;
