"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Settings, Share, Send, Loader2, AlertCircle, X, Volume2, VolumeX } from "lucide-react"
import { ChatHistory } from "./components/chat-history"
import { DeviceSettings } from "./components/device-settings"
import { StreamingVideo } from "./components/streaming-video"
import { VolumeControl } from "./components/volume-control"
import { LanguageSelector } from "./components/language-selector"
import { useVoiceRecognition } from "./hooks/use-voice-recognition"
import { useChatHistory } from "./hooks/use-chat-history"
import { useTheme } from "./hooks/use-theme"
import { useTextToSpeech } from "./hooks/use-text-to-speech"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TherapistChat() {
  const [isRecording, setIsRecording] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(false) // По умолчанию скрыт на мобильных
  const [message, setMessage] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(599) // 9:59 in seconds
  const [selectedAI, setSelectedAI] = useState("gpt-4o")
  const [selectedLanguage, setSelectedLanguage] = useState("en-US")
  const [ttsEnabled, setTtsEnabled] = useState(true)

  const { theme, resolvedTheme, changeTheme } = useTheme()
  const {
    messages,
    sendMessage,
    clearHistory,
    isLoading,
    error: chatError,
    updateModel,
    updateLanguage,
    setMessageCompleteCallback,
  } = useChatHistory()

  const {
    startRecording,
    stopRecording,
    transcript,
    isTranscribing,
    error: voiceError,
    selectedMicrophone,
    selectedSpeaker: voiceSpeaker,
    clearTranscript,
    updateMicrophone,
    updateSpeaker: updateVoiceSpeaker,
  } = useVoiceRecognition()

  const {
    speak,
    stop: stopTTS,
    isPlaying: isSpeaking,
    isGenerating: isGeneratingSpeech,
    error: ttsError,
    updateSpeaker: updateTTSSpeaker,
    selectedSpeaker: ttsSpeaker,
  } = useTextToSpeech()

  // Use the same speaker for both voice recognition and TTS
  const selectedSpeaker = voiceSpeaker || ttsSpeaker

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Set up TTS callback
  useEffect(() => {
    if (ttsEnabled) {
      setMessageCompleteCallback((message: string) => {
        const languageCode = selectedLanguage.split("-")[0] // Convert "en-US" to "en"
        speak(message, languageCode)
      })
    } else {
      setMessageCompleteCallback(null)
    }
  }, [ttsEnabled, selectedLanguage, speak, setMessageCompleteCallback])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleMicToggle = async () => {
    if (isRecording) {
      await stopRecording()
      setIsRecording(false)
    } else {
      await startRecording()
      setIsRecording(true)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    await sendMessage(message)
    setMessage("")
    clearTranscript()
  }

  // Auto-send transcript when it's ready
  useEffect(() => {
    if (transcript && !isTranscribing && transcript.trim()) {
      sendMessage(transcript)
      clearTranscript()
    }
  }, [transcript, isTranscribing, sendMessage, clearTranscript])

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    updateLanguage(language)
  }

  const handleSpeakerChange = (deviceId: string) => {
    updateVoiceSpeaker(deviceId)
    updateTTSSpeaker(deviceId)
  }

  const handleTTSToggle = (enabled: boolean) => {
    setTtsEnabled(enabled)
    if (!enabled && isSpeaking) {
      stopTTS()
    }
  }

  // Test TTS function with better error handling
  const testTTS = async () => {
    try {
      console.log("Testing TTS...")
      await speak("Hello! This is a test of the ElevenLabs text-to-speech system. Can you hear me clearly?", "en")
    } catch (error) {
      console.error("TTS test failed:", error)
      alert(`TTS test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Test API connectivity
  const testAPI = async () => {
    try {
      console.log("Testing API connectivity...")
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Test", language: "en" }),
      })

      const result = response.ok ? "API is working!" : `API error: ${response.status}`
      console.log("API test result:", result)
      alert(result)
    } catch (error) {
      console.error("API test failed:", error)
      alert(`API test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  useEffect(() => {
    updateModel(selectedAI)
  }, [selectedAI, updateModel])

  const isDark = resolvedTheme === "dark"

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`border-b px-6 py-4 flex items-center justify-between flex-shrink-0 ${
          isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div>
            <h1 className={`text-base sm:text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} truncate`}>
              Chat with Ann - Therapist
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
              Live streaming session with AI-powered support • Whisper + ElevenLabs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={handleLanguageChange} />

          <Select value={selectedAI} onValueChange={setSelectedAI}>
            <SelectTrigger
              className={`w-20 sm:w-32 text-xs sm:text-sm ${
                isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}>
              <SelectItem
                value="gpt-4o"
                className={`${isDark ? "text-white hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}`}
              >
                GPT-4o
              </SelectItem>
              <SelectItem
                value="gpt-4o-mini"
                className={`${isDark ? "text-white hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}`}
              >
                GPT-4o Mini
              </SelectItem>
              <SelectItem
                value="gpt-3.5-turbo"
                className={`${isDark ? "text-white hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}`}
              >
                GPT-3.5
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Test Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={testAPI}
            className={`${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""} hidden sm:flex`}
          >
            🔧 API
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={testTTS}
            disabled={isGeneratingSpeech || isSpeaking}
            className={`${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""} hidden sm:flex`}
          >
            🔊 TTS
          </Button>

          {/* Test Voice Input Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (isRecording) {
                await stopRecording()
                setIsRecording(false)
              } else {
                await startRecording()
                setIsRecording(true)
              }
            }}
            disabled={isTranscribing}
            className={`${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""} ${
              isRecording ? "bg-red-100 border-red-300" : ""
            } hidden sm:flex`}
          >
            {isRecording ? "🛑 Stop" : "🎤 Voice"}
          </Button>

          {/* Mobile Chat Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={`${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""} sm:hidden`}
          >
            💬
          </Button>

          <Button variant="default" size="sm" className="bg-[#5137d2] hover:bg-[#4129b8] text-white hidden sm:flex">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Video Area */}
        <div className={`flex-1 p-2 sm:p-4 ${showChat && window.innerWidth >= 768 ? "pr-2" : ""}`}>
          <div
            className={`relative w-full h-full rounded-lg overflow-hidden border ${
              isDark ? "bg-black border-gray-800" : "bg-gray-100 border-gray-300"
            }`}
          >
            {/* Timer */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm z-20 backdrop-blur-sm">
              Time remaining {formatTime(timeRemaining)}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-600/90 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 z-20 backdrop-blur-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="hidden sm:inline">Recording with Whisper...</span>
                <span className="sm:hidden">Recording</span>
              </div>
            )}

            {/* Transcription Status */}
            {isTranscribing && (
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#5137d2]/90 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 z-20 backdrop-blur-sm">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Transcribing...</span>
                <span className="sm:hidden">...</span>
              </div>
            )}

            {/* TTS Status */}
            {isGeneratingSpeech && (
              <div className="absolute top-12 sm:top-16 right-2 sm:right-4 bg-orange-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-20 backdrop-blur-sm">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Generating speech...</span>
                <span className="sm:hidden">Gen...</span>
              </div>
            )}

            {/* Speaking Status */}
            {isSpeaking && (
              <div className="absolute top-12 sm:top-16 right-2 sm:right-4 bg-green-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-20 backdrop-blur-sm">
                <Volume2 className="w-3 h-3" />
                <span className="hidden sm:inline">Speaking</span>
              </div>
            )}

            {/* ElevenLabs Status */}
            {ttsEnabled && !isSpeaking && !isGeneratingSpeech && (
              <div className="absolute top-12 sm:top-16 right-2 sm:right-4 bg-green-600/90 text-white px-2 py-1 rounded-full text-xs z-20 backdrop-blur-sm">
                <span className="hidden sm:inline">ElevenLabs Ready</span>
                <span className="sm:hidden">Ready</span>
              </div>
            )}

            {/* Streaming Video */}
            <StreamingVideo
              streamUrl="https://streams.vagon.io/streams/671b1350-a113-49fb-8d5a-0fa04957ba06"
              className="w-full h-full"
            />

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-4 z-20">
              <VolumeControl selectedSpeaker={selectedSpeaker} />

              {/* TTS Control */}
              {isSpeaking && (
                <Button
                  onClick={stopTTS}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-sm shadow-lg bg-orange-600 hover:bg-orange-700"
                >
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </Button>
              )}

              <Button
                onClick={handleMicToggle}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-sm shadow-lg ${
                  isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-600/80 hover:bg-gray-700/80"
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm w-8 h-8 sm:w-auto sm:h-auto"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div
            className={`${
              window.innerWidth < 768 
                ? "absolute inset-0 z-30" 
                : "w-80 lg:w-96 flex-shrink-0 border-l"
            } flex flex-col ${
              isDark ? "bg-black border-gray-800" : "bg-white border-gray-300"
            }`}
          >
            <div className="p-2 sm:p-4 pb-2 flex-1 flex flex-col">
              <div
                className={`rounded-lg border shadow-sm flex flex-col flex-1 ${
                  isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"
                }`}
              >
                {/* Chat Header */}
                <div
                  className={`p-3 sm:p-4 border-b flex items-center justify-between rounded-t-lg flex-shrink-0 ${
                    isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h2 className={`text-sm sm:text-base font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                    Chatting with Ann - Therapist
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    className={isDark ? "text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Chat Messages - Fixed height container */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatHistory messages={messages} isLoading={isLoading} transcript={transcript} isDark={isDark} />
                </div>

                {/* Chat Input - Fixed at bottom */}
                <div
                  className={`p-3 sm:p-4 border-t space-y-2 rounded-b-lg flex-shrink-0 ${
                    isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {/* Error Messages */}
                  {(voiceError || chatError || ttsError) && (
                    <Alert
                      variant="destructive"
                      className={isDark ? "bg-red-900/50 border-red-800" : "bg-red-50 border-red-200"}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className={isDark ? "text-red-200" : "text-red-800"}>
                        {voiceError || chatError?.message || ttsError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Send a message..."
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className={`flex-1 text-sm ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      disabled={isLoading || !message.trim()}
                      className="bg-[#5137d2] hover:bg-[#4129b8] text-white"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Status Indicators */}
                  <div
                    className={`flex items-center justify-between text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    <div className="flex items-center gap-4">
                      {isRecording && (
                        <div className="flex items-center gap-2 text-red-500">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          Recording with Whisper...
                        </div>
                      )}

                      {isTranscribing && (
                        <div className="flex items-center gap-2 text-[#5137d2]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Transcribing...
                        </div>
                      )}

                      {transcript && !isTranscribing && (
                        <div className="flex items-center gap-2 text-green-500">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Transcript ready
                        </div>
                      )}

                      {isGeneratingSpeech && (
                        <div className="flex items-center gap-2 text-orange-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating speech...
                        </div>
                      )}

                      {isSpeaking && (
                        <div className="flex items-center gap-2 text-green-500">
                          <Volume2 className="w-3 h-3" />
                          Speaking...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Chat Button when hidden */}
        {!showChat && window.innerWidth >= 768 && (
          <div className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 z-30">
            <Button
              onClick={() => setShowChat(true)}
              className="bg-[#5137d2] hover:bg-[#4129b8] text-white shadow-lg"
              size="sm"
            >
              <span className="hidden sm:inline">💬 Show Chat</span>
              <span className="sm:hidden">💬</span>
            </Button>
          </div>
        )}
      </div>

      {/* Device Settings Modal */}
      {showSettings && (
        <DeviceSettingsMinimal
          onClose={() => setShowSettings(false)}
          selectedMicrophone={selectedMicrophone}
          selectedSpeaker={selectedSpeaker}
          theme={theme}
          ttsEnabled={ttsEnabled}
          onMicrophoneChange={updateMicrophone}
          onSpeakerChange={handleSpeakerChange}
          onThemeChange={changeTheme}
          onTtsToggle={handleTTSToggle}
        />
      )}
    </div>
  )
}
