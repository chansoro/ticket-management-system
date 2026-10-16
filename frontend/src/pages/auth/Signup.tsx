import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shield, MailCheck, ArrowRight, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const cleanEmail = email.trim().toLowerCase()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim(), role: "user" },
        emailRedirectTo: window.location.origin + "/login?verified=true",
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Supabase returns an empty identities array if the email is already registered
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("An account with this email already exists. Please sign in or reset your password.")
      setLoading(false)
      return
    }

    // If Supabase had auto-session, sign out so user follows the email confirmation -> login flow
    if (data?.session) {
      await supabase.auth.signOut()
    }

    setLoading(false)
    setSubmitted(true)
  }

  async function handleResend() {
    setResending(true)
    setResendMessage("")
    setError("")
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin + "/login?verified=true",
      },
    })
    setResending(false)
    if (resendErr) {
      setError(resendErr.message)
    } else {
      setResendMessage("Verification email resent! Please check your inbox and spam folder.")
    }
  }

  if (submitted) {
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

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <MailCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Check your email</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We sent a confirmation link to <strong className="text-slate-900 dark:text-white">{email}</strong>. Click the verification link in your inbox to activate your account, then sign in below.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-500">
              {resendMessage}
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <Button className="w-full justify-center py-2.5" onClick={() => navigate("/login")}>
              Proceed to Sign In <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>

            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (resending ? "animate-spin" : "")} />
              {resending ? "Sending..." : "Didn't receive the email? Resend confirmation"}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create an Account</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Register to submit and track IT support requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <Input
              required
              placeholder="e.g., Christine Anne Rodas"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <Input
              required
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <Input
              required
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
            <Input
              required
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
