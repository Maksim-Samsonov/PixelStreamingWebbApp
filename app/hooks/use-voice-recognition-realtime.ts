"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export function useVoiceRecognitionRealtime() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const onTranscriptReadyRef = useRef<((text: string) => void) | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const setupDefaultDevices = async () => {
      try {
        // Сначала запрашиваем разрешения
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Останавливаем поток после получения разрешений
        stream.getTracks().forEach((track) => track.stop())

        // Теперь получаем список устройств с метками
        const devices = await navigator.mediaDevices.enumerateDevices()

        console.log("Available devices:", devices)

        // Выбираем первый доступный микрофон (не default)
        const availableMics = devices.filter(
          (device) =>
            device.kind === "audioinput" && device.deviceId !== "default" && device.deviceId !== "communications",
        )

        const availableSpeakers = devices.filter(
          (device) =>
            device.kind === "audiooutput" && device.deviceId !== "default" && device.deviceId !== "communications",
        )

        console.log("Available microphones:", availableMics)
        console.log("Available speakers:", availableSpeakers)

        // Устанавливаем микрофон по умолчанию
        if (availableMics.length > 0) {
          const defaultMic = availableMics[0]
          setSelectedMicrophone(defaultMic.deviceId)
          console.log("Selected default microphone:", defaultMic.label || defaultMic.deviceId)
        } else {
          // Если нет других устройств, используем default
          setSelectedMicrophone("default")
          console.log("Using default microphone")
        }

        // Устанавливаем динамик по умолчанию
        if (availableSpeakers.length > 0) {
          const defaultSpeaker = availableSpeakers[0]
          setSelectedSpeaker(defaultSpeaker.deviceId)
          console.log("Selected default speaker:", defaultSpeaker.label || defaultSpeaker.deviceId)
        } else {
          // Если нет других устройств, используем default
          setSelectedSpeaker("default")
          console.log("Using default speaker")
        }
      } catch (error) {
        console.error("Error setting up default devices:", error)
        // Fallback к default устройствам
        setSelectedMicrophone("default")
        setSelectedSpeaker("default")
      }
    }

    setupDefaultDevices()
  }, [])

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true)
      console.log("Starting Whisper transcription...")

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || "Transcription failed")
      }

      if (result.success && result.transcript) {
        const transcriptText = result.transcript.trim()
        console.log("Whisper transcription successful:", transcriptText)

        if (transcriptText && onTranscriptReadyRef.current) {
          onTranscriptReadyRef.current(transcriptText)
        }

        setTranscript(transcriptText)

        // Clear transcript after a short delay
        setTimeout(() => {
          setTranscript("")
        }, 2000)
      } else {
        throw new Error("No transcript received")
      }
    } catch (error) {
      console.error("Whisper transcription error:", error)
      setError("Transcription failed. Please try again.")
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const startRecording = useCallback(
    async (onTranscriptReady?: (text: string) => void) => {
      try {
        setError(null)
        setTranscript("")
        onTranscriptReadyRef.current = onTranscriptReady || null

        console.log("Starting recording with microphone:", selectedMicrophone)

        // Определяем constraints для микрофона
        const audioConstraints =
          selectedMicrophone && selectedMicrophone !== "default"
            ? {
                deviceId: { exact: selectedMicrophone },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1,
              }

        const constraints: MediaStreamConstraints = {
          audio: audioConstraints,
        }

        console.log("Using audio constraints:", constraints)

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        console.log("Stream obtained successfully")

        // Проверяем поддержку форматов
        const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]

        let mimeType = "audio/webm"
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type
            break
          }
        }

        console.log("Using MIME type:", mimeType)

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
        })

        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          console.log("Data available, size:", event.data.size)
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          console.log("Recording stopped, processing audio...")
          console.log("Audio chunks collected:", audioChunksRef.current.length)

          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mimeType,
            })

            console.log("Audio blob created, size:", audioBlob.size, "bytes")

            if (audioBlob.size > 0) {
              await transcribeAudio(audioBlob)
            } else {
              console.warn("Audio blob is empty")
              setError("Recording is empty. Please try again.")
            }
          } else {
            console.warn("No audio chunks collected")
            setError("No audio data recorded. Please try again.")
          }

          // Очищаем поток
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              console.log("Stopping track:", track.kind, track.label)
              track.stop()
            })
            streamRef.current = null
          }
        }

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event)
          setError("Recording error occurred")
          setIsRecording(false)
        }

        mediaRecorder.onstart = () => {
          console.log("MediaRecorder started successfully")
        }

        // Начинаем запись
        mediaRecorder.start(1000) // Записываем чанками по 1 секунде
        setIsRecording(true)

        console.log("Recording started successfully")

        // Автоматическая остановка через 10 секунд
        recordingIntervalRef.current = setTimeout(() => {
          console.log("Auto-stopping recording after 10 seconds")
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            stopRecording()
          }
        }, 10000)
      } catch (error) {
        console.error("Error starting recording:", error)
        setError(`Failed to start recording: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsRecording(false)
      }
    },
    [selectedMicrophone, transcribeAudio],
  )

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping Whisper recording...")
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    if (recordingIntervalRef.current) {
      clearTimeout(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [isRecording])

  const clearTranscript = useCallback(() => {
    setTranscript("")
    setError(null)
  }, [])

  const updateMicrophone = useCallback((deviceId: string) => {
    setSelectedMicrophone(deviceId)
  }, [])

  const updateSpeaker = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId)
  }, [])

  const updateLanguage = useCallback((language: string) => {
    setSelectedLanguage(language)
  }, [])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearTimeout(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  return {
    isRecording,
    transcript,
    isTranscribing,
    error,
    selectedMicrophone,
    selectedSpeaker,
    startRecording,
    stopRecording,
    clearTranscript,
    updateMicrophone,
    updateSpeaker,
    updateLanguage,
  }
}
