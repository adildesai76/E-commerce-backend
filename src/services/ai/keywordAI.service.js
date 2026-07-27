import generateAIResponse from "./ai.service.js";

export const generateKeywordsAI = async ({
  productName,
  category,
  brand = "",
  description = "",
  count = 20,
}) => {
  const systemPrompt = `
You are an e-commerce SEO keyword research expert.

Generate relevant keywords for the product.

Return the result in this structure:

{
  "primary": [],
  "secondary": [],
  "longTail": [],
  "tags": []
}

Rules:
- Do not invent product features.
- Keywords must be relevant to the provided product.
- Avoid irrelevant keywords.
`;

  const userPrompt = `
Product Name: ${productName}
Category: ${category}
Brand: ${brand}
Description: ${description}
Maximum Keywords: ${count}
`;

  return generateAIResponse({
    systemPrompt,
    userPrompt,
  });
};