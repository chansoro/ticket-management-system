import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { validateEmailAddress } from "@/lib/emailValidation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { homeForRole } from "@/components/RouteGuard"
import type { UserRole } from "@/lib/tickets"

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [banner, setBanner] = useState("")

  useEffect(() => {
    const isVerified = searchParams.get("verified") === "true"
    const isReset = searchParams.get("reset") === "success"
    const hasHashToken = window.location.hash.includes("access_token") || window.location.hash.includes("type=signup")

    if (isVerified || hasHashToken) {
      setTimeout(async () => {
        await supabase.auth.signOut()
      }, 300)
      setBanner("Email verified successfully! Please sign in with your credentials below.")
    } else if (isReset) {
      setBanner("Password reset confirmed! Please sign in with your new password.")
    }
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setBanner("")

    const emailError = validateEmailAddress(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Invalid login credentials.")
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle()

    const userRole = (profile?.role as UserRole) ?? "user"
    navigate(homeForRole(userRole), { replace: true })
  }

  const forgotPasswordUrl = email.trim()
    ? "/reset-password?email=" + encodeURIComponent(email.trim())
    : "/reset-password"

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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sign in with your credentials to access your portal.</p>
        </div>

        {banner && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{banner}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <Input
              required
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Password</label>
              <Link
                to={forgotPasswordUrl}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link to="/signup" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  )
}
