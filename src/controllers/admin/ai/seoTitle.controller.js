import {
  generateSEOTitlesAI,
} from "../../../services/ai/seoAI.service.js";

export const generateSEOTitles = async (req, res) => {
  try {
    const {
      productName,
      category,
      brand = "",
      features = [],
      count = 5,
    } = req.body;

    if (!productName || !category) {
      return res.status(400).json({
        success: false,
        message: "Product name and category are required",
      });
    }

    const titles = await generateSEOTitlesAI({
      productName,
      category,
      brand,
      features,
      count,
    });

    return res.status(200).json({
      success: true,
      data: {
        titles,
      },
    });
  } catch (error) {
    console.error("Generate SEO Titles Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate SEO titles",
    });
  }
};