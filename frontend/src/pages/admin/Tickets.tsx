import { useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { SearchInput } from "@/components/ui/Input"
import { useTickets, useCategories, useDepartments } from "@/hooks/useData"

export function AdminTickets() {
  const { tickets, loading, error } = useTickets()
  const { categories } = useCategories()
  const { departments } = useDepartments()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deptFilter, setDeptFilter] = useState("all")
  const [catFilter, setCatFilter] = useState("all")

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const catDeptMap = Object.fromEntries(categories.map((c) => [c.id, c.department_id]))

  const filtered = tickets.filter((t) => {
    const term = search.toLowerCase()
    const matchesSearch = t.ticket_number.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term) || t.requestor.toLowerCase().includes(term) || (t.assignedTo ?? "").toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || t.statusDb === statusFilter
    const tDeptId = catDeptMap[t.category_id]
    const matchesDept = deptFilter === "all" || tDeptId === deptFilter
    const matchesCat = catFilter === "all" || t.category_id === catFilter
    return matchesSearch && matchesStatus && matchesDept && matchesCat
  })

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Support Tickets"
          subtitle="Tickets are auto-routed to their department queue based on the chosen category."
          action={<span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700">Showing {filtered.length} of {tickets.length} tickets</span>}
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center">
          <div className="flex-1 w-full">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets, subject, requestor, or assignee..." className="w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCatFilter("all") }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <option value="all">All Categories</option>
              {categories.filter((c) => deptFilter === "all" || c.department_id === deptFilter).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-3 w-28">Ticket</th>
                <th className="py-3.5 px-3">Subject</th>
                <th className="py-3.5 px-3 w-40">Requestor</th>
                <th className="py-3.5 px-3 w-52">Department & Category</th>
                <th className="py-3.5 px-3 w-24">Priority</th>
                <th className="py-3.5 px-3 w-24">Status</th>
                <th className="py-3.5 px-3 w-44">Assigned Developer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const deptId = catDeptMap[t.category_id]
                const deptName = deptId ? deptMap[deptId] : "Unmapped"
                const url = "/admin/tickets/" + t.id
                return (
                  <tr key={t.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">
                      <Link to={url} className="hover:underline">#{t.ticket_number}</Link>
                    </td>
                    <td className="py-3.5 px-3 truncate">
                      <Link to={url} className="font-semibold text-slate-900 hover:text-indigo-600 block truncate">{t.subject}</Link>
                      {t.resolution_comment && <p className="mt-0.5 truncate text-xs text-emerald-700">✓ {t.resolution_comment}</p>}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700 truncate">{t.requestor}</td>
                    <td className="py-3.5 px-3 truncate">
                      <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{deptName}</span>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{t.category}</p>
                    </td>
                    <td className="py-3.5 px-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-3.5 px-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3.5 px-3 truncate">
                      {t.assignedTo ? (
                        <span className="text-xs font-semibold text-slate-800">{t.assignedTo}</span>
                      ) : (
                        <Link to={url} className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">Assign Developer →</Link>
                      )}
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