"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  id: string
}

interface ChatHistoryProps {
  messages: Message[]
  isLoading?: boolean
  transcript?: string
  isDark: boolean
}

export function ChatHistory({ messages, isLoading, transcript, isDark }: ChatHistoryProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, transcript])

  return (
    <ScrollArea className="flex-1 h-full min-h-0" ref={scrollAreaRef}>
      <div className={`p-4 min-h-full ${isDark ? "bg-black" : "bg-white"}`}>
        <div className="space-y-2 sm:space-y-4">
          {messages.length === 0 ? (
            <div className={`text-center mt-4 sm:mt-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <p className="text-sm sm:text-base">Start a conversation with Ann</p>
              <p className="text-xs sm:text-sm">You can type or use voice input</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                    <AvatarImage src="/images/therapist.png" />
                    <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                      A
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 break-words ${
                    message.role === "user"
                      ? "bg-[#5137d2] text-white"
                      : isDark
                        ? "bg-gray-800 text-gray-100"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {message.timestamp && (
                    <p className="text-xs opacity-70 mt-1 hidden sm:block">{message.timestamp.toLocaleTimeString()}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                    <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                      U
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {transcript && (
            <div className="flex gap-2 sm:gap-3 justify-end opacity-70">
              <div className="max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 bg-[#5137d2] text-white border-2 border-[#5137d2]/50 break-words">
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{transcript}</p>
                <p className="text-xs opacity-70 mt-1">Speaking...</p>
              </div>
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                  U
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                <AvatarImage src="/images/therapist.png" />
                <AvatarFallback className={isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}>
                  A
                </AvatarFallback>
              </Avatar>
              <div className={`rounded-lg p-2 sm:p-3 ${isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
