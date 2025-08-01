"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Key } from "lucide-react"

export function ApiKeyChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [keyStatus, setKeyStatus] = useState<"unknown" | "valid" | "invalid">("unknown")
  const [errorMessage, setErrorMessage] = useState("")

  const checkApiKey = async () => {
    setIsChecking(true)
    setErrorMessage("")

    try {
      // Создаем тестовый аудио файл (пустой)
      const testBlob = new Blob(["test"], { type: "audio/webm" })
      const formData = new FormData()
      formData.append("audio", testBlob, "test.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setKeyStatus("valid")
      } else {
        setKeyStatus("invalid")
        setErrorMessage(result.error?.message || "API key validation failed")
      }
    } catch (error) {
      setKeyStatus("invalid")
      setErrorMessage("Network error during API key check")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          OpenAI API Key Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">API Key Status:</span>
          {keyStatus === "unknown" && <Badge variant="secondary">Unknown</Badge>}
          {keyStatus === "valid" && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          )}
          {keyStatus === "invalid" && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Invalid
            </Badge>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <Button onClick={checkApiKey} disabled={isChecking} className="w-full">
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check API Key"
          )}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Make sure your OpenAI API key is correctly set in the environment variables and has
            sufficient credits for Whisper API usage.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
