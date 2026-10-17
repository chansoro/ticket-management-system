import React, { useState, useEffect } from "react"

export function SidebarThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("resolvr_theme") === "dark"
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("resolvr_theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("resolvr_theme", "light")
    }
  }, [isDark])

  return (
    <div className="mb-3 no-print">
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        style={{
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          color: isDark ? "#f8fafc" : "#0f172a"
        }}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-bold transition hover:opacity-90 cursor-pointer shadow-xs"
      >
        <span className="flex items-center gap-2">
          <span>{isDark ? "☀" : "🌙"}</span>
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </span>
        <span className="rounded-md bg-indigo-600/20 text-indigo-400 px-2 py-0.5 text-[10px] uppercase font-black">
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    </div>
  )
}
