import express from "express";

import {
  createNotification,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

import {
  verifyAdminToken,
  verifyAnyToken,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyAnyToken, getNotifications);

router.patch("/read-all", verifyAnyToken, markAllNotificationsAsRead);

router.patch("/:id/read", verifyAnyToken, markNotificationAsRead);

router.delete("/:id", verifyAnyToken, deleteNotification);

router.post("/", verifyAdminToken, createNotification);

export default router;
