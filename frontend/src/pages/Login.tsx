import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth, getHomePath } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const { session, profile, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)

  if (session && profile) {
    return <Navigate replace to={getHomePath(profile.role)} />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Please enter your email address first.')
      return
    }
    setSubmitting(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setMessage('Password recovery link sent! Please check your email inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Resolvr</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
              Ticket Management System
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {forgotMode ? 'Reset Your Password' : 'Sign in to your account'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {forgotMode
            ? 'Enter your email and we will send you a recovery link.'
            : 'Enter your credentials to access the support portal.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@resolvr.com"
            />
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? 'Sending Recovery Link...' : 'Send Recovery Link'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setForgotMode(false)
                setError('')
                setMessage('')
              }}
              className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@resolvr.com"
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true)
                    setError('')
                    setMessage('')
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
              />
            </div>

            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to="/signup">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
