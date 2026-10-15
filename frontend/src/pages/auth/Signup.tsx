import React, { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { ShieldCheck, Eye, EyeOff, Sun, Moon, MailCheck } from "lucide-react"

export function Signup() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("resolvr_theme") !== "light")
  const [error, setError] = useState("")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("resolvr_theme", next ? "dark" : "light")
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    setLoading(true)
    const cleanEmail = email.trim()
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin + "/login",
      },
    })
    if (signUpErr) {
      setError(signUpErr.message)
      setLoading(false)
      return
    }
    // Prevent immediate dashboard redirect if Supabase auto-creates a session
    if (data?.session) {
      await supabase.auth.signOut()
    }
    setSubmittedEmail(cleanEmail)
    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: isDark ? "#020617" : "#f1f5f9", color: isDark ? "#ffffff" : "#0f172a" }} className="flex min-h-screen items-center justify-center px-4 py-12 relative transition-colors">
      <button type="button" onClick={toggleTheme} style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#cbd5e1", color: isDark ? "#fbbf24" : "#334155" }} className="absolute top-6 right-6 p-2.5 rounded-full border shadow-sm cursor-pointer">
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

        {submittedEmail ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <MailCheck className="h-7 w-7" />
            </div>
            <h2 style={{ color: isDark ? "#ffffff" : "#0f172a" }} className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="text-sm leading-relaxed">
              We sent a confirmation link to <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{submittedEmail}</strong>. Click the verification link in your inbox to activate your account, then sign in below.
            </p>
            <Link to="/login" className="mt-4 block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition">
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ color: isDark ? "#ffffff" : "#0f172a" }} className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-1 text-sm">Submit and track IT service requests with departmental triage.</p>
            {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">{error}</div>}
            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <div>
                <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div>
                <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-6 text-center text-xs">
              Already have an account? <Link to="/login" className="font-semibold text-indigo-500 hover:underline">Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}