import express from "express";
const router = express.Router();

import {
  getProfile,
  updateProfile,
} from "../controllers/profile.controller.js";
import { verifyAnyToken } from "../middlewares/auth.middleware.js";

/**
 * @route   GET /profile
 * @desc    Get logged-in user's profile
 * @access  Protected
 */
router.get("/", verifyAnyToken, getProfile);

/**
 * @route   PATCH /profile
 * @desc    Update logged-in user's name
 * @access  Protected
 */
router.patch("/", verifyAnyToken, updateProfile);

export default router;
