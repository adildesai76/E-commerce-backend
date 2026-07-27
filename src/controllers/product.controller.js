import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import { productSchema, updateProductSchema } from "../validators/product.validations.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body);

    const imageUrls =
      req.files?.map((file) => file.path || file.secure_url) || [];

    const product = await Product.create({
      ...validatedData,
      images: imageUrls,
      status: validatedData.stock === 0 ? "out_of_stock" : validatedData.status,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      //   product,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        errors: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getallProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category, status } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      featured,
      status,
    } = req.query;

    const query = {};

    // If status is provided (admin), use it.
    // Otherwise default to active products.
    query.status = status || "active";

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Featured filter
    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber < Math.ceil(total / limitNumber),
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product ids are required.",
      });
    }

    const products = await Product.find({
      _id: { $in: ids },
      status: "active",
    });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     console.log(req.body.featured);
//     console.log(typeof req.body.featured);
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     const validatedData = productSchema.parse(req.body);

//     let existingImages = [];

//     if (req.body.images) {
//       try {
//         const parsed = JSON.parse(req.body.images);
//         existingImages = Array.isArray(parsed) ? parsed : [];
//       } catch {
//         existingImages = [];
//       }
//     }

//     const newImages = (req.files || []).map((f) => f.path);

//     const finalImages = [...existingImages, ...newImages];

//     const removedImages = product.images.filter(
//       (oldImg) => !finalImages.includes(oldImg),
//     );

//     for (const url of removedImages) {
//       try {
//         const publicId = url.split("/").slice(-1)[0].split(".")[0];

//         await cloudinary.uploader.destroy(`products/${publicId}`);
//       } catch (err) {
//         console.log("Cloudinary delete failed:", err.message);
//       }
//     }

//     const updated = await Product.findByIdAndUpdate(
//       req.params.id,
//       {
//         ...validatedData,
//         images: finalImages,
//         status:
//           validatedData.stock === 0 ? "out_of_stock" : validatedData.status,
//       },
//       { new: true },
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       product: updated,
//     });
//   } catch (error) {
//     console.log(error);

//     if (error.name === "ZodError") {
//       return res.status(400).json({
//         success: false,
//         errors: error.issues,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const deleteProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     if (product.images?.length) {
//       for (const url of product.images) {
//         try {
//           const publicId = url.split("/").slice(-1)[0].split(".")[0];

//           await cloudinary.uploader.destroy(`products/${publicId}`);
//         } catch (err) {
//           console.log("Cloud delete failed:", err.message);
//         }
//       }
//     }

//     await Product.findByIdAndDelete(id);

//     return res.status(200).json({
//       success: true,
//       message: "Product deleted successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// backend/controllers/product.controller.js

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ⚡ Validate using the partial schema so missing fields are allowed!
    const validatedData = updateProductSchema.parse(req.body);

    let finalImages = product.images;

    // Only process image changes if 'images' field or new files exist in req
    const isImageUpdate =
      req.body.images !== undefined || (req.files && req.files.length > 0);

    if (isImageUpdate) {
      let existingImages = [];

      if (req.body.images) {
        try {
          const parsed = JSON.parse(req.body.images);
          existingImages = Array.isArray(parsed) ? parsed : [];
        } catch {
          existingImages = [];
        }
      }

      const newImages = (req.files || []).map((f) => f.path);
      finalImages = [...existingImages, ...newImages];

      const removedImages = product.images.filter(
        (oldImg) => !finalImages.includes(oldImg)
      );

      for (const url of removedImages) {
        try {
          const publicId = url.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.log("Cloudinary delete failed:", err.message);
        }
      }
    }

    // Safe stock and status evaluation
    const stockValue =
      validatedData.stock !== undefined ? validatedData.stock : product.stock;
    const requestedStatus =
      validatedData.status !== undefined
        ? validatedData.status
        : product.status;
    const finalStatus = stockValue === 0 ? "out_of_stock" : requestedStatus;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...validatedData,
          images: finalImages,
          status: finalStatus,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.log(error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        errors: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const productId = new mongoose.Types.ObjectId(id);

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Remove product from all users' carts
    |--------------------------------------------------------------------------
    */

    const cartUpdateResult = await Cart.updateMany(
      {
        "items.productId": productId,
      },
      {
        $pull: {
          items: {
            productId: productId,
          },
        },
      },
    );

    /*
    |--------------------------------------------------------------------------
    | Remove product from all users' wishlists
    |--------------------------------------------------------------------------
    */

    const wishlistDeleteResult = await Wishlist.deleteMany({
      product: productId,
    });

    /*
    |--------------------------------------------------------------------------
    | Delete product images from Cloudinary
    |--------------------------------------------------------------------------
    */

    if (product.images?.length) {
      for (const url of product.images) {
        try {
          const publicId = url.split("/").slice(-1)[0].split(".")[0];

          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.log("Cloud delete failed:", err.message);
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Delete product
    |--------------------------------------------------------------------------
    */

    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully and removed from all carts and wishlists.",
      removedFromCarts: cartUpdateResult.modifiedCount,
      removedFromWishlists: wishlistDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).select("category status");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const products = await Product.aggregate([
      {
        $match: {
          _id: { $ne: product._id },
          category: product.category,
          status: "active",
        },
      },

      {
        $sample: {
          size: 8,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get Similar Products:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
