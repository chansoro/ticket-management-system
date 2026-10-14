import React, { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { useTickets } from '../../context/TicketContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { SearchInput } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { UserRole } from '../../types'

interface PendingRoleChange {
  userId: string
  fullName: string
  oldRole: UserRole
  newRole: UserRole
  oldDeptId: string | null
  newDeptId: string | null
  isActive: boolean
}

type RoleFilter = 'all' | 'developer' | 'user' | 'admin'

export function AdminUsers() {
  const { users, departments, updateUserAccess } = useTickets()
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [drafts, setDrafts] = useState<
    Record<string, { role: UserRole; departmentId: string | null; isActive: boolean }>
  >({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [pending, setPending] = useState<PendingRoleChange | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [reason, setReason] = useState('')
  const [verifying, setVerifying] = useState(false)

  const getDraft = (u: (typeof users)[number]) =>
    drafts[u.id] ?? { role: u.role, departmentId: u.departmentId, isActive: u.isActive }

  const handleRequestSave = (u: (typeof users)[number]) => {
    setError('')
    setMessage('')
    const d = getDraft(u)
    if (d.role === 'developer' && !d.departmentId) {
      setError('Please select a department before saving a Developer role.')
      return
    }
    setPending({
      userId: u.id,
      fullName: u.fullName,
      oldRole: u.role,
      newRole: d.role,
      oldDeptId: u.departmentId,
      newDeptId: d.role === 'developer' ? d.departmentId : null,
      isActive: d.isActive,
    })
    setAdminPassword('')
    setReason('')
  }

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending || !profile) return
    setError('')
    setVerifying(true)

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: adminPassword,
      })
      if (authErr) {
        throw new Error('Admin verification failed: Incorrect password.')
      }

      await updateUserAccess({
        userId: pending.userId,
        role: pending.newRole,
        departmentId: pending.newDeptId,
        isActive: pending.isActive,
        categoryIds: [],
      })

      await supabase.from('role_change_logs').insert({
        target_user_id: pending.userId,
        changed_by: profile.id,
        old_role: pending.oldRole,
        new_role: pending.newRole,
        old_department_id: pending.oldDeptId,
        new_department_id: pending.newDeptId,
        reason: reason.trim() || 'Authorized administrative role update',
        verified_method: 'password_reauth',
      })

      setMessage(`Verified and updated access for ${pending.fullName}.`)
      setPending(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user access.')
    } finally {
      setVerifying(false)
    }
  }

  const counts = {
    all: users.length,
    developer: users.filter((u) => u.role === 'developer').length,
    user: users.filter((u) => u.role === 'user').length,
    admin: users.filter((u) => u.role === 'admin').length,
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users & Role Management</h1>
          <p className="text-sm text-slate-500">
            Manage portal accounts, filter by role, and assign developers to support departments.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: 'all', label: `All Users (${counts.all})` },
                { id: 'developer', label: `Developers (${counts.developer})` },
                { id: 'user', label: `Requestors (${counts.user})` },
                { id: 'admin', label: `Admins (${counts.admin})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  roleFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full lg:w-80"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const d = getDraft(u)
                  const isAdmin = u.role === 'admin'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                            Admin
                          </span>
                        ) : (
                          <select
                            value={d.role}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [u.id]: { ...d, role: e.target.value as UserRole },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
                          >
                            <option value="user">Requestor</option>
                            <option value="developer">Developer</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.role === 'developer' ? (
                          <select
                            value={d.departmentId || ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [u.id]: { ...d, departmentId: e.target.value || null },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
                          >
                            <option value="">Select department...</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="text-xs font-semibold text-emerald-700">Active</span>
                        ) : (
                          <select
                            value={d.isActive ? 'active' : 'inactive'}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [u.id]: { ...d, isActive: e.target.value === 'active' },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isAdmin && (
                          <Button onClick={() => handleRequestSave(u)} className="px-3.5 py-1.5 text-xs">
                            Save
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <form
              onSubmit={handleConfirmVerification}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900">Admin Verification Required</h2>
              <p className="text-xs text-slate-600">
                You are updating access permissions for <strong>{pending.fullName}</strong> (
                {pending.oldRole === 'user' ? 'REQUESTOR' : pending.oldRole.toUpperCase()} →{' '}
                <span className="text-indigo-600 font-bold">
                  {pending.newRole === 'user' ? 'REQUESTOR' : pending.newRole.toUpperCase()}
                </span>
                ). Please enter your administrator password to authorize this change.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Authorization Note
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Department assignment or role authorization"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Confirm Admin Password ({profile?.email})
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setPending(null)} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button disabled={verifying} type="submit">
                  {verifying ? 'Verifying...' : 'Verify & Save'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  )
}
