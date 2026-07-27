import express from "express";
import { getWallet } from "../controllers/wallet.controller.js";

import { verifyAnyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyAnyToken, getWallet);

export default router;
