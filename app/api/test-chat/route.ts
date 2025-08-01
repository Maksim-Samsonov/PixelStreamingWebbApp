import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    console.log("Test chat API called with message:", message)

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are Ann, a therapist. Respond to this message: ${message}`,
      maxTokens: 200,
    })

    console.log("Generated response:", result.text)

    return Response.json({
      success: true,
      response: result.text,
    })
  } catch (error) {
    console.error("Test chat error:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
