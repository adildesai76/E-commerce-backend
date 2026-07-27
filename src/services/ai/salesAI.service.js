import generateAIResponse from "./ai.service.js";

export const generateSalesInsightsAI = async ({
  analyticsData,
}) => {
  const systemPrompt = `
You are an expert e-commerce business analyst.

Analyze the provided sales data and generate actionable business insights.

Focus on:
- Revenue trends
- Order trends
- Growth opportunities
- Potential problems

Do not change or recalculate the provided numbers.

Return a clear plain-text business analysis.
`;

  const userPrompt = `
Analyze the following sales analytics data:

${JSON.stringify(analyticsData, null, 2)}

Generate clear and actionable business insights.
`;

  return generateAIResponse({
    systemPrompt,
    userPrompt,
  });
};