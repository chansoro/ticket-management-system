import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { Input, Select, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { useCategories, useDepartments, useTickets } from "@/hooks/useData"
import { supabase } from "@/lib/supabase"

export function AdminCategories() {
  const { categories, loading, error, reload } = useCategories(true)
  const { departments } = useDepartments()
  const { tickets } = useTickets()
  const [form, setForm] = useState({ name: "", description: "", department_id: "" })
  const [message, setMessage] = useState("")

  async function create() {
    const { error: e } = await supabase.from("categories").insert({ ...form, is_active: true })
    if (e) setMessage(e.message)
    else { setForm({ name: "", description: "", department_id: "" }); await reload() }
  }

  async function toggle(id: string, value: boolean) {
    const { error: e } = await supabase.from("categories").update({ is_active: value }).eq("id", id)
    if (e) setMessage(e.message)
    else await reload()
  }

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader title="Categories" subtitle="Manage support ticket categories and their department queues." />
        {message && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select department...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="w-full">
            <Textarea rows={3} className="w-full" placeholder="Category description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button className="w-full" disabled={!form.name || !form.description || !form.department_id} onClick={create}>Add Category</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const count = tickets.filter((t) => t.category_id === c.id).length
            const dept = departments.find((d) => d.id === c.department_id)
            return (
              <div key={c.id} className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <span className={"text-xs font-bold " + (c.is_active ? "text-emerald-600" : "text-slate-400")}>{c.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{c.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{(dept?.name ?? "General") + " • " + count + " tickets"}</span>
                  <Button size="sm" variant="secondary" onClick={() => void toggle(c.id, !c.is_active)}>{c.is_active ? "Deactivate" : "Activate"}</Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}