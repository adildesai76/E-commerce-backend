import Notification from "../models/Notification.js";
import { emitNotification } from "../socket/socket.js";

export const sendNotification = async ({
  userId,
  title,
  message,
  type = "system",
  link = "",
  metadata = {},
}) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    link,
    metadata,
  });

  emitNotification(userId, notification);

  return notification;
};
