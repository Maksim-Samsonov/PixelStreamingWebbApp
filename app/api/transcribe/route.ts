export async function POST(req: Request) {
  try {
    console.log("Transcribe API called")

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      console.error("No audio file provided")
      return Response.json({ success: false, error: "No audio file provided" }, { status: 400 })
    }

    console.log("Audio file received:", audioFile.name, audioFile.size, "bytes")

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables")
      return Response.json({ success: false, error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("API Key found, length:", process.env.OPENAI_API_KEY.length)

    // Convert File to the format expected by OpenAI
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = new Uint8Array(arrayBuffer)

    // Create a new File object with proper MIME type
    const audioFileForAPI = new File([audioBuffer], "audio.webm", {
      type: "audio/webm",
    })

    console.log("Sending request to OpenAI Whisper API...")

    // Use OpenAI's Whisper API for transcription
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: (() => {
        const formData = new FormData()
        formData.append("file", audioFileForAPI)
        formData.append("model", "whisper-1")
        formData.append("response_format", "json")
        return formData
      })(),
    })

    console.log("OpenAI response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Whisper API error:", errorData)

      // Return the specific error information
      return Response.json(
        {
          success: false,
          error: errorData.error || { message: "Transcription failed", code: "api_error" },
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("Transcription successful:", result.text)

    return Response.json({
      success: true,
      transcript: result.text,
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return Response.json(
      {
        success: false,
        error: { message: "Internal server error", code: "internal_error" },
      },
      { status: 500 },
    )
  }
}
