import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: ["order", "profile", "offer", "wishlist", "system" , "refund"],
      default: "system",
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
