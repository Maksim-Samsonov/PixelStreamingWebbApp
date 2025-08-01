"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Globe, ChevronDown } from "lucide-react"

interface LanguageSelectorProps {
  selectedLanguage: string
  onLanguageChange: (language: string) => void
}

const languages = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "ru-RU", name: "Русский", flag: "🇷🇺" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "it-IT", name: "Italiano", flag: "🇮🇹" },
  { code: "pt-PT", name: "Português", flag: "🇵🇹" },
  { code: "nl-NL", name: "Nederlands", flag: "🇳🇱" },
  { code: "ar-SA", name: "العربية", flag: "🇸🇦" },
]

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage) || languages[0]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 dark:text-gray-300 hover:text-[#5137d2] dark:hover:text-[#5137d2] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
      >
        <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="text-sm">{currentLanguage.flag}</span>
        <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3" />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-40 sm:w-48">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full px-2 sm:px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-xs sm:text-sm ${
                  selectedLanguage === lang.code ? "bg-[#5137d2]/10 text-[#5137d2]" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
