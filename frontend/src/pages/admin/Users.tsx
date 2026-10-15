import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { SearchInput } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useProfiles, useDepartments } from "@/hooks/useData"
import { supabase } from "@/lib/supabase"
import type { UserRole } from "@/lib/tickets"

export function AdminUsers() {
  const { profiles, loading, error, reload } = useProfiles()
  const { departments } = useDepartments()
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Record<string, { role: UserRole; department_id: string | null; is_active: boolean }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const filtered = profiles.filter((p) => {
    const matchesRole = roleFilter === "all" || p.role === roleFilter
    const term = search.toLowerCase()
    const matchesSearch = p.full_name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    return matchesRole && matchesSearch
  })

  function changeRole(id: string, role: UserRole) {
    const cur = editing[id] ?? { role: profiles.find((p) => p.id === id)?.role ?? "user", department_id: profiles.find((p) => p.id === id)?.department_id ?? null, is_active: profiles.find((p) => p.id === id)?.is_active ?? true }
    setEditing({ ...editing, [id]: { ...cur, role } })
  }
  function changeDept(id: string, department_id: string | null) {
    const cur = editing[id] ?? { role: profiles.find((p) => p.id === id)?.role ?? "user", department_id: profiles.find((p) => p.id === id)?.department_id ?? null, is_active: profiles.find((p) => p.id === id)?.is_active ?? true }
    setEditing({ ...editing, [id]: { ...cur, department_id } })
  }
  function changeStatus(id: string, is_active: boolean) {
    const cur = editing[id] ?? { role: profiles.find((p) => p.id === id)?.role ?? "user", department_id: profiles.find((p) => p.id === id)?.department_id ?? null, is_active: profiles.find((p) => p.id === id)?.is_active ?? true }
    setEditing({ ...editing, [id]: { ...cur, is_active } })
  }
  async function save(id: string) {
    const changes = editing[id]
    if (!changes) return
    setSavingId(id)
    await supabase.from("profiles").update(changes).eq("id", id)
    setSavingId(null)
    await reload()
  }

  const tabs = [
    { id: "all", label: "All Users (" + profiles.length + ")" },
    { id: "developer", label: "Developers (" + profiles.filter((p) => p.role === "developer").length + ")" },
    { id: "user", label: "Requestors (" + profiles.filter((p) => p.role === "user").length + ")" },
    { id: "admin", label: "Admins (" + profiles.filter((p) => p.role === "admin").length + ")" },
  ]

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader title="Users & Role Management" subtitle="Manage portal users, filter by role, and assign developers to departments." />

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
                  className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
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
                const dept = draft?.department_id !== undefined ? draft.department_id : p.department_id
                const active = draft?.is_active ?? p.is_active
                return (
                  <tr key={p.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-5 truncate">
                      <p className="font-bold text-slate-900 truncate">{p.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{p.email}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <select value={role} onChange={(e) => changeRole(p.id, e.target.value as UserRole)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none">
                        <option value="user">Requestor</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3">
                      {role === "developer" ? (
                        <select value={dept ?? ""} onChange={(e) => changeDept(p.id, e.target.value || null)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none">
                          <option value="">No Department</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 pl-2">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <select value={active ? "active" : "inactive"} onChange={(e) => changeStatus(p.id, e.target.value === "active")} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button size="sm" disabled={!editing[p.id] || savingId === p.id} onClick={() => void save(p.id)}>
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
    </AppShell>
  )
}