import { Router } from "express";
import { extract } from "../controllers/extract.ts";
import { validate } from "../middleware/validate.ts";
import { ExtractRequest } from "../services/extract.ts";

const router = Router();

router.post("/extract", validate(ExtractRequest), extract);

export default router;
