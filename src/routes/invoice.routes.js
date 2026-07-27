import express from "express";

import { downloadAdminInvoice, downloadInvoice } from "../controllers/invoice.controller.js";
import { verifyAdminToken, verifyAnyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/:orderId",
  verifyAnyToken,
  downloadInvoice,
);

router.get(
  "/admin/:orderId",
  verifyAdminToken,
  downloadAdminInvoice,
);

export default router;