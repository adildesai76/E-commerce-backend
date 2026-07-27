import {
  generateKeywordsAI,
} from "../../../services/ai/keywordAI.service.js";

export const generateKeywords = async (req, res) => {
  try {
    const {
      productName,
      category,
      brand = "",
      description = "",
      count = 20,
    } = req.body;

    if (!productName || !category) {
      return res.status(400).json({
        success: false,
        message: "Product name and category are required",
      });
    }

    const keywords = await generateKeywordsAI({
      productName,
      category,
      brand,
      description,
      count,
    });

    return res.status(200).json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    console.error("Generate Keywords Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate keywords",
    });
  }
};