import { z } from "zod";

const marketingSchema = z.object({
  source: z.string().trim().optional().default("Direct"),

  medium: z.string().trim().optional().default(""),

  campaign: z.string().trim().optional().default(""),

  referrer: z.string().trim().optional().default(""),
});

export const createOrderSchema = z.object({
  addressId: z.string().trim().min(1, "Address ID is required"),

  paymentMethod: z.enum(["COD", "STRIPE", "RAZORPAY"], {
    errorMap: () => ({
      message: "Invalid payment method",
    }),
  }),

  marketing: marketingSchema.optional(),
});

export const orderIdSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, "Order ID is required"),
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ]),
});
