import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

const languagePrompts = {
  "ru-RU": "Отвечай на русском языке.",
  "en-US": "Respond in English.",
  "es-ES": "Responde en español.",
  "fr-FR": "Répondez en français.",
  "de-DE": "Antworte auf Deutsch.",
  "it-IT": "Rispondi in italiano.",
  "pt-PT": "Responda em português.",
  "nl-NL": "Antwoord in het Nederlands.",
  "ar-SA": "أجب باللغة العربية.",
}

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4o", language = "ru-RU" } = await req.json()

    const languageInstruction = languagePrompts[language as keyof typeof languagePrompts] || languagePrompts["ru-RU"]

    const systemPrompt = `You are Ann, a professional and empathetic therapist. You provide emotional support and guidance to users who need someone to talk to. 

Key characteristics:
- Warm, understanding, and non-judgmental
- Ask thoughtful follow-up questions
- Provide practical coping strategies when appropriate
- Maintain professional boundaries
- Show genuine care and empathy
- Keep responses conversational and supportive

${languageInstruction}

Remember: You are not providing medical advice, but emotional support and active listening.`

    const result = await streamText({
      model: openai(model),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = {
              type: "text-delta",
              textDelta: chunk,
            }

            const formattedChunk = `0:${JSON.stringify(data)}\n`
            controller.enqueue(encoder.encode(formattedChunk))
          }

          const finalData = {
            type: "finish",
            finishReason: "stop",
          }
          const finalChunk = `0:${JSON.stringify(finalData)}\n`
          controller.enqueue(encoder.encode(finalChunk))

          controller.close()
        } catch (error) {
          console.error("Streaming error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    return new Response(JSON.stringify({ error: "Error processing request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
