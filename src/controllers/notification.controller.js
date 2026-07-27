import Notification from "../models/Notification.js";
import { emitNotification } from "../socket/socket.js";
import { sendNotification } from "../utils/sendNotification.js";

/**
 * GET /notifications
 * User Notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({
        userId: req.user.id,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Notification.countDocuments({
        userId: req.user.id,
      }),

      Notification.countDocuments({
        userId: req.user.id,
        isRead: false,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      notifications,

      unreadCount,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch notifications.",
    });
  }
};

/**
 * PATCH /notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update notification.",
    });
  }
};

/**
 * PATCH /notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update notifications.",
    });
  }
};
/**
 * DELETE /notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized.",
      });
    }

    await notification.deleteOne();

    return res.status(200).json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to delete notification.",
    });
  }
};

/**
 * POST /notifications
 * Admin/System Notification
 */
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type = "system",
      link = "",
      metadata = {},
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        message: "User, title and message are required.",
      });
    }

    const notification = await sendNotification({
      userId,
      title,
      message,
      type,
      link,
      metadata,
    });

    emitNotification(userId, notification);

    return res.status(201).json({
      message: "Notification created successfully.",
      notification,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create notification.",
    });
  }
};
