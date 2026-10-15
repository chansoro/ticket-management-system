import React, { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Input, SearchInput } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useProfiles, useDepartments } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { UserRole } from "@/lib/tickets"
import { ShieldAlert } from "lucide-react"

export function AdminUsers() {
  const { profile: adminProfile } = useAuth()
  const { profiles, loading, error, reload } = useProfiles()
  const { departments } = useDepartments()
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Record<string, { role: UserRole; department_id: string | null; is_active: boolean }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [verifyTargetId, setVerifyTargetId] = useState<string | null>(null)
  const [adminPassword, setAdminPassword] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const [statusMsg, setStatusMsg] = useState("")

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const filtered = profiles.filter((p) => {
    const matchesRole = roleFilter === "all" || p.role === roleFilter
    const term = search.toLowerCase()
    const matchesSearch = p.full_name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    return matchesRole && matchesSearch
  })

  function changeRole(id: string, role: UserRole) {
    const orig = profiles.find((p) => p.id === id)
    const cur = editing[id] ?? { role: orig?.role ?? "user", department_id: orig?.department_id ?? null, is_active: orig?.is_active ?? true }
    // Automatically clear department_id to null when switching to Requestor or Admin!
    const nextDept = role === "developer" ? (cur.department_id ?? departments[0]?.id ?? null) : null
    setEditing({ ...editing, [id]: { ...cur, role, department_id: nextDept } })
  }

  function changeDept(id: string, department_id: string | null) {
    const orig = profiles.find((p) => p.id === id)
    const cur = editing[id] ?? { role: orig?.role ?? "user", department_id: orig?.department_id ?? null, is_active: orig?.is_active ?? true }
    setEditing({ ...editing, [id]: { ...cur, department_id } })
  }

  function changeStatus(id: string, is_active: boolean) {
    const orig = profiles.find((p) => p.id === id)
    const cur = editing[id] ?? { role: orig?.role ?? "user", department_id: orig?.department_id ?? null, is_active: orig?.is_active ?? true }
    setEditing({ ...editing, [id]: { ...cur, is_active } })
  }

  function handleSaveClick(id: string) {
    if (!editing[id]) return
    setVerifyTargetId(id)
    setAdminPassword("")
    setVerifyError("")
    setStatusMsg("")
  }

  async function confirmVerifiedSave(e: React.FormEvent) {
    e.preventDefault()
    if (!verifyTargetId || !editing[verifyTargetId]) return
    const targetId = verifyTargetId
    const changes = editing[targetId]

    if (changes.role === "developer" && !changes.department_id) {
      setVerifyError("Please select a Department for this Developer before saving.")
      return
    }

    setSavingId(targetId)
    setVerifyError("")

    if (adminProfile?.email) {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: adminProfile.email,
        password: adminPassword,
      })
      if (authErr) {
        setVerifyError("Authorization failed: Incorrect Admin password.")
        setSavingId(null)
        return
      }
    }

    const payload = {
      role: changes.role,
      department_id: changes.role === "developer" ? changes.department_id : null,
      is_active: changes.is_active,
    }

    const { error: updateErr } = await supabase.from("profiles").update(payload).eq("id", targetId)
    setSavingId(null)

    if (updateErr) {
      setVerifyError(updateErr.message)
      return
    }

    // Clear local draft state so UI reflects fresh DB state cleanly
    const nextEditing = { ...editing }
    delete nextEditing[targetId]
    setEditing(nextEditing)
    setVerifyTargetId(null)
    setStatusMsg("User role and permissions updated successfully.")
    await reload()
  }

  const tabs = [
    { id: "all", label: "All Users (" + profiles.length + ")" },
    { id: "developer", label: "Developers (" + profiles.filter((p) => p.role === "developer").length + ")" },
    { id: "user", label: "Requestors (" + profiles.filter((p) => p.role === "user").length + ")" },
    { id: "admin", label: "Admins (" + profiles.filter((p) => p.role === "admin").length + ")" },
  ]

  const targetUser = profiles.find((p) => p.id === verifyTargetId)

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader title="Users & Role Management" subtitle="Manage portal users, filter by role, and assign developers to departments." />

        {statusMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            ✓ {statusMsg}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {tabs.map((tab) => {
              const active = roleFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  style={{ backgroundColor: active ? "#4f46e5" : "transparent", color: active ? "#ffffff" : "#475569" }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <SearchInput placeholder="Search users by name or email address..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5 w-[23%]">User</th>
                <th className="py-3.5 px-3 w-[16%]">Role</th>
                <th className="py-3.5 px-3 w-[31%]">Department</th>
                <th className="py-3.5 px-3 w-[16%]">Status</th>
                <th className="py-3.5 px-5 w-[14%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const draft = editing[p.id]
                const role = draft?.role ?? p.role
                const dept = draft !== undefined ? draft.department_id : p.department_id
                const active = draft?.is_active ?? p.is_active
                const hasChanges = Boolean(draft) && (draft.role !== p.role || draft.department_id !== p.department_id || draft.is_active !== p.is_active)
                return (
                  <tr key={p.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-5 truncate">
                      <p className="font-bold text-slate-900 truncate">{p.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{p.email}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <select value={role} onChange={(e) => changeRole(p.id, e.target.value as UserRole)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer">
                        <option value="user">Requestor</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3">
                      {role === "developer" ? (
                        <select value={dept ?? ""} onChange={(e) => changeDept(p.id, e.target.value || null)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer">
                          <option value="">Select Department...</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 pl-2">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <select value={active ? "active" : "inactive"} onChange={(e) => changeStatus(p.id, e.target.value === "active")} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button size="sm" disabled={!hasChanges || savingId === p.id} onClick={() => handleSaveClick(p.id)}>
                        {savingId === p.id ? "Saving..." : "Save"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {verifyTargetId && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form onSubmit={confirmVerifiedSave} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin Security Verification</h3>
                <p className="text-xs text-slate-500">Authorize role or permission modification</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-700 space-y-1">
              <p>Target User: <strong>{targetUser.full_name}</strong> ({targetUser.email})</p>
              <p>New Role: <strong className="uppercase text-indigo-600">{editing[verifyTargetId]?.role === "user" ? "Requestor" : editing[verifyTargetId]?.role}</strong></p>
            </div>
            <p className="text-xs text-slate-600">Please enter your Admin password (<strong>{adminProfile?.email}</strong>) to confirm this change:</p>
            {verifyError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{verifyError}</p>}
            <Input
              type="password"
              placeholder="Enter Admin password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setVerifyTargetId(null)}>Cancel</Button>
              <Button type="submit" disabled={savingId === verifyTargetId || !adminPassword}>
                {savingId === verifyTargetId ? "Verifying..." : "Verify & Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}