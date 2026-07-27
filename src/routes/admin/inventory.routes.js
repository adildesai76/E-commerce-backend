import express from "express";
import {
  getInventory,
  updateStock,
} from "../../controllers/admin/inventory.controller.js";
import { verifyAdminToken } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/", verifyAdminToken, getInventory);
router.patch("/:id/stock", verifyAdminToken, updateStock);

export default router;
