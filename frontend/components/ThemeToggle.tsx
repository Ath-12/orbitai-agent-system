"use client"

import * as React from "react"
import { Flashlight } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        p-2.5 rounded-xl transition-all duration-300 ease-out border
        ${isDark 
          ? "bg-zinc-800 border-zinc-700 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
          : "bg-stone-200 border-stone-300 text-stone-600 hover:bg-stone-300"}
        hover:scale-105 active:scale-95
      `}
      aria-label="Toggle Theme"
    >
      {/* Simple Icon Rotation - No extra broken divs */}
      <Flashlight 
        className={`h-5 w-5 transition-transform duration-500 ${isDark ? "-rotate-12 fill-current" : "rotate-0"}`} 
      />
    </button>
  )
}