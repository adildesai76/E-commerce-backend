import express from "express";

import {
  getRefunds,
  approveRefund,
  rejectRefund,
} from "../../controllers/admin/adminRefund.controller.js";
import { verifyAdminToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyAdminToken, getRefunds);

router.patch("/:id/approve", verifyAdminToken, approveRefund);

router.patch("/:id/reject", verifyAdminToken, rejectRefund);

export default router;
