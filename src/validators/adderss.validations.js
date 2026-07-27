import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

  address1: z.string().trim().min(5, "Address Line 1 is required"),

  address2: z.string().trim().optional().or(z.literal("")),

  city: z.string().trim().min(2, "City is required"),

  state: z.string().trim().min(2, "State is required"),

  country: z.string().trim().default("India"),

  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Invalid pincode"),
});

export const updateAddressSchema = z.object({
  fullName: z.string().trim().min(2).optional(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/)
    .optional(),

  address1: z.string().trim().min(5).optional(),

  address2: z.string().trim().optional(),

  city: z.string().trim().min(2).optional(),

  state: z.string().trim().min(2).optional(),

  country: z.string().trim().optional(),

  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/)
    .optional(),
});

export const addressIdSchema = z.object({
  params: z.object({
    addressId: z.string().min(1, "Address ID is required"),
  }),
});
