import express from "express";

import {
  getAdminStore,
  updateAdminStore,
  uploadStoreLogo,
  addBanner,
  updateBanner,
  deleteBanner,
  uploadInvoiceSignature,
  uploadInvoiceStamp,
} from "../../controllers/admin/adminStore.controller.js";

import upload from "../../middlewares/upload.middleware.js";
import { verifyAdminToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ---------------------------------------------------------
 * All Store Settings Routes
 * Admin Only
 * ---------------------------------------------------------
 */

router.use(verifyAdminToken);

/**
 * ---------------------------------------------------------
 * Store Settings
 * ---------------------------------------------------------
 */

router.get("/", getAdminStore);

router.put("/", updateAdminStore);

/**
 * ---------------------------------------------------------
 * Logo
 * ---------------------------------------------------------
 */

router.post("/logo", upload.single("logo"), uploadStoreLogo);

router.post(
  "/invoice/signature",
  upload.single("signature"),
  uploadInvoiceSignature,
);

router.post("/invoice/stamp", upload.single("stamp"), uploadInvoiceStamp);

/**
 * ---------------------------------------------------------
 * Banner
 * ---------------------------------------------------------
 */

router.post("/banner", upload.single("image"), addBanner);

router.put("/banner/:bannerId", upload.single("image"), updateBanner);

router.delete("/banner/:bannerId", deleteBanner);

export default router;
