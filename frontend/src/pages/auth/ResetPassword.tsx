import React, { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Shield, MailCheck, Eye, EyeOff, CheckCircle2, RefreshCw, Edit3 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [resetConfirmed, setResetConfirmed] = useState(false)

  useEffect(() => {
    // Detect if user arrived via the Password Reset link in their email
    const hash = window.location.hash
    const queryType = searchParams.get("type")
    const hasCode = searchParams.get("code")

    if (
      hash.includes("type=recovery") ||
      hash.includes("access_token") ||
      queryType === "recovery" ||
      Boolean(hasCode)
    ) {
      setRecoveryMode(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams])

  async function handleSendResetEmail(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError("")
    setInfoMessage("")
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + "/reset-password?type=recovery",
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
    setInfoMessage("Password reset link sent! Please check your inbox (and spam folder).")
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
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
      setLoading(false)
      return
    }

    // Sign out recovery session so user logs in cleanly on the Login page with their new password
    await supabase.auth.signOut()
    setLoading(false)
    setResetConfirmed(true)

    setTimeout(() => {
      navigate("/login?reset=success", { replace: true })
    }, 1800)
  }

  // Step 6 & 7: Reset password confirmed -> redirect to login
  if (resetConfirmed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="fixed top-5 right-5 z-30"><ThemeToggle /></div>
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Password Reset Confirmed!</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your password has been updated successfully. Redirecting you to Sign In...
          </p>
          <Button className="w-full justify-center py-2.5" onClick={() => navigate("/login?reset=success", { replace: true })}>
            Go to Sign In Now
          </Button>
        </div>
      </div>
    )
  }

  // Step 5: User clicked link in email -> Set New Password & Confirm Password
  if (recoveryMode) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="fixed top-5 right-5 z-30"><ThemeToggle /></div>
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Resolvr</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">Ticket Management System</div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Set New Password</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Enter and confirm your new password below.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Input
                  required
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Input
                  required
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400">
            Remembered your password?{" "}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 3: Prompt with email that says "Check your email" AND has an option to change email to send to
  if (sent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="fixed top-5 right-5 z-30"><ThemeToggle /></div>
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-5">
          <div className="mx-auto flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Resolvr</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-0.5">Ticket Management System</div>
            </div>
          </div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
            <MailCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Check your email</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We sent a password reset link to <strong className="text-slate-900 dark:text-white">{email}</strong>. Click the reset button in the email to set your new password.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-500">
              {infoMessage}
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center py-2.5"
              onClick={() => {
                setSent(false)
                setInfoMessage("")
                setError("")
              }}
            >
              <Edit3 className="mr-1.5 h-4 w-4" /> Change Email Address
            </Button>

            <Button
              type="button"
              disabled={loading}
              className="w-full justify-center py-2.5"
              onClick={() => handleSendResetEmail()}
            >
              <RefreshCw className={"mr-1.5 h-4 w-4 " + (loading ? "animate-spin" : "")} />
              {loading ? "Resending..." : "Resend Reset Email"}
            </Button>
          </div>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2">
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 2/3 Initial screen: Email pre-filled from Login (or user can edit/change email right here before sending)
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="fixed top-5 right-5 z-30"><ThemeToggle /></div>
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Resolvr</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">Ticket Management System</div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reset Your Password</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Confirm or change the email address below and we'll send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSendResetEmail} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address to Send Reset Link
            </label>
            <Input
              required
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Remembered your password?{" "}
          <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
