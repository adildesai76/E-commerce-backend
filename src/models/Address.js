import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    address1: {
      type: String,
      required: [true, "Address Line 1 is required"],
      trim: true,
    },

    address2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  },
);

export default addressSchema;
