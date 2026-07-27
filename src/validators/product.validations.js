// import { z } from "zod";

// export const productSchema = z.object({
//   name: z.string().min(3),

//   category: z.string().min(1),

//   description: z.string().min(10),

//   brand: z.string().optional(),

//   price: z.coerce.number().positive(),

//   discountPrice: z.coerce.number().optional(),

//   stock: z.coerce.number().min(0),

//   sku: z.string().optional(),

//   featured: z.preprocess((value) => {
//     if (value === "true") return true;
//     if (value === "false") return false;
//     return value;
//   }, z.boolean()),

//   status: z.enum(["active", "draft", "out_of_stock"]),
// });

// backend/schemas/product.schema.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3),

  category: z.string().min(1),

  description: z.string().min(10),

  brand: z.string().optional(),

  // z.coerce.number() gracefully coerces "500" -> 500
  price: z.coerce.number().positive(),

  discountPrice: z.coerce.number().optional(),

  stock: z.coerce.number().min(0),

  sku: z.string().optional(),

  // Robust boolean handling for both JSON booleans and FormData strings
  featured: z
    .preprocess((value) => {
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return value;
    }, z.boolean())
    .default(false),

  status: z.enum(["active", "draft", "out_of_stock"]),
});

// Partial schema for updates (handles both JSON toggles and full updates)
export const updateProductSchema = productSchema.partial();
