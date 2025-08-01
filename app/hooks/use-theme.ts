"use client"

import { useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem("theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setResolvedTheme(systemTheme)
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    // Слушаем изменения системной темы
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateResolvedTheme)

    return () => mediaQuery.removeEventListener("change", updateResolvedTheme)
  }, [theme])

  useEffect(() => {
    // Применяем тему к документу
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return { theme, resolvedTheme, changeTheme }
}
