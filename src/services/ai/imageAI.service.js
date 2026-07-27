import {
  removeBackgroundFromImageBase64,
} from "remove.bg";

import cloudinary from "../../config/cloudinary.js";

export const removeImageBackgroundAI = async ({
  imageBuffer,
}) => {
  try {
    if (!imageBuffer) {
      throw new Error("Image buffer is required");
    }

    const result = await removeBackgroundFromImageBase64({
      base64img: imageBuffer.toString("base64"),
      apiKey: process.env.REMOVE_BG_API_KEY,
      size: "auto",
      type: "product",
      format: "png",
    });

    const processedImageBuffer = Buffer.from(
      result.base64img,
      "base64",
    );

    const uploadResult = await new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "ai/background-removed",
              resource_type: "image",
            },
            (error, cloudinaryResult) => {
              if (error) {
                reject(error);
              } else {
                resolve(cloudinaryResult);
              }
            },
          );

        uploadStream.end(processedImageBuffer);
      },
    );

    return {
      imageUrl: uploadResult.secure_url,
    //   publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error(
      "Image AI Service Error:",
      error,
    );

    throw new Error(
      error?.message ||
        "Failed to remove image background",
    );
  }
};