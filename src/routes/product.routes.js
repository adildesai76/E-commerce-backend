import express from "express";
import upload from "../middlewares/upload.middleware.js";
import {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  getallProducts,
  getProductsByIds,
  getSimilarProducts,
} from "../controllers/product.controller.js";

import {
  verifyAdminToken,
  verifyAnyToken,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", upload.array("images", 5), verifyAdminToken, createProduct);

router.put("/:id", upload.array("images", 5), verifyAdminToken, updateProduct);

router.get("/", verifyAnyToken, getProducts);

router.get("/a/", verifyAdminToken, getallProducts);

router.get("/:id", verifyAnyToken, getProductById);

router.delete("/:id", verifyAdminToken, deleteProduct);

router.post("/by-ids", verifyAnyToken, getProductsByIds);

router.get("/:id/similar", verifyAnyToken, getSimilarProducts);

export default router;
