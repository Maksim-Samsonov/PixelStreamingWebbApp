"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Mic, Volume2, Zap, CheckCircle, Sun, Moon, Monitor } from "lucide-react"

interface DeviceSettingsProps {
  onClose: () => void
  selectedMicrophone: string
  selectedSpeaker: string
  theme: "light" | "dark" | "system"
  ttsEnabled: boolean
  onMicrophoneChange: (deviceId: string) => void
  onSpeakerChange: (deviceId: string) => void
  onThemeChange: (theme: "light" | "dark" | "system") => void
  onTtsToggle: (enabled: boolean) => void
}

export function DeviceSettings({
  onClose,
  selectedMicrophone,
  selectedSpeaker,
  theme,
  ttsEnabled,
  onMicrophoneChange,
  onSpeakerChange,
  onThemeChange,
  onTtsToggle,
}: DeviceSettingsProps) {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    const getDevices = async () => {
      try {
        console.log("Getting audio devices...")

        // Запрашиваем разрешения для получения меток устройств
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Останавливаем поток сразу после получения разрешений
        stream.getTracks().forEach((track) => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        console.log("All devices:", devices)

        const inputs = devices.filter((device) => device.kind === "audioinput")
        const outputs = devices.filter((device) => device.kind === "audiooutput")

        console.log("Audio inputs:", inputs)
        console.log("Audio outputs:", outputs)

        setAudioInputs(inputs)
        setAudioOutputs(outputs)

        // Если устройства не выбраны, выбираем первые доступные
        if (!selectedMicrophone && inputs.length > 0) {
          const defaultInput = inputs.find((d) => d.deviceId !== "default") || inputs[0]
          onMicrophoneChange(defaultInput.deviceId)
          console.log("Auto-selected microphone:", defaultInput.label || defaultInput.deviceId)
        }
        if (!selectedSpeaker && outputs.length > 0) {
          const defaultOutput = outputs.find((d) => d.deviceId !== "default") || outputs[0]
          onSpeakerChange(defaultOutput.deviceId)
          console.log("Auto-selected speaker:", defaultOutput.label || defaultOutput.deviceId)
        }
      } catch (error) {
        console.error("Error getting devices:", error)
      }
    }

    getDevices()
  }, [selectedMicrophone, selectedSpeaker, onMicrophoneChange, onSpeakerChange])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Device Settings
            <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
              <Zap className="w-3 h-3" />
              Whisper AI
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Whisper AI Transcription</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Professional OpenAI Whisper transcription with support for multiple languages and high accuracy.
            </p>
          </div>

          {/* Text-to-Speech Toggle */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Zap className="w-4 h-4" />
              ElevenLabs Voice Response
            </Label>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically speak AI responses using ElevenLabs
                </p>
              </div>
              <Switch
                checked={ttsEnabled}
                onCheckedChange={onTtsToggle}
                className="data-[state=checked]:bg-[#5137d2]"
              />
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Sun className="w-4 h-4" />
              Theme
            </Label>
            <Select value={theme} onValueChange={onThemeChange}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                <SelectItem
                  value="light"
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3 h-3" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem
                  value="dark"
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3 h-3" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem
                  value="system"
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Mic className="w-4 h-4" />
              Microphone
            </Label>
            <Select value={selectedMicrophone} onValueChange={onMicrophoneChange}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                {audioInputs.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audio will be processed by OpenAI Whisper for accurate transcription
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Volume2 className="w-4 h-4" />
              Audio Output Device
            </Label>
            <Select value={selectedSpeaker} onValueChange={onSpeakerChange}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select speakers" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                {audioOutputs.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {device.label || `Speakers ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">Whisper Capabilities:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Support for multiple languages</li>
              <li>• Background noise suppression</li>
              <li>• High accuracy transcription</li>
              <li>• Real-time processing</li>
              <li>• Automatic language detection</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose} className="bg-[#5137d2] hover:bg-[#4129b8] text-white">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
