"use client"

import { useState, useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StreamingVideoProps {
  streamUrl: string
  className?: string
}

export function StreamingVideo({ streamUrl, className = "" }: StreamingVideoProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((prev) => prev + 1)
  }

  useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true)
    setHasError(false)
  }, [streamUrl])

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
          <div>
            <h3 className="text-lg font-semibold">Stream Unavailable</h3>
            <p className="text-sm text-gray-400">Unable to connect to the video stream</p>
          </div>
          <Button onClick={handleRetry} variant="outline" className="bg-transparent border-white text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}
      <iframe
        key={retryCount} // Force re-render on retry
        className="border-0 h-full w-full rounded-lg"
        allow="microphone *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *;"
        src={streamUrl}
        title="Ann - Therapist Live Stream"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
