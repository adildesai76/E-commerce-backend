import generateAIResponse from "./ai.service.js";

export const generateProductDescriptionAI = async ({
  productName,
  category,
  brand = "",
  features = [],
  tone = "professional",
  length = "medium",
}) => {
  const systemPrompt = `
You are an expert e-commerce product copywriter.

Generate a high-quality product description for an online store.

Rules:
- Do not invent product specifications.
- Only use the information provided.
- Make the content clear and engaging.
- Use the requested tone and length.
`;

  const userPrompt = `
Product Name: ${productName}
Category: ${category}
Brand: ${brand}
Features: ${features.join(", ")}
Tone: ${tone}
Length: ${length}

Generate a product description.
`;

  return generateAIResponse({
    systemPrompt,
    userPrompt,
  });
};