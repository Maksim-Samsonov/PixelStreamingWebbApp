"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export function useVoiceRecognition() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Автоматически выбираем устройства по умолчанию при загрузке
  useEffect(() => {
    const setupDefaultDevices = async () => {
      try {
        // Сначала запрашиваем разрешения
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Останавливаем поток после получения разрешений
        stream.getTracks().forEach((track) => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        console.log("Available devices:", devices)

        // Выбираем первый доступный микрофон как устройство по умолчанию
        const defaultMic = devices.find((device) => device.kind === "audioinput" && device.deviceId !== "default")
        if (defaultMic) {
          setSelectedMicrophone(defaultMic.deviceId)
          console.log("Auto-selected microphone:", defaultMic.label || defaultMic.deviceId)
        }

        // Выбираем первый доступный динамик как устройство по умолчанию
        const defaultSpeaker = devices.find((device) => device.kind === "audiooutput" && device.deviceId !== "default")
        if (defaultSpeaker) {
          setSelectedSpeaker(defaultSpeaker.deviceId)
          console.log("Auto-selected speaker:", defaultSpeaker.label || defaultSpeaker.deviceId)
        }
      } catch (error) {
        console.error("Error setting up default devices:", error)
      }
    }

    setupDefaultDevices()
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript("")

      console.log("Starting recording with microphone:", selectedMicrophone)

      // Запрашиваем доступ к микрофону с выбранным устройством
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Проверяем поддержку MediaRecorder
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        throw new Error("Audio recording format not supported")
      }

      // Создаем MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log("Audio data available, size:", event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, processing audio...")
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        })

        console.log("Audio blob created, size:", audioBlob.size)

        // Отправляем на Whisper API для транскрипции
        await transcribeAudio(audioBlob)

        // Очищаем ресурсы
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        setError("Recording error occurred")
        setIsRecording(false)
      }

      mediaRecorder.start(1000) // Записываем чанками по 1 секунде
      setIsRecording(true)

      console.log("Recording started successfully")
    } catch (error) {
      console.error("Error starting recording:", error)
      setError("Failed to start recording. Please check microphone permissions.")
      setIsRecording(false)
    }
  }, [selectedMicrophone])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording...")
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true)
      console.log("Starting transcription with Whisper...")

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
        setTranscript(result.transcript)
        console.log("Transcription successful:", result.transcript)
      } else {
        throw new Error("No transcript received")
      }
    } catch (error) {
      console.error("Transcription error:", error)
      setError("Transcription failed. Please try again.")
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript("")
    setError(null)
  }, [])

  const updateMicrophone = useCallback((deviceId: string) => {
    setSelectedMicrophone(deviceId)
    console.log("Microphone updated:", deviceId)
  }, [])

  const updateSpeaker = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId)
    console.log("Speaker updated:", deviceId)
  }, [])

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
  }
}
