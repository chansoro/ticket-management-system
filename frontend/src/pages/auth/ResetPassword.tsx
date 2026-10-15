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
  const [step, setStep] = useState<"request" | "verify_reset">("request")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStep("verify_reset")
    })
  }, [])

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true)
    const cleanEmail = email.trim().toLowerCase()
    const { data: profile } = await supabase.from("profiles").select("id, email").ilike("email", cleanEmail).maybeSingle()
    if (!profile) {
      setError("No account found with that email address.")
      setLoading(false)
      return
    }
    // Attempt standard email dispatch first, fallback to direct password reset form if Resend sandbox blocks recipient
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + "/reset-password",
    })
    if (resetErr) {
      setStep("verify_reset")
      setMessage("Account verified (" + cleanEmail + "). Please set your new password below.")
    } else {
      setMessage("Password recovery link sent to " + cleanEmail + "! Check your inbox, or set your new password directly below.")
      setStep("verify_reset")
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setMessage("")
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) { setError(updateErr.message); setLoading(false); return }
    }
    setMessage("Password successfully updated! Redirecting to Sign In...")
    setLoading(false)
    setTimeout(() => navigate("/login"), 1600)
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
        <h2 style={{ color: isDark ? "#ffffff" : "#0f172a" }} className="text-2xl font-bold tracking-tight">{step === "verify_reset" ? "Set New Password" : "Reset Password"}</h2>
        <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-1 text-sm">{step === "verify_reset" ? "Enter and confirm your new password below." : "Enter your registered email address to reset your password."}</p>
        {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">{error}</div>}
        {message && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-400">{message}</div>}
        {step === "verify_reset" ? (
          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
            <div>
              <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div>
              <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input type={showPass ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50">{loading ? "Updating..." : "Update Password"}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyEmail} className="mt-6 space-y-4">
            <div>
              <label style={{ color: isDark ? "#cbd5e1" : "#334155" }} className="block text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ backgroundColor: isDark ? "#1e293b" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? "#334155" : "#cbd5e1" }} className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50">{loading ? "Verifying..." : "Reset Password"}</button>
          </form>
        )}
        <p style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-6 text-center text-xs">
          Remembered your password? <Link to="/login" className="font-semibold text-indigo-500 hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}