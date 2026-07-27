import express from "express";

import { verifyAnyToken } from "../middlewares/auth.middleware.js";

import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

router.get("/", verifyAnyToken, getAddresses);

router.post("/", verifyAnyToken, addAddress);

router.put("/:addressId", verifyAnyToken, updateAddress);

router.delete("/:addressId", verifyAnyToken, deleteAddress);

router.patch("/:addressId/default", verifyAnyToken, setDefaultAddress);

export default router;
