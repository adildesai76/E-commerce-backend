import { generateProductDescriptionAI } from "../../../services/ai/productAI.service.js";

export const generateProductDescription = async (req, res) => {
  try {
    const {
      productName,
      category,
      brand = "",
      features = [],
      tone = "professional",
      length = "medium",
    } = req.body;

    if (!productName || !category) {
      return res.status(400).json({
        success: false,
        message: "Product name and category are required",
      });
    }

    const description = await generateProductDescriptionAI({
      productName,
      category,
      brand,
      features,
      tone,
      length,
    });

    return res.status(200).json({
      success: true,
      data: {
        description,
      },
    });
  } catch (error) {
    console.error("Generate Product Description Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate product description",
    });
  }
};
