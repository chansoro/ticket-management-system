import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { ShieldCheck, Eye, EyeOff, Sun, Moon } from "lucide-react"

export function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `\${window.location.origin}/reset-password`,
    })

    if (resetErr) {
      setError(resetErr.message)
    } else {
      setMessage("Password recovery email sent! Check your inbox for the reset link.")
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setMessage("Password updated successfully! Redirecting to login...")
      setTimeout(() => navigate("/login"), 2000)
    }
    setLoading(false)
  }

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-12 relative transition-colors duration-200 \${
      isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
    }`}>
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-6 right-6 p-2.5 rounded-full border transition \${
          isDark ? "border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className={`relative z-10 w-full max-w-md rounded-3xl border p-8 sm:p-10 shadow-2xl transition-all \${
        isDark ? "border-slate-800 bg-[#0f172a]" : "border-slate-200 bg-white"
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-tight leading-none \${isDark ? "text-white" : "text-slate-900"}`}>Resolvr</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-indigo-500">
              Ticket Management System
            </p>
          </div>
        </div>

        <h2 className={`text-2xl font-bold tracking-tight \${isDark ? "text-white" : "text-slate-900"}`}>
          {hasSession ? "Set New Password" : "Reset Password"}
        </h2>
        <p className={`mt-1 text-sm \${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {hasSession ? "Enter and confirm your new secure password." : "Enter your email to receive a password reset link."}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-500">
            {message}
          </div>
        )}

        {hasSession ? (
          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 \${isDark ? "text-slate-300" : "text-slate-600"}`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 \${
                    isDark ? "border-slate-700 bg-slate-900/80 text-white focus:border-indigo-500" : "border-slate-300 bg-white text-slate-900 focus:border-indigo-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 \${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 \${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 \${
                  isDark ? "border-slate-700 bg-slate-900/80 text-white focus:border-indigo-500" : "border-slate-300 bg-white text-slate-900 focus:border-indigo-600"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendResetEmail} className="mt-6 space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 \${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 \${
                  isDark ? "border-slate-700 bg-slate-900/80 text-white focus:border-indigo-500" : "border-slate-300 bg-white text-slate-900 focus:border-indigo-600"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-indigo-500 hover:text-indigo-400">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
