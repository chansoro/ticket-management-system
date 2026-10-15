import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { useTickets, useProfiles, useDepartments, useCategories } from "@/hooks/useData"
import { AlertCircle, Clock, UserX, CheckCircle2 } from "lucide-react"

export function AdminDashboard() {
  const { tickets, loading, error } = useTickets()
  const { profiles } = useProfiles()
  const { departments } = useDepartments()
  const { categories } = useCategories()

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const openCount = tickets.filter((t) => t.statusDb === "open").length
  const assignedCount = tickets.filter((t) => t.statusDb === "in_progress").length
  const unassignedCount = tickets.filter((t) => !t.assigned_to && t.statusDb !== "resolved").length
  const resolvedCount = tickets.filter((t) => t.statusDb === "resolved").length

  const urgentQueue = tickets
    .filter((t) => t.statusDb !== "resolved" && (!t.assigned_to || t.priorityDb === "critical" || t.priorityDb === "high"))
    .slice(0, 8)

  const developers = profiles.filter((p) => p.role === "developer")

  const stats = [
    { label: "Open Queue", value: openCount, sub: "Awaiting triage", icon: AlertCircle, color: "bg-blue-50 text-blue-600 ring-blue-500/20" },
    { label: "In Progress", value: assignedCount, sub: "Actively worked on", icon: Clock, color: "bg-amber-50 text-amber-600 ring-amber-500/20" },
    { label: "Unassigned", value: unassignedCount, sub: "Needs developer assignment", icon: UserX, color: "bg-rose-50 text-rose-600 ring-rose-500/20" },
    { label: "Resolved", value: resolvedCount, sub: "Completed with notes", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 ring-emerald-500/20" },
  ]

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Operations Dashboard"
          subtitle="Real-time overview of service requests, department queues, and developer capacity."
          action={
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
            >
              Manage All Tickets →
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Unassigned & Priority Queue</h2>
                <p className="text-xs text-slate-500">Tickets requiring immediate developer assignment or high-priority triage.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {urgentQueue.length} shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Subject & Category</th>
                    <th className="py-3 px-4">Requestor</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {urgentQueue.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">
                        <Link to={`/admin/tickets/${ticket.id}`} className="hover:underline">
                          #{ticket.ticket_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link to={`/admin/tickets/${ticket.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1">
                          {ticket.subject}
                        </Link>
                        <p className="text-xs text-slate-500">{ticket.category}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{ticket.requestor}</td>
                      <td className="py-3.5 px-4"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={ticket.status} /></td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {ticket.assignedTo ?? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">
                            Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!urgentQueue.length && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                        All priority tickets have been assigned and resolved.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Department Active Queues</h2>
              <p className="text-xs text-slate-500 mb-4">Tickets routed automatically by category.</p>
              <div className="space-y-3">
                {departments.map((dept) => {
                  const deptCatIds = categories.filter((c) => c.department_id === dept.id).map((c) => c.id)
                  const activeCount = tickets.filter((t) => deptCatIds.includes(t.category_id) && t.statusDb !== "resolved").length
                  return (
                    <div key={dept.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{dept.name}</span>
                        <span className="text-indigo-600 font-semibold">{activeCount} active</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{dept.email}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Developer Capacity</h2>
              <p className="text-xs text-slate-500 mb-4">Active load across specialists.</p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {developers.map((dev) => {
                  const active = tickets.filter((t) => t.assigned_to === dev.id && t.statusDb !== "resolved").length
                  const resolved = tickets.filter((t) => t.assigned_to === dev.id && t.statusDb === "resolved").length
                  return (
                    <div key={dev.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{dev.full_name}</p>
                        <p className="text-slate-400">{dev.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">{active} active</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">{resolved} done</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
