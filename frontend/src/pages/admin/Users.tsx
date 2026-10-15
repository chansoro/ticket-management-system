import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Button } from "@/components/ui/Button"
import { SearchInput } from "@/components/ui/Input"
import { useProfiles, useDepartments } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { UserRole, Profile } from "@/lib/tickets"

type RoleFilter = "all" | "developer" | "user" | "admin"

export function AdminUsers() {
  const { profiles, loading, error, reload } = useProfiles()
  const { departments } = useDepartments()
  const { profile: adminProfile } = useAuth()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [drafts, setDrafts] = useState<Record<string, { role: UserRole; department_id: string | null; is_active: boolean }>>({})
  const [message, setMessage] = useState("")
  const [err, setErr] = useState("")

  const [pending, setPending] = useState<Profile | null>(null)
  const [adminPassword, setAdminPassword] = useState("")
  const [reason, setReason] = useState("")
  const [verifying, setVerifying] = useState(false)

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const getDraft = (u: Profile) =>
    drafts[u.id] ?? { role: u.role, department_id: u.department_id, is_active: u.is_active }

  const handleRequestSave = (u: Profile) => {
    setErr("")
    setMessage("")
    const d = getDraft(u)
    if (d.role === "developer" && !d.department_id) {
      setErr("Please select a department before saving a Developer role.")
      return
    }
    setPending(u)
    setAdminPassword("")
    setReason("")
  }

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending || !adminProfile?.email) return
    setErr("")
    setVerifying(true)

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: adminProfile.email,
        password: adminPassword,
      })
      if (authErr) throw new Error("Admin password incorrect.")

      const d = getDraft(pending)
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          role: d.role,
          department_id: d.role === "developer" ? d.department_id : null,
          is_active: d.is_active,
        })
        .eq("id", pending.id)

      if (upErr) throw upErr

      await supabase.from("role_change_logs").insert({
        target_user_id: pending.id,
        changed_by: adminProfile.id,
        old_role: pending.role,
        new_role: d.role,
        old_department_id: pending.department_id,
        new_department_id: d.role === "developer" ? d.department_id : null,
        reason: reason.trim() || "Administrative role assignment",
        verified_method: "password_reauth",
      })

      setMessage(`Verified and updated access for ${pending.full_name}.`)
      setPending(null)
      await reload()
    } catch (errorCaught) {
      setErr(errorCaught instanceof Error ? errorCaught.message : "Failed to update role.")
    } finally {
      setVerifying(false)
    }
  }

  const counts = {
    all: profiles.length,
    developer: profiles.filter((p) => p.role === "developer").length,
    user: profiles.filter((p) => p.role === "user").length,
    admin: profiles.filter((p) => p.role === "admin").length,
  }

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase()
    const matchesSearch = p.full_name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    const matchesRole = roleFilter === "all" || p.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Users & Role Management"
          subtitle="Manage portal users, filter by role, and assign developers to departments."
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "all", label: `All Users (${counts.all})` },
                { id: "developer", label: `Developers (${counts.developer})` },
                { id: "user", label: `Requestors (${counts.user})` },
                { id: "admin", label: `Admins (${counts.admin})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  roleFilter === tab.id ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
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

        {err && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const d = getDraft(u)
                  const isAdmin = u.role === "admin"
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">Admin</span>
                        ) : (
                          <select
                            value={d.role}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, role: e.target.value as UserRole } }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="user">Requestor</option>
                            <option value="developer">Developer</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.role === "developer" ? (
                          <select
                            value={d.department_id ?? ""}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, department_id: e.target.value || null } }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="">Select department...</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                            value={d.is_active ? "active" : "inactive"}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, is_active: e.target.value === "active" } }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isAdmin && (
                          <Button size="sm" onClick={() => handleRequestSave(u)}>
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
            <form onSubmit={handleConfirmVerification} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Admin Verification Required</h2>
              <p className="text-xs text-slate-600">
                You are updating access for <strong>{pending.full_name}</strong>. Re-enter your admin password to authorize this role modification.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Authorization Note</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Department assignment or role authorization"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Confirm Admin Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
                <Button type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Verify & Save"}</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  )
}
