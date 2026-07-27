import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Banner                                                                      */
/* -------------------------------------------------------------------------- */

export const bannerSchema = z.object({
  title: z.string().trim().max(100).optional(),

  subtitle: z.string().trim().max(200).optional(),

  buttonText: z.string().trim().max(50).optional(),

  buttonLink: z.string().trim().optional(),

  active: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;

      if (typeof value === "boolean") return value;

      return value === "true";
    }),

  order: z
    .union([z.number(), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;

      return Number(value);
    }),
});

/* -------------------------------------------------------------------------- */
/* Store Settings                                                              */
/* -------------------------------------------------------------------------- */

export const updateAdminStoreSchema = z.object({
  storeName: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().optional(),

  contact: z
    .object({
      email: z.string().email().optional(),

      phone: z.string().optional(),

      whatsapp: z.string().optional(),
    })
    .optional(),

  address: z
    .object({
      street: z.string().optional(),

      city: z.string().optional(),

      state: z.string().optional(),

      country: z.string().optional(),

      pincode: z.string().optional(),
    })
    .optional(),

  tax: z
    .object({
      gstNumber: z.string().optional(),

      vatNumber: z.string().optional(),

      taxEnabled: z.boolean().optional(),

      taxRate: z.number().min(0).optional(),
    })
    .optional(),

  shipping: z
    .object({
      enabled: z.boolean().optional(),

      defaultCharge: z.number().min(0).optional(),

      freeShipping: z.boolean().optional(),

      freeShippingAmount: z.number().min(0).optional(),

      estimatedDeliveryDays: z.number().min(1).optional(),
    })
    .optional(),

  currency: z
    .object({
      code: z.string().optional(),

      symbol: z.string().optional(),
    })
    .optional(),

  timezone: z.string().optional(),

  socialLinks: z
    .object({
      facebook: z.string().optional(),

      instagram: z.string().optional(),

      twitter: z.string().optional(),

      linkedin: z.string().optional(),

      youtube: z.string().optional(),
    })
    .optional(),

  business: z
    .object({
      businessName: z.string().optional(),

      supportEmail: z.string().email().optional(),

      supportPhone: z.string().optional(),
    })
    .optional(),

  seo: z
    .object({
      metaTitle: z.string().optional(),

      metaDescription: z.string().optional(),

      metaKeywords: z.string().optional(),

      ogImage: z.string().optional(),
    })
    .optional(),

  maintenance: z
    .object({
      enabled: z.boolean().optional(),

      message: z.string().optional(),
    })
    .optional(),

  invoice: z
    .object({
      prefix: z.string().optional(),

      footer: z.string().optional(),

      signature: z.string().optional(),

      stamp: z.string().optional(),
    })
    .optional(),

  returns: z
    .object({
      returnDays: z.number().min(0).optional(),

      replacementDays: z.number().min(0).optional(),
    })
    .optional(),

  acceptOrders: z.boolean().optional(),
});