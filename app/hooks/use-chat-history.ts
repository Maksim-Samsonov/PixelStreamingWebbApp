"use client"

import { useState, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  id: string
}

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [selectedLanguage, setSelectedLanguage] = useState("en-US")
  const [onMessageComplete, setOnMessageComplete] = useState<((message: string) => void) | null>(null)

  const addMessage = useCallback((message: Omit<Message, "timestamp" | "id">) => {
    const newMessage: Message = {
      ...message,
      timestamp: new Date(),
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setError(null)
      setIsLoading(true)

      const userMessage = addMessage({ role: "user", content })

      try {
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
            language: selectedLanguage,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No response body")
        }

        let assistantContent = ""
        const assistantMessage = addMessage({ role: "assistant", content: "" })
        let hasTriggeredTTS = false

        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)

                if (data.type === "text-delta" && data.textDelta) {
                  assistantContent += data.textDelta
                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg)),
                  )

                  // Trigger TTS when we have enough content (about 2-3 sentences)
                  if (!hasTriggeredTTS && assistantContent.length > 100 && onMessageComplete) {
                    hasTriggeredTTS = true
                    onMessageComplete(assistantContent.trim())
                  }
                } else if (data.type === "finish") {
                  // If TTS wasn't triggered yet, trigger it now with the complete message
                  if (!hasTriggeredTTS && onMessageComplete && assistantContent.trim()) {
                    onMessageComplete(assistantContent.trim())
                  }
                  break
                }
              } catch (e) {
                console.warn("Failed to parse chunk:", line)
              }
            }
          }
        }
      } catch (err) {
        console.error("Chat error:", err)
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
        setMessages((prev) => prev.filter((msg) => !(msg.role === "assistant" && msg.content === "")))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, selectedModel, selectedLanguage, isLoading, addMessage, onMessageComplete],
  )

  const clearHistory = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const updateModel = useCallback((model: string) => {
    setSelectedModel(model)
  }, [])

  const updateLanguage = useCallback((language: string) => {
    setSelectedLanguage(language)
  }, [])

  const setMessageCompleteCallback = useCallback((callback: ((message: string) => void) | null) => {
    setOnMessageComplete(() => callback)
  }, [])

  return {
    messages,
    addMessage,
    sendMessage,
    clearHistory,
    isLoading,
    error,
    updateModel,
    updateLanguage,
    selectedModel,
    selectedLanguage,
    setMessageCompleteCallback,
  }
}
