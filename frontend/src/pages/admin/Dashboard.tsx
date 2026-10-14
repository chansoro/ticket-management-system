import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, UserX, CheckCircle2, ArrowUpRight, Layers } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { useTickets } from '../../context/TicketContext'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function AdminDashboard() {
  const { tickets, developers, departments, categories } = useTickets()

  const openCount = tickets.filter((t) => t.status === 'open').length
  const assignedCount = tickets.filter((t) => t.status === 'in_progress').length
  const unassignedCount = tickets.filter((t) => !t.assignedTo && t.status !== 'resolved').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length

  const urgentQueue = tickets
    .filter((t) => t.status !== 'resolved' && (!t.assignedTo || t.priority === 'critical' || t.priority === 'high'))
    .slice(0, 8)

  const stats = [
    {
      label: 'Open Queue',
      value: openCount,
      sub: 'Awaiting triage',
      icon: AlertCircle,
      color: 'bg-blue-50 text-blue-600 ring-blue-500/20',
    },
    {
      label: 'In Progress',
      value: assignedCount,
      sub: 'Actively worked on',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 ring-amber-500/20',
    },
    {
      label: 'Unassigned',
      value: unassignedCount,
      sub: 'Needs developer assignment',
      icon: UserX,
      color: 'bg-rose-50 text-rose-600 ring-rose-500/20',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      sub: 'Completed with notes',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Dashboard</h1>
            <p className="text-sm text-slate-500">
              Real-time overview of service requests, department queues, and developer capacity.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
            to="/admin/tickets"
          >
            <span>Manage All Tickets</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className="mt-1.5 text-3xl font-extrabold text-slate-900">{item.value}</p>
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
                <p className="text-xs text-slate-500">
                  Tickets requiring immediate developer assignment or high-priority resolution.
                </p>
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
                    <th className="py-3 px-4">Subject & Department</th>
                    <th className="py-3 px-4">Requestor</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {urgentQueue.map((ticket) => {
                    const cat = categories.find((c) => c.id === ticket.categoryId)
                    const dept = departments.find((d) => d.id === cat?.departmentId)
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">
                          <Link className="hover:underline" to={`/admin/tickets/${ticket.id}`}>
                            #{ticket.ticketNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                            to={`/admin/tickets/${ticket.id}`}
                          >
                            {ticket.subject}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {dept?.name || 'General'} • {ticket.categoryName}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{ticket.requestorName}</td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {ticket.assignedToName || (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Department Active Queues</h2>
                  <p className="text-xs text-slate-500">Open & in-progress tickets routed by category.</p>
                </div>
                <Layers className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="space-y-3">
                {departments.map((dept) => {
                  const deptCatIds = categories.filter((c) => c.departmentId === dept.id).map((c) => c.id)
                  const activeDeptTickets = tickets.filter(
                    (t) => deptCatIds.includes(t.categoryId) && t.status !== 'resolved'
                  ).length
                  const unassignedDept = tickets.filter(
                    (t) => deptCatIds.includes(t.categoryId) && t.status === 'open' && !t.assignedTo
                  ).length
                  return (
                    <div key={dept.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{dept.name}</span>
                        <span className="text-xs font-semibold text-indigo-600">{activeDeptTickets} active</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{dept.email}</span>
                        {unassignedDept > 0 ? (
                          <span className="font-semibold text-amber-600">{unassignedDept} awaiting assignee</span>
                        ) : (
                          <span className="text-emerald-600">All assigned</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Developer Capacity & Active Load</h2>
              <p className="text-xs text-slate-500 mb-4">
                Active vs. resolved ticket distribution across engineering specialists.
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {developers.map((dev) => {
                  const active = tickets.filter((t) => t.assignedTo === dev.id && t.status !== 'resolved').length
                  const resolved = tickets.filter((t) => t.assignedTo === dev.id && t.status === 'resolved').length
                  const dept = departments.find((d) => d.id === dev.departmentId)
                  return (
                    <div key={dev.id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{dev.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{dept?.name || 'Unassigned Dept'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          {active} active
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {resolved} done
                        </span>
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
