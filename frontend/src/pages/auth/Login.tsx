import React, { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { ShieldCheck, Eye, EyeOff, Sun, Moon } from "lucide-react"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) { setError(signInError.message); setLoading(false) }
  }

  return (
    <div style={{ backgroundColor: isDark ? "#020617" : "#f1f5f9", color: isDark ? "#ffffff" : "#0f172a" }} className="flex min-h-screen items-center justify-center px-4 py-12 relative transition-colors">
      <button type="button" onClick={() => setIsDark(!isDark)} style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#cbd5e1", color: isDark ? "#fbbf24" : "#334155" }} className="absolute top-6 right-6 p-2.5 rounded-full border shadow-sm">
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" }} className="w-full max-w-md rounded-3xl border p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 style={{ color: isDark ? "#ffffff" : "#0f172a" }} className="text-xl font-black tracking-tight leading-none">Resolvr</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-indigo-500">Ticket Management System</p>
          </div>
        </div>
        <h2 style={{ color: isDark ? "#ffffff" : "#0f172a" }} className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-1 text-sm">Sign in to access your assigned queue and support requests.</p>
        {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">{error}</div>}
        <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
          <div>
            <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider">Password</label>
              <Link to="/reset-password" className="text-xs font-semibold text-indigo-500 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-6 text-center text-xs">
          Don't have an account? <Link to="/signup" className="font-semibold text-indigo-500 hover:underline">Create an Account</Link>
        </p>
      </div>
    </div>
  )
}