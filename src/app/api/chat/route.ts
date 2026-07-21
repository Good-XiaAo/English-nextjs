import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.BASE_URL,
});

export async function POST(req: Request) {
  const { messages, system } = await req.json();

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    system,
    messages,
  });

  // The chat page reads response.body as plain UTF-8 text, so expose the
  // model's text stream instead of the AI SDK's structured UI/data stream.
  return result.toTextStreamResponse();
}
