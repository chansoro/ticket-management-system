import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface Props {
  open: boolean
  onClose: () => void
}

export function AccountSettingsModal({ open, onClose }: Props) {
  const { profile, refreshProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState(profile?.fullName || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!open || !profile) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!fullName.trim()) {
      setError('Display name cannot be empty.')
      return
    }
    setSaving(true)
    try {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id)
      if (upErr) throw upErr

      if (newPassword) {
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters.')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Password confirmation does not match.')
        }
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
        if (pwErr) throw pwErr
      }

      await refreshProfile()
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Account settings updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
            <p className="text-xs text-slate-500">Manage your Resolvr profile and security credentials.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
              {message}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</p>
              <p className="text-sm font-medium text-slate-800">{profile.email}</p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
              {profile.role === 'user' ? 'Requestor' : profile.role}
            </span>
          </div>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Change Password (Optional)
            </p>
            <div className="space-y-3">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              Sign Out
            </button>
            <div className="flex gap-2">
              <Button onClick={onClose} type="button" variant="secondary">
                Close
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
