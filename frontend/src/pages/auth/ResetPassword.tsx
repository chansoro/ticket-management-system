import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { HeroPanel } from "./HeroPanel"
import { Button } from "@/components/ui/Button"
import { Input, Label } from "@/components/ui/Input"
import { AuthBackground } from "@/components/AuthBackground"
import { supabase } from "@/lib/supabase"

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess("Your password has been updated! Redirecting to login...")
    setTimeout(() => navigate("/login", { replace: true }), 2000)
  }

  return (
    <div className="relative isolate flex min-h-screen overflow-hidden">
      <AuthBackground />
      <HeroPanel
        headline="Reset your password."
        subtext="Choose a strong new password to secure your IT Help Desk account."
      />
      <div className="relative z-10 flex min-h-screen flex-[42] flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Set New Password</h2>
          <p className="text-sm text-[#6e6e73] mb-8">Enter and confirm your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" size="lg" disabled={loading}>
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#6e6e73] mt-6">
            Remembered your password?{" "}
            <Link to="/login" className="text-[#0071e3] font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}