import generateAIResponse from "./ai.service.js";

export const generateSEOTitlesAI = async ({
  productName,
  category,
  brand = "",
  features = [],
  count = 5,
}) => {
  const systemPrompt = `
You are an SEO expert specializing in e-commerce product listings.

Generate SEO-friendly product titles.

Rules:
- Do not use misleading information.
- Do not invent specifications.
- Keep titles natural and readable.
- Avoid keyword stuffing.
- Return exactly the requested number of titles.
`;

  const userPrompt = `
Product Name: ${productName}
Category: ${category}
Brand: ${brand}
Features: ${features.join(", ")}
Number of Titles: ${count}

Generate ${count} SEO-friendly product titles.
`;

  return generateAIResponse({
    systemPrompt,
    userPrompt,
  });
};