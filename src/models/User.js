import mongoose from "mongoose";
import addressSchema from "./Address.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    avatar: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    addresses: {
      type: [addressSchema],
      default: [],
      validate: {
        validator: function (addresses) {
          return addresses.length <= 10;
        },
        message: "Maximum 10 addresses allowed.",
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
