// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const generateAIResponse = async ({
//   systemPrompt,
//   userPrompt,
//   temperature = 0.7,
//   maxTokens = 1000,
// }) => {
//   try {
//     const response = await openai.responses.create({
//       // model: "gpt-4o-mini",
//       model: "gpt-5.4-mini",
//       instructions: systemPrompt,
//       input: userPrompt,
//       temperature,
//       max_output_tokens: maxTokens,
//     });

//     return response.output_text;
//   } catch (error) {
//     console.error("AI Service Error:", error);

//     throw new Error(
//       error?.message || "Failed to generate AI response",
//     );
//   }
// };

// export default generateAIResponse;
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async ({
  systemPrompt,
  userPrompt,
  maxTokens = 1000,
}) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_completion_tokens: maxTokens,
    });

    const output =
      response?.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error("AI returned an empty response");
    }

    return output;
  } catch (error) {
    console.error("AI Service Error:", error);

    throw new Error(
      error?.message || "Failed to generate AI response",
    );
  }
};

export default generateAIResponse;