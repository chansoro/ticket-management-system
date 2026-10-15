import { useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useDepartments, useCategories, useProfiles, useTickets } from "@/hooks/useData"
import { supabase } from "@/lib/supabase"

export function AdminDevelopers() {
  const { departments, loading: dLoading, error: dError, reload: reloadDepts } = useDepartments()
  const { categories, loading: cLoading, error: cError } = useCategories(true)
  const { profiles, loading: pLoading, error: pError } = useProfiles()
  const { tickets, loading: tLoading, error: tError } = useTickets()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"active" | "at_capacity" | "inactive">("active")
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (dLoading || cLoading || pLoading || tLoading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (dError || cError || pError || tError) return <AppShell role="admin"><PageError message={dError || cError || pError || tError} /></AppShell>

  const developers = profiles.filter((p) => p.role === "developer")

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSaving(true)
    const { error: insertError } = await supabase.from("departments").insert({ name: name.trim(), email: email.trim(), status })
    if (insertError) {
      setErrorMsg(insertError.message)
    } else {
      setName("")
      setEmail("")
      setStatus("active")
      await reloadDepts()
    }
    setSaving(false)
  }

  const handleUpdateStatus = async (deptId: string, newStatus: "active" | "at_capacity" | "inactive") => {
    const { error: upErr } = await supabase.from("departments").update({ status: newStatus }).eq("id", deptId)
    if (upErr) setErrorMsg(upErr.message)
    else await reloadDepts()
  }

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Departments, Routing & Developers"
          subtitle="Each department manages linked categories. Tickets submitted under those categories route to that department's queue."
        />

        <form onSubmit={handleAddDept} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:grid-cols-4">
          <Input placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input placeholder="dept@resolvr.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "at_capacity" | "inactive")}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700"
          >
            <option value="active">Active</option>
            <option value="at_capacity">At Capacity</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Department"}</Button>
          {errorMsg && <p className="text-xs text-rose-600 md:col-span-4">{errorMsg}</p>}
        </form>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {departments.map((dept) => {
            const deptCats = categories.filter((c) => c.department_id === dept.id)
            const deptCatIds = deptCats.map((c) => c.id)
            const deptDevs = developers.filter((d) => d.department_id === dept.id)
            const deptTickets = tickets.filter((t) => deptCatIds.includes(t.category_id) && t.statusDb !== "resolved")
            const unassigned = deptTickets.filter((t) => !t.assigned_to).length

            return (
              <div key={dept.id} className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{dept.name}</h2>
                      <p className="text-xs text-slate-500">{dept.email}</p>
                    </div>

                    <select
                      value={dept.status}
                      onChange={(e) => void handleUpdateStatus(dept.id, e.target.value as "active" | "at_capacity" | "inactive")}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <option value="active">Active</option>
                      <option value="at_capacity">At Capacity</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Linked Categories ({deptCats.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {deptCats.map((c) => (
                        <span key={c.id} className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Assigned Developers ({deptDevs.length})
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60">
                      {deptDevs.map((dev) => {
                        const activeLoad = tickets.filter((t) => t.assigned_to === dev.id && t.statusDb !== "resolved").length
                        return (
                          <div key={dev.id} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                            <div>
                              <p className="font-semibold text-slate-800">{dev.full_name}</p>
                              <p className="text-slate-400">{dev.email}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${activeLoad === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                              {activeLoad === 0 ? "Available" : `${activeLoad} active`}
                            </span>
                          </div>
                        )
                      })}
                      {!deptDevs.length && (
                        <p className="px-3.5 py-3 text-xs text-slate-400 italic">No developers assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold text-slate-700">
                    {deptTickets.length} active tickets {unassigned > 0 && `(${unassigned} unassigned)`}
                  </span>
                  <Link to="/admin/tickets" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    View Queue →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
