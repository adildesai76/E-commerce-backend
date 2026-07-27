import {
  removeImageBackgroundAI,
} from "../../../services/ai/imageAI.service.js";

export const removeImageBackground = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const result = await removeImageBackgroundAI({
      imageBuffer: req.file.buffer,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Remove Image Background Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove image background",
    });
  }
};