import express from "express";
import { generateProductDescription } from "../../controllers/admin/ai/productDescription.controller.js";
import { generateSEOTitles } from "../../controllers/admin/ai/seoTitle.controller.js";
import { generateKeywords } from "../../controllers/admin/ai/keyword.controller.js";
import { removeImageBackground } from "../../controllers/admin/ai/imageBackground.controller.js";
import { generateSalesInsights } from "../../controllers/admin/ai/salesInsights.controller.js";
import { generateInventoryForecast } from "../../controllers/admin/ai/inventoryForecast.controller.js";
import { askCustomerSupportAI } from "../../controllers/admin/ai/customerSupport.controller.js";

import {
  verifyAdminToken,
  verifyAnyToken,
} from "../../middlewares/auth.middleware.js";
import multer from "multer";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AI Content Generation
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/product-description",
  verifyAdminToken,
  generateProductDescription,
);

router.post("/seo-title", verifyAdminToken, generateSEOTitles);

router.post("/keywords", verifyAdminToken, generateKeywords);

/*
|--------------------------------------------------------------------------
| AI Image Tools
|--------------------------------------------------------------------------
*/

router.post(
  "/remove-background",
  verifyAdminToken,
  upload.single("image"),
  removeImageBackground,
);

/*
|--------------------------------------------------------------------------
| AI Business Intelligence
|--------------------------------------------------------------------------
*/

router.get("/sales-insights", verifyAdminToken, generateSalesInsights);

router.get("/inventory-forecast", verifyAdminToken, generateInventoryForecast);

/*
|--------------------------------------------------------------------------
| AI Customer Support
|--------------------------------------------------------------------------
*/
router.post("/customer-support", verifyAnyToken, askCustomerSupportAI);

export default router;
