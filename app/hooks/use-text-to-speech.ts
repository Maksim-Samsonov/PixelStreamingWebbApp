"use client"

import { useState, useRef, useCallback } from "react"

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("")

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(
    async (text: string, language = "en") => {
      if (!text.trim()) return

      try {
        setError(null)
        setIsGenerating(true)

        console.log("Generating speech for:", text.substring(0, 50) + "...")

        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, language }),
        })

        console.log("TTS API response status:", response.status)
        console.log("TTS API response headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        // Check if response is actually audio
        const contentType = response.headers.get("content-type")
        console.log("Response content type:", contentType)

        if (!contentType || !contentType.includes("audio")) {
          throw new Error("Invalid response format - expected audio")
        }

        const audioBlob = await response.blob()
        console.log("Audio blob received:", {
          size: audioBlob.size,
          type: audioBlob.type,
        })

        // Verify blob is not empty
        if (audioBlob.size === 0) {
          throw new Error("Received empty audio data")
        }

        // Stop generating status when audio is ready
        setIsGenerating(false)

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.removeAttribute("src")
          audioRef.current.load()
        }

        // Create audio URL
        const audioUrl = URL.createObjectURL(audioBlob)
        console.log("Audio URL created successfully")

        // Create new audio element
        const audio = new Audio()
        audioRef.current = audio

        // Set up promise-based loading
        const loadAudio = new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            audio.removeEventListener("canplaythrough", onCanPlay)
            audio.removeEventListener("error", onError)
            audio.removeEventListener("loadstart", onLoadStart)
          }

          const onCanPlay = () => {
            console.log("Audio can play through")
            cleanup()
            resolve()
          }

          const onError = (event: Event) => {
            console.error("Audio loading error:", {
              error: event,
              audioError: audio.error,
              networkState: audio.networkState,
              readyState: audio.readyState,
              src: audio.src,
            })
            cleanup()
            reject(new Error("Failed to load audio"))
          }

          const onLoadStart = () => {
            console.log("Audio loading started")
          }

          audio.addEventListener("canplaythrough", onCanPlay)
          audio.addEventListener("error", onError)
          audio.addEventListener("loadstart", onLoadStart)

          // Set audio properties
          audio.preload = "auto"
          audio.crossOrigin = "anonymous"

          // Set audio output device if supported
          if (selectedSpeaker && (audio as any).setSinkId) {
            ;(audio as any)
              .setSinkId(selectedSpeaker)
              .then(() => {
                console.log("Audio output device set:", selectedSpeaker)
              })
              .catch((err: any) => {
                console.warn("Failed to set audio output device:", err)
              })
          }

          // Set source and load
          audio.src = audioUrl
          audio.load()
        })

        // Set up playback event listeners
        audio.onended = () => {
          console.log("Audio playback ended")
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }

        audio.onplay = () => {
          console.log("Audio playback started")
          setIsPlaying(true)
        }

        audio.onpause = () => {
          console.log("Audio playback paused")
          setIsPlaying(false)
        }

        // Wait for audio to load, then play
        await loadAudio
        await audio.play()

        console.log("Speech playback initiated successfully")
      } catch (error) {
        console.error("Text-to-speech error:", error)
        setError(error instanceof Error ? error.message : "Failed to generate speech")
        setIsGenerating(false)
        setIsPlaying(false)
      }
    },
    [selectedSpeaker],
  )

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const updateSpeaker = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId)
  }, [])

  return {
    speak,
    stop,
    isPlaying,
    isGenerating,
    error,
    updateSpeaker,
    selectedSpeaker,
  }
}
