export async function POST(req: Request) {
  try {
    const { text, language = "en" } = await req.json()

    console.log("TTS API called with:", { textLength: text?.length, language })

    if (!text || typeof text !== "string") {
      console.error("Invalid text provided:", text)
      return Response.json({ error: "Valid text is required" }, { status: 400 })
    }

    if (text.trim().length === 0) {
      console.error("Empty text provided")
      return Response.json({ error: "Text cannot be empty" }, { status: 400 })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("ElevenLabs API key not configured")
      return Response.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "aCChyB4P5WEomwRsOKRh"
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"

    console.log("Using ElevenLabs config:", {
      voiceId,
      modelId,
      textPreview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
    })

    const requestBody = {
      text: text.trim(),
      model_id: modelId,
      voice_settings: {
        stability: Number.parseFloat(process.env.ELEVENLABS_VOICE_STABILITY || "0.5"),
        similarity_boost: Number.parseFloat(process.env.ELEVENLABS_VOICE_SIMILARITY || "0.8"),
        style: Number.parseFloat(process.env.ELEVENLABS_VOICE_STYLE || "0.0"),
        use_speaker_boost: process.env.ELEVENLABS_VOICE_USE_SPEAKER_BOOST === "true",
      },
    }

    console.log("ElevenLabs request body:", JSON.stringify(requestBody, null, 2))

    const elevenlabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    })

    console.log("ElevenLabs response:", {
      status: elevenlabsResponse.status,
      statusText: elevenlabsResponse.statusText,
      headers: Object.fromEntries(elevenlabsResponse.headers.entries()),
    })

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text()
      console.error("ElevenLabs API error:", {
        status: elevenlabsResponse.status,
        statusText: elevenlabsResponse.statusText,
        body: errorText,
      })

      let errorMessage = "Failed to generate speech"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail?.message || errorData.message || errorMessage
      } catch {
        errorMessage = `ElevenLabs API error: ${elevenlabsResponse.status} ${elevenlabsResponse.statusText}`
      }

      return Response.json({ error: errorMessage }, { status: elevenlabsResponse.status })
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer()
    console.log("Audio buffer received:", {
      size: audioBuffer.byteLength,
      sizeKB: Math.round(audioBuffer.byteLength / 1024),
    })

    if (audioBuffer.byteLength === 0) {
      console.error("Received empty audio buffer from ElevenLabs")
      return Response.json({ error: "Received empty audio data from ElevenLabs" }, { status: 500 })
    }

    // Verify it's actually audio data by checking the first few bytes
    const audioView = new Uint8Array(audioBuffer.slice(0, 4))
    const isValidMP3 = audioView[0] === 0xff && (audioView[1] & 0xe0) === 0xe0 // MP3 header
    const isValidMP4 = audioView[0] === 0x00 && audioView[1] === 0x00 // MP4 header start

    console.log("Audio format validation:", {
      firstBytes: Array.from(audioView).map((b) => "0x" + b.toString(16).padStart(2, "0")),
      isValidMP3,
      isValidMP4,
    })

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("TTS API internal error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
