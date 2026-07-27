import express from "express";

import { requestRefund } from "../controllers/refund.controller.js";
import { verifyAnyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:orderId", verifyAnyToken, requestRefund);

export default router;
