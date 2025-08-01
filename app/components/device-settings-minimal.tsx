"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Mic, Volume2, Sun, Moon, Monitor, Zap } from "lucide-react"

interface DeviceSettingsMinimalProps {
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

export function DeviceSettingsMinimal({
  onClose,
  selectedMicrophone,
  selectedSpeaker,
  theme,
  ttsEnabled,
  onMicrophoneChange,
  onSpeakerChange,
  onThemeChange,
  onTtsToggle,
}: DeviceSettingsMinimalProps) {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])

  const getDeviceName = (device: MediaDeviceInfo, index: number) => {
    // Если это default устройство
    if (device.deviceId === "default") {
      return device.kind === "audioinput" ? "Default Microphone" : "Default Speakers"
    }

    if (!device.label || device.label.trim() === "") {
      return device.kind === "audioinput" ? `Microphone ${index + 1}` : `Speakers ${index + 1}`
    }

    let name = device.label
      .replace(/$$[^)]*$$/g, "") // Убираем скобки
      .replace(/Default\s*-?\s*/gi, "")
      .replace(/Communications?\s*-?\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim()

    if (name.length > 30) {
      name = name.substring(0, 27) + "..."
    }

    if (!name) {
      return device.kind === "audioinput" ? `Microphone ${index + 1}` : `Speakers ${index + 1}`
    }

    return name
  }

  useEffect(() => {
    const getDevices = async () => {
      try {
        console.log("Getting audio devices...")

        // Запрашиваем разрешения для получения меток устройств
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop()) // Сразу останавливаем

        const devices = await navigator.mediaDevices.enumerateDevices()
        console.log("All devices:", devices)

        // Включаем default устройства в список
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
        // Fallback устройства
        setAudioInputs([
          { deviceId: "default", kind: "audioinput", label: "Default Microphone", groupId: "" } as MediaDeviceInfo,
        ])
        setAudioOutputs([
          { deviceId: "default", kind: "audiooutput", label: "Default Speakers", groupId: "" } as MediaDeviceInfo,
        ])
      }
    }

    getDevices()
  }, [selectedMicrophone, selectedSpeaker, onMicrophoneChange, onSpeakerChange])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Settings</CardTitle>
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

          {/* Microphone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Mic className="w-4 h-4" />
              Microphone
            </Label>
            <Select value={selectedMicrophone} onValueChange={onMicrophoneChange}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 max-h-48">
                {audioInputs.map((device, index) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Mic className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate" title={device.label}>
                        {getDeviceName(device, index)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speakers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Volume2 className="w-4 h-4" />
              Speakers
            </Label>
            <Select value={selectedSpeaker} onValueChange={onSpeakerChange}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select speakers" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 max-h-48">
                {audioOutputs.map((device, index) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Volume2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate" title={device.label}>
                        {getDeviceName(device, index)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} size="sm" className="bg-[#5137d2] hover:bg-[#4129b8] text-white">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
