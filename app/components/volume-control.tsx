"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX } from "lucide-react"

interface VolumeControlProps {
  selectedSpeaker: string
}

export function VolumeControl({ selectedSpeaker }: VolumeControlProps) {
  const [volume, setVolume] = useState([50])
  const [isMuted, setIsMuted] = useState(false)
  const [showSlider, setShowSlider] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Инициализируем Web Audio API для контроля громкости
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          gainNodeRef.current = audioContextRef.current.createGain()
          gainNodeRef.current.connect(audioContextRef.current.destination)
        }
      } catch (error) {
        console.error("Error initializing audio context:", error)
      }
    }

    initAudio()
  }, [])

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume[0] / 100
    }
    console.log("Volume changed to:", newVolume[0])
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = !isMuted ? 0 : volume[0] / 100
    }
    console.log("Mute toggled:", !isMuted)
  }

  const handleVolumeClick = () => {
    setShowSlider(!showSlider)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm"
        onClick={handleVolumeClick}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>

      {showSlider && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-[120px]">
          <div className="flex flex-col items-center gap-2">
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
              orientation="vertical"
            />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
              <span className="text-white text-xs">{isMuted ? 0 : volume[0]}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
