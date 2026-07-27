import { z } from "zod";

export const getCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional().default(""),
  }),
});

export const customerIdSchema = z.object({
  params: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
  }),

  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50)
      .optional(),

    email: z.string().trim().email("Invalid email address").optional(),
  }),
});
