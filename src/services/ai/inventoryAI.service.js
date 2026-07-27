import generateAIResponse from "./ai.service.js";

export const generateInventoryForecastAI = async ({
  product,
  salesHistory,
  forecastDays,
}) => {
  const systemPrompt = `
You are an expert e-commerce inventory forecasting analyst.

Analyze the product's current stock and historical sales data.

Provide:
- Average daily sales
- Estimated days until stockout
- Demand level: Low, Medium, or High
- Stockout risk
- Recommended reorder quantity
- Clear inventory recommendation

Do not invent sales data.
Use only the provided information.

Return a clear, structured business analysis in plain text.
`;

  const userPrompt = `
Analyze this inventory data:

Product:
${JSON.stringify(product, null, 2)}

Historical Sales:
${JSON.stringify(salesHistory, null, 2)}

Forecast Period:
${forecastDays} days

Generate an inventory forecast and actionable recommendation.
`;

  return generateAIResponse({
    systemPrompt,
    userPrompt,
    maxTokens: 1200,
  });
};
